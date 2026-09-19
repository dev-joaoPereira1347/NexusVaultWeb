<template>
    <div class="avatar-upload-section">
        <button type="button" class="avatar-preview" @click="openFilePicker" aria-label="Selecionar avatar">
            <img v-if="previewUrl" :src="previewUrl" alt="Pré-visualização do avatar" />
            <ion-icon v-else :icon="personOutline" class="avatar-placeholder-icon" />
            <span class="avatar-overlay" aria-hidden="true">
                <ion-icon :icon="cameraOutline" />
            </span>
        </button>
        <input ref="fileInput" type="file" accept="image/webp" class="hidden-file-input" @change="handleFileSelected" />
        <span class="avatar-hint">{{ hint }}</span>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonIcon } from '@ionic/vue';
import { cameraOutline, personOutline } from 'ionicons/icons';

defineProps<{ previewUrl: string; hint: string }>();
const emit = defineEmits<{ (event: 'selected', file: File): void }>();
const fileInput = ref<HTMLInputElement | null>(null);

const openFilePicker = () => fileInput.value?.click();

const handleFileSelected = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) emit('selected', file);
};
</script>

<style scoped>
.avatar-upload-section { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 8px; }
.avatar-preview { position: relative; width: 90px; height: 90px; padding: 0; border: 2px dashed var(--color-border, #9A8C98); border-radius: 50%; background: var(--color-surface-alt, #EEE5DE); display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; }
.avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder-icon { font-size: 40px; color: var(--color-text-muted, #6E6C7C); }
.avatar-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.35); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease; color: #FFFFFF; font-size: 22px; }
.avatar-preview:hover .avatar-overlay, .avatar-preview:focus-visible .avatar-overlay { opacity: 1; }
.hidden-file-input { display: none; }
.avatar-hint { font-size: 12px; color: var(--color-text-muted, #6E6C7C); }
</style>