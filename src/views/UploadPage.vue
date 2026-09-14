<template>
    <ion-page>
        <ion-content :fullscreen="true" :scroll-y="true" class="main-content">
            <Header />

            <main class="shelf-background">
                <section class="upload-card" aria-labelledby="page-title">
                    <header class="card-header">
                        <h1 id="page-title" class="card-title">Adicionar conteúdo</h1>
                        <p class="card-subtitle">
                            Envie um arquivo para adicionar à biblioteca do NexusVault.
                        </p>
                    </header>

                    <div class="card-grid">
                        <UploadDropzone
                            :file="selectedFile"
                            @select="processFile"
                            @clear="clearSelectedFile"
                        />

                        <UploadMetadataForm
                            v-model="form"
                            :is-valid="isFormValid"
                            :is-uploading="isUploading"
                            @submit="submitForm"
                        />
                    </div>
                </section>
            </main>

            <Footer />
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { IonContent, IonPage, toastController } from '@ionic/vue';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import UploadDropzone from '../components/UploadDropzone.vue';
import UploadMetadataForm from '../components/UploadMetadataForm.vue';
import type { UploadForm } from '../types/upload';

const selectedFile = ref<File | null>(null);
const isUploading = ref(false);

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
    description: ''
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
};

const clearSelectedFile = () => {
    selectedFile.value = null;
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
};

const submitForm = async () => {
    if (!isFormValid.value) return;

    try {
        isUploading.value = true;

        // Substituir pela chamada da API quando o endpoint de upload estiver disponível.
        await new Promise((resolve) => setTimeout(resolve, 1500));

        await presentToast('Livro e metadados cadastrados com sucesso!', 'success');
        resetForm();
    } catch {
        await presentToast('Erro ao realizar o upload.', 'danger');
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
    min-height: 680px;
    display: flex;
    justify-content: center;
    padding: var(--space-2xl) 20px;
    background-image:
        linear-gradient(rgba(34, 34, 59, 0.48), rgba(34, 34, 59, 0.48)),
        url('../assets/images/library.webp');
    background-position: center;
    background-size: cover;
}

.upload-card {
    width: min(100%, 1120px);
    height: fit-content;
    padding: clamp(24px, 4vw, 44px);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-medium);
}

.card-header {
    margin-bottom: var(--space-xl);
}

.card-title {
    margin: 0 0 8px;
    color: var(--color-text-primary);
    font-size: clamp(1.5rem, 3vw, 2rem);
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

@media (max-width: 820px) {
    .shelf-background {
        min-height: 0;
        padding: var(--space-xl) 16px;
    }

    .card-grid {
        grid-template-columns: 1fr;
    }
}
</style>
