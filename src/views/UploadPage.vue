<template>
    <IonPage>
        <IonContent :fullscreen="true" :scroll-y="true" class="main-content">
            <SiteHeader />

            <main class="shelf-background">
                <section class="upload-card nv-surface" aria-labelledby="page-title">
                    <header class="card-header nv-page-heading">
                        <h1 id="page-title" class="card-title nv-page-title">Adicionar conteúdo</h1>
                        <p class="card-subtitle nv-page-description">
                            Envie um arquivo e revise os dados antes de adicioná-lo à biblioteca.
                        </p>
                    </header>

                    <ol class="upload-steps" aria-label="Etapas do envio">
                        <li
                            :class="{ 'step-complete': Boolean(selectedFile), 'step-active': !selectedFile }"
                            :aria-current="!selectedFile ? 'step' : undefined"
                        >
                            <span>1</span> Arquivo
                        </li>
                        <li
                            :class="{ 'step-active': fileReadCompleted, 'step-pending': !fileReadCompleted }"
                            :aria-current="fileReadCompleted ? 'step' : undefined"
                        >
                            <span>2</span> Revisão
                        </li>
                    </ol>

                    <section class="upload-stage" :class="{ 'upload-stage-selected': selectedFile }" aria-label="Arquivo do conteúdo">
                        <UploadDropzone :file="selectedFile" :disabled="isUploading" @select="processFile" @clear="clearSelectedFile" />
                        <p v-if="metadataMessage" class="metadata-status" role="status" aria-live="polite">
                            {{ metadataMessage }}
                        </p>
                        <p v-else-if="selectedFile && !metadataLookupCompleted" class="metadata-status" role="status" aria-live="polite">
                            Lendo o arquivo e buscando metadados...
                        </p>
                        <div v-if="isUploading" class="upload-progress" role="status" aria-live="polite">
                            <p>
                                {{ uploadProgress === 100
                                    ? 'Envio concluído.'
                                    : uploadProgress >= 95
                                        ? `Finalizando envio... ${uploadProgress}%`
                                        : `Enviando arquivo... ${uploadProgress}%` }}
                            </p>
                            <progress :value="uploadProgress" max="100" aria-label="Progresso do envio" />
                        </div>
                    </section>

                    <UploadMetadataForm
                        v-if="selectedFile && fileReadCompleted"
                        v-model="form"
                        :is-valid="isFormValid"
                        :is-uploading="isUploading"
                        :metadata-missing-fields="metadataMissingFields"
                        :auto-filled-fields="autoFilledFields"
                        :cover-metadata-warning="metadataCoverWarning"
                        :embedded-cover="embeddedCoverFile"
                        :show-collection-picker="form.type === 'livro'"
                        :selected-collection-count="selectedCollectionIds.length"
                        show-rights-declaration
                        @open-collection-picker="isCollectionPickerOpen = true"
                        @submit="submitForm"
                    />
                </section>
            </main>

            <SiteFooter />
        </IonContent>
        <AddBookToCollectionModal
            :is-open="isCollectionPickerOpen"
            :book="uploadBook"
            selection-only
            :selected-ids="selectedCollectionIds"
            @close="isCollectionPickerOpen = false"
            @update-selected="selectedCollectionIds = $event"
        />
    </IonPage>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { IonContent, IonPage, toastController } from '@ionic/vue';
import { useRouter } from 'vue-router';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import UploadDropzone from '../components/UploadDropzone.vue';
import UploadMetadataForm from '../components/UploadMetadataForm.vue';
import AddBookToCollectionModal from '@/components/AddBookToCollectionModal.vue';
import type { UploadForm } from '../types/upload';
import { uploadLibraryItem } from '@/services/uploadService';
import { findOpenLibraryMetadata } from '@/services/openLibraryMetadataService';
import { parsePublicationYear } from '@/utils/publicationYear';
import { ALLOWED_DOCUMENT_EXTENSIONS, MAX_DOCUMENT_FILE_SIZE_BYTES } from '@/constants/uploadConfig';

type MetadataField = 'title' | 'author' | 'category' | 'type' | 'year' | 'language' | 'genre' | 'description';
type AutoFilledField = MetadataField;
const selectedFile = ref<File | null>(null);
const router = useRouter();
const isUploading = ref(false);
const uploadProgress = ref(0);
const metadataMessage = ref('');
const fileReadCompleted = ref(false);
const metadataLookupCompleted = ref(false);
const metadataCoverWarning = ref(false);
const embeddedCoverFile = ref<File | null>(null);
const autoFilledFields = ref<AutoFilledField[]>([]);
const isCollectionPickerOpen = ref(false);
const selectedCollectionIds = ref<string[]>([]);
let metadataRequestId = 0;
let metadataController: AbortController | null = null;

const form = reactive<UploadForm>({
    title: '',
    author: '',
    category: '',
    year: '',
    type: '',
    genre: '',
    language: '',
    description: '',
    cover: null,
    rightsDeclarationAccepted: false
});

const uploadBook = computed(() => ({
    id: 'upload',
    title: form.title.trim() || 'Novo livro'
}));

watch(() => form.type, (type) => {
    if (type !== 'livro') selectedCollectionIds.value = [];
});

const metadataMissingFields = computed<MetadataField[]>(() => {
    if (!metadataLookupCompleted.value) return [];

    return [
        ...(!form.title.trim() ? ['title' as const] : []),
        ...(!form.author.trim() ? ['author' as const] : []),
        ...(!form.category ? ['category' as const] : []),
        ...(!form.type ? ['type' as const] : []),
        ...(!parsePublicationYear(form.year) ? ['year' as const] : []),
        ...(!form.language ? ['language' as const] : []),
        ...(!form.genre.trim() ? ['genre' as const] : []),
        ...(!form.description.trim() ? ['description' as const] : [])
    ];
});

watch(fileReadCompleted, async (read) => {
    if (!read) return;
    await nextTick();
    document.getElementById('metadata-title')?.focus();
});

const processFile = (file: File) => {
    if (isUploading.value) return;
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !ALLOWED_DOCUMENT_EXTENSIONS.has(fileExtension)) {
        presentToast('Formato não suportado. Utilize PDF, TXT, EPUB ou MD.', 'warning');
        return;
    }

    if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
        presentToast('O arquivo não pode ser maior que 50MB.', 'danger');
        return;
    }

    metadataController?.abort();
    selectedFile.value = file;
    const requestId = ++metadataRequestId;
    metadataController = new AbortController();
    fileReadCompleted.value = false;
    metadataLookupCompleted.value = false;
    metadataCoverWarning.value = false;
    embeddedCoverFile.value = null;
    form.cover = null;
    autoFilledFields.value = [];
    metadataMessage.value = 'Lendo o arquivo e buscando metadados na Open Library...';
    void lookupMetadata(file, requestId, metadataController.signal);
};

const clearSelectedFile = (force = false) => {
    if (isUploading.value && !force) return;
    metadataController?.abort();
    metadataController = null;
    metadataRequestId += 1;
    selectedFile.value = null;
    fileReadCompleted.value = false;
    metadataMessage.value = '';
    metadataLookupCompleted.value = false;
    metadataCoverWarning.value = false;
    embeddedCoverFile.value = null;
    autoFilledFields.value = [];
};

const fillMetadataIfEmpty = (
    field: AutoFilledField,
    currentValue: string,
    metadataValue: string,
    update: () => void
) => {
    if (currentValue.trim() || !metadataValue.trim()) return;
    update();
    if (!autoFilledFields.value.includes(field)) autoFilledFields.value.push(field);
};

const lookupMetadata = async (file: File, requestId: number, signal: AbortSignal) => {
    try {
        const result = await findOpenLibraryMetadata(file, signal, () => {
            if (requestId !== metadataRequestId) return;
            fileReadCompleted.value = true;
            metadataMessage.value = 'Arquivo lido. Buscando metadados para preencher os campos...';
        });
        if (requestId !== metadataRequestId) return;

        embeddedCoverFile.value = result?.embeddedCover ?? null;
        if (!result?.metadata) {
            metadataLookupCompleted.value = true;
            metadataMessage.value = result?.lookupWarning
                ? 'Não foi possível consultar a Open Library. Preencha os dados manualmente.'
                : result?.extractionWarning
                ? 'Não foi possível ler o arquivo. Preencha os dados manualmente.'
                : 'Nenhuma correspondência encontrada. Preencha os dados manualmente.';
            return;
        }

        metadataLookupCompleted.value = true;
        const metadata = result.metadata;
        fillMetadataIfEmpty('title', form.title, metadata.title, () => { form.title = metadata.title; });
        fillMetadataIfEmpty('author', form.author, metadata.author, () => { form.author = metadata.author; });
        if (!form.category || (form.category === 'outros' && metadata.category !== 'outros')) {
            form.category = metadata.category;
            if (!autoFilledFields.value.includes('category')) autoFilledFields.value.push('category');
        }
        fillMetadataIfEmpty('type', form.type, metadata.type, () => { form.type = metadata.type; });
        if (parsePublicationYear(metadata.year.toString()) !== null) {
            fillMetadataIfEmpty('year', form.year, metadata.year.toString(), () => { form.year = metadata.year.toString(); });
        }
        fillMetadataIfEmpty('genre', form.genre, metadata.genre, () => { form.genre = metadata.genre; });
        fillMetadataIfEmpty('language', form.language, metadata.language, () => { form.language = metadata.language; });
        fillMetadataIfEmpty('description', form.description, metadata.description.slice(0, 3000), () => {
            form.description = metadata.description.slice(0, 3000);
        });

        const usedAutomaticCover = !form.cover && result.cover !== null;
        if (usedAutomaticCover) form.cover = result.cover;
        metadataCoverWarning.value = Boolean(result.coverWarning && !form.cover);
        metadataMessage.value = result.extractionWarning
            ? 'Dados encontrados pelo nome do arquivo. Revise os campos destacados.'
            : 'Metadados encontrados. Revise os campos destacados.';
    } catch {
        if (signal.aborted || requestId !== metadataRequestId) return;
        fileReadCompleted.value = true;
        metadataLookupCompleted.value = true;
        metadataMessage.value = 'Não foi possível consultar os metadados. Preencha os dados manualmente.';
    } finally {
        if (requestId === metadataRequestId) metadataController = null;
    }
};

onBeforeUnmount(() => {
    metadataController?.abort();
});

const isFormValid = computed(() => {
    return Boolean(
        selectedFile.value &&
        form.title.trim() &&
        form.author.trim() &&
        form.category &&
        form.type &&
        parsePublicationYear(form.year) !== null &&
        form.rightsDeclarationAccepted
    );
});

const presentToast = async (message: string, color: 'success' | 'warning' | 'danger') => {
    const toast = await toastController.create({
        message,
        duration: color === 'danger' ? 6000 : 3000,
        color,
        position: 'bottom'
    });

    await toast.present();
};

const resetForm = () => {
    clearSelectedFile(true);
    form.title = '';
    form.author = '';
    form.category = '';
    form.year = '';
    form.type = '';
    form.genre = '';
    form.language = '';
    form.description = '';
    form.cover = null;
    embeddedCoverFile.value = null;
    form.rightsDeclarationAccepted = false;
    selectedCollectionIds.value = [];
    isCollectionPickerOpen.value = false;
};

const submitForm = async () => {
    if (!selectedFile.value || !isFormValid.value) return;

    try {
        isUploading.value = true;
        uploadProgress.value = 0;

        const collectionCount = form.type === 'livro' ? selectedCollectionIds.value.length : 0;
        const request = await uploadLibraryItem(
            selectedFile.value,
            { ...form },
            (progress) => { uploadProgress.value = progress; },
            collectionCount ? selectedCollectionIds.value : []
        );
        const collectionFeedback = collectionCount
            ? ` Após a aprovação, o livro será adicionado a ${collectionCount} ${collectionCount === 1 ? 'coleção selecionada' : 'coleções selecionadas'}.`
            : '';
        await presentToast(
            `${request.status_message
                ? request.status_message
                : 'Envio recebido. A verificação acontece em segundo plano; acompanhe o resultado em Meus envios.'}${collectionFeedback}`,
            request.status_message ? 'warning' : 'success'
        );
        resetForm();
        await router.replace({ name: 'Profile', query: { tab: 'uploads' } });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        const message = errorMessage.includes('Também não foi possível limpar arquivos temporários')
            ? 'O envio falhou e alguns arquivos temporários não puderam ser removidos. Contate o suporte.'
            : errorMessage === 'É necessário estar autenticado para enviar conteúdo.'
                ? 'Sua sessão expirou. Entre novamente para enviar conteúdo.'
                : 'Não foi possível enviar o conteúdo. Verifique sua conexão e tente novamente.';
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

.upload-steps {
    display: flex;
    justify-content: center;
    gap: clamp(24px, 8vw, 100px);
    margin: 0 auto var(--space-xl);
    padding: 0;
    list-style: none;
}

.upload-steps li {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    font-weight: 700;
}

.upload-steps li > span {
    display: grid;
    width: 30px;
    height: 30px;
    place-items: center;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    color: inherit;
}

.upload-steps .step-active {
    color: var(--color-brand-primary);
}

.upload-steps .step-active > span,
.upload-steps .step-complete > span {
    border-color: var(--color-brand-primary);
    background: var(--color-brand-primary);
    color: var(--color-white);
}

.upload-stage,
.upload-card :deep(.form-wrapper) {
    width: min(100%, 780px);
    margin-inline: auto;
}

.upload-stage {
    margin-bottom: var(--space-xl);
}

.upload-stage-selected {
    margin-bottom: var(--space-lg);
}

.metadata-status {
    margin: 12px 0 0;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
}

.upload-progress {
    margin-top: 16px;
}

.upload-progress p {
    margin: 0 0 8px;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
}

.upload-progress progress {
    display: block;
    width: 100%;
    height: 10px;
    accent-color: var(--color-primary);
}

@media (max-width: 820px) {
    .shelf-background {
        min-height: 0;
        padding: var(--space-lg) var(--page-gutter);
    }
}
</style>