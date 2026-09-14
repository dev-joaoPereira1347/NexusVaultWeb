<template>
    <section class="upload-zone-wrapper" aria-labelledby="file-upload-title">
        <div
            class="dropzone"
            role="button"
            tabindex="0"
            @click="openFilePicker"
            @keydown.enter.prevent="openFilePicker"
            @keydown.space.prevent="openFilePicker"
            @dragover.prevent
            @drop.prevent="handleDrop"
        >
            <input
                ref="fileInput"
                type="file"
                class="hidden-file-input"
                accept=".pdf,.txt,.epub,.md"
                aria-label="Selecionar arquivo"
                @change="handleFileSelect"
            />

            <template v-if="!file">
                <div class="upload-icon-circle" aria-hidden="true">
                    <ion-icon :icon="cloudUploadOutline" class="cloud-icon" />
                </div>

                <h2 id="file-upload-title" class="dropzone-title">
                    Arraste seu arquivo aqui
                </h2>

                <p class="dropzone-text">
                    ou procure um arquivo no seu computador
                </p>

                <button type="button" class="btn-select-file" @click.stop="openFilePicker">
                    SELECIONAR ARQUIVO
                </button>

                <span class="supported-formats">
                    PDF · TXT · EPUB · MD
                </span>
            </template>

            <template v-else>
                <ion-icon :icon="documentTextOutline" class="file-loaded-icon" aria-hidden="true" />

                <p class="file-loaded-name">{{ file.name }}</p>
                <span class="file-loaded-size">{{ formatFileSize(file.size) }}</span>
                <span class="file-loaded-format">{{ getFileExtension(file.name) }}</span>

                <button type="button" class="btn-remove-file" @click.stop="clearFile">
                    Trocar arquivo
                </button>
            </template>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonIcon } from '@ionic/vue';
import { cloudUploadOutline, documentTextOutline } from 'ionicons/icons';

defineProps<{
    file: File | null;
}>();

const emit = defineEmits<{
    (event: 'select', file: File): void;
    (event: 'clear'): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const openFilePicker = () => {
    fileInput.value?.click();
};

const emitFirstFile = (files: FileList | null) => {
    const file = files?.[0];
    if (file) emit('select', file);
};

const handleFileSelect = (event: Event) => {
    emitFirstFile((event.target as HTMLInputElement).files);
};

const handleDrop = (event: DragEvent) => {
    emitFirstFile(event.dataTransfer?.files ?? null);
};

const clearFile = () => {
    if (fileInput.value) fileInput.value.value = '';
    emit('clear');
};

const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toUpperCase() ?? '';
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, unitIndex);

    return `${parseFloat(size.toFixed(2))} ${units[unitIndex]}`;
};
</script>

<style scoped>
.upload-zone-wrapper {
    min-width: 0;
}

.dropzone {
    min-height: 340px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-alt);
    text-align: center;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;
}

.dropzone:hover,
.dropzone:focus-visible {
    border-color: var(--color-brand-primary);
    background: var(--color-background);
    outline: none;
}

.hidden-file-input {
    display: none;
}

.upload-icon-circle {
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    border-radius: 50%;
    background: var(--color-primary-dark);
}

.cloud-icon {
    font-size: 38px;
    color: var(--color-white);
}

.dropzone-title {
    margin: 0 0 8px;
    color: var(--color-text-primary);
    font-size: 1.1rem;
}

.dropzone-text {
    margin: 0 0 24px;
    color: var(--color-text-secondary);
}

.btn-select-file,
.btn-remove-file {
    cursor: pointer;
    font-weight: 700;
}

.btn-select-file {
    padding: 12px 28px;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--color-primary-dark);
    color: var(--color-white);
    font-size: 0.85rem;
}

.supported-formats,
.file-loaded-size,
.file-loaded-format {
    color: var(--color-text-muted);
    font-size: 0.8rem;
}

.supported-formats {
    margin-top: 16px;
}

.file-loaded-icon {
    margin-bottom: 12px;
    color: var(--color-brand-primary);
    font-size: 54px;
}

.file-loaded-name {
    max-width: 100%;
    margin: 0 0 4px;
    overflow-wrap: anywhere;
    color: var(--color-text-primary);
    font-weight: 700;
}

.file-loaded-size {
    margin-bottom: 4px;
}

.file-loaded-format {
    margin-bottom: 16px;
    font-weight: 700;
}

.btn-remove-file {
    padding: 8px 16px;
    border: 1px solid var(--color-brand-primary);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-brand-primary);
    font-size: 0.8rem;
}
</style>
