<template>
    <IonPage>
        <IonContent :fullscreen="true" :scroll-y="true" class="main-content">
            <SiteHeader />

            <main class="shelf-background">
                <section class="upload-card nv-surface" aria-labelledby="page-title">
                    <header class="card-header nv-page-heading">
                        <h1 id="page-title" class="card-title nv-page-title">Adicionar conteúdo</h1>
                        <p class="card-subtitle nv-page-description">
                            Envie um arquivo para adicionar à biblioteca do NexusVault.
                        </p>
                    </header>

                    <div class="card-grid">
                        <div class="upload-column">
                            <UploadDropzone :file="selectedFile" @select="processFile" @clear="clearSelectedFile" />
                            <p v-if="metadataMessage" class="metadata-status" role="status" aria-live="polite">
                                {{ metadataMessage }}
                            </p>
                        </div>

                        <UploadMetadataForm v-model="form" :is-valid="isFormValid" :is-uploading="isUploading"
                            @submit="submitForm" />
                    </div>
                </section>
            </main>

            <SiteFooter />
        </IonContent>
    </IonPage>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { IonContent, IonPage, toastController } from '@ionic/vue';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import UploadDropzone from '../components/UploadDropzone.vue';
import UploadMetadataForm from '../components/UploadMetadataForm.vue';
import type { UploadForm } from '../types/upload';
import { uploadLibraryItem } from '@/services/uploadService';
import { findOpenLibraryMetadata } from '@/services/openLibraryMetadataService';

const selectedFile = ref<File | null>(null);
const isUploading = ref(false);
const metadataMessage = ref('');
let metadataRequestId = 0;

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['pdf', 'txt', 'epub', 'md']);

const form = reactive<UploadForm>({
    title: '',
    author: '',
    category: '',
    year: String(new Date().getFullYear()),
    type: '',
    genre: '',
    language: '',
    description: '',
    cover: null
});

const processFile = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !ALLOWED_EXTENSIONS.has(fileExtension)) {
        presentToast('Formato não suportado. Utilize PDF, TXT, EPUB ou MD.', 'warning');
        return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        presentToast('O arquivo não pode ser maior que 50MB.', 'danger');
        return;
    }

    selectedFile.value = file;
    const requestId = ++metadataRequestId;
    metadataMessage.value = 'Lendo o arquivo e buscando metadados na Open Library...';
    void lookupMetadata(file, requestId);
};

const clearSelectedFile = () => {
    metadataRequestId += 1;
    selectedFile.value = null;
    metadataMessage.value = '';
};

const lookupMetadata = async (file: File, requestId: number) => {
    try {
        const result = await findOpenLibraryMetadata(file);
        if (requestId !== metadataRequestId) return;

        if (!result?.metadata) {
            metadataMessage.value = result?.extractionWarning
                ? `Nenhuma correspondência encontrada. A leitura do arquivo falhou: ${result.extractionWarning} Você pode preencher os dados manualmente.`
                : 'Nenhuma correspondência encontrada. Você pode preencher os dados manualmente.';
            return;
        }

        const metadata = result.metadata;
        if (!form.title.trim()) form.title = metadata.title;
        if (!form.author.trim() && metadata.author) form.author = metadata.author;
        if (!form.category || (form.category === 'outros' && metadata.category !== 'outros')) {
            form.category = metadata.category;
        }
        if (!form.type) form.type = metadata.type;
        if (form.year === String(new Date().getFullYear()) && metadata.year) {
            form.year = metadata.year;
        }
        if (!form.genre.trim() && metadata.genre) form.genre = metadata.genre;
        if (!form.language && metadata.language) form.language = metadata.language;
        if (!form.description.trim() && metadata.description) {
            form.description = metadata.description;
        }

        const usedAutomaticCover = !form.cover && result.cover !== null;
        if (usedAutomaticCover) form.cover = result.cover;

        const matchSource = result.matchedBy === 'isbn' ? 'pelo ISBN' : 'pelo título';
        const extractionNotice = result.extractionWarning
            ? ` O arquivo foi pesquisado pelo nome porque não pôde ser lido: ${result.extractionWarning}`
            : '';
        const coverNotice = result.coverWarning
            ? ` A capa encontrada não pôde ser carregada: ${result.coverWarning}`
            : usedAutomaticCover
                ? ' A capa também foi localizada.'
                : result.cover
                    ? ''
                    : ' A Open Library não disponibiliza uma capa para esta correspondência.';
        const missingFields = [
            ['ano', form.year],
            ['idioma', form.language],
            ['gênero/tema', form.genre.trim()],
            ['descrição', form.description.trim()]
        ]
            .filter(([, value]) => !value)
            .map(([label]) => label);
        const missingNotice = missingFields.length
            ? ` Não foi possível determinar ${missingFields.join(', ')} pelo documento ou pela busca; você pode preencher esses campos manualmente.`
            : '';
        metadataMessage.value = `Metadados encontrados ${matchSource}.${extractionNotice}${coverNotice}${missingNotice} Revise os dados antes de salvar.`;
    } catch (error) {
        if (requestId !== metadataRequestId) return;
        const reason = error instanceof Error ? error.message : 'Erro desconhecido.';
        metadataMessage.value = `Não foi possível consultar a Open Library: ${reason} Os campos continuam disponíveis para preenchimento manual.`;
    }
};

const isFormValid = computed(() => {
    return Boolean(
        selectedFile.value &&
        form.title.trim() &&
        form.author.trim() &&
        form.category &&
        form.type
    );
});

const presentToast = async (message: string, color: 'success' | 'warning' | 'danger') => {
    const toast = await toastController.create({
        message,
        duration: 3000,
        color,
        position: 'bottom'
    });

    await toast.present();
};

const resetForm = () => {
    clearSelectedFile();
    form.title = '';
    form.author = '';
    form.category = '';
    form.year = String(new Date().getFullYear());
    form.type = '';
    form.genre = '';
    form.language = '';
    form.description = '';
    form.cover = null;
};

const submitForm = async () => {
    if (!selectedFile.value || !isFormValid.value) return;

    try {
        isUploading.value = true;

        await uploadLibraryItem(selectedFile.value, { ...form });

        await presentToast('Livro e metadados cadastrados com sucesso!', 'success');
        resetForm();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao realizar o upload.';
        await presentToast(message, 'danger');
    } finally {
        isUploading.value = false;
    }
};
</script>

<style scoped>
.main-content {
    --background: var(--color-page-background);
}

.shelf-background {
    min-height: 60vh;
    display: flex;
    justify-content: center;
    padding: var(--page-space) var(--page-gutter);
    background: var(--color-page-background);
}

.upload-card {
    width: min(100%, var(--content-width));
    height: fit-content;
    padding: var(--surface-padding);
}

.card-header {
    margin-bottom: var(--space-xl);
}

.card-title {
    margin: 0 0 8px;
    color: var(--color-text-primary);
}

.card-subtitle {
    margin: 0;
    color: var(--color-text-secondary);
}

.card-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-xl);
    align-items: start;
}

.upload-column {
    min-width: 0;
}

.metadata-status {
    margin: 12px 0 0;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
}

@media (max-width: 820px) {
    .shelf-background {
        min-height: 0;
        padding: var(--space-lg) var(--page-gutter);
    }

    .card-grid {
        grid-template-columns: 1fr;
    }
}
</style>