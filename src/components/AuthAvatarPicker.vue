<template>
    <div class="avatar-upload-section">
        <button type="button" class="avatar-preview" @click="openFilePicker" aria-label="Selecionar ou alterar avatar">
            <img v-if="previewUrl" :src="previewUrl" alt="Pré-visualização do avatar" />
            <ion-icon v-else :icon="personOutline" class="avatar-placeholder-icon" />
            <span class="avatar-overlay" aria-hidden="true">
                <ion-icon :icon="cameraOutline" />
            </span>
        </button>
        <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden-file-input"
            aria-label="Selecionar imagem de perfil" @change="handleFileSelected" />
        <span class="avatar-hint">{{ hint }}</span>

        <IonModal :is-open="isCropperOpen" class="avatar-cropper-modal" @didDismiss="closeCropper"
            @didPresent="drawPreview">
            <div class="cropper-dialog" role="dialog" aria-modal="true" aria-labelledby="cropper-title">
                <h2 id="cropper-title">Ajustar foto de perfil</h2>
                <p class="cropper-description">Arraste a imagem para posicioná-la no recorte.</p>

                <canvas
                    ref="previewCanvas"
                    class="crop-preview"
                    width="280"
                    height="280"
                    aria-label="Pré-visualização do recorte da foto"
                    @pointerdown="startDragging"
                    @pointermove="dragImage"
                    @pointerup="stopDragging"
                    @pointercancel="stopDragging"
                />

                <div class="cropper-controls">
                    <label class="cropper-control">
                        <span>Zoom <output>{{ zoom.toFixed(1) }}×</output></span>
                        <input v-model.number="zoom" type="range" min="1" max="4" step="0.1"
                            aria-label="Ajustar zoom da foto" @input="drawPreview" />
                    </label>
                    <label class="cropper-control">
                        <span>Ângulo <output>{{ angle }}°</output></span>
                        <input v-model.number="angle" type="range" min="-180" max="180" step="1"
                            aria-label="Ajustar ângulo da foto" @input="drawPreview" />
                    </label>
                    <div class="cropper-actions">
                        <ion-button type="button" fill="outline" @click="rotateBy(-90)">Girar à esquerda</ion-button>
                        <ion-button type="button" fill="outline" @click="rotateBy(90)">Girar à direita</ion-button>
                        <ion-button type="button" fill="outline" @click="restoreOriginalPosition">
                            Posição original
                        </ion-button>
                    </div>
                </div>

                <p v-if="cropperError" class="cropper-error" role="alert">{{ cropperError }}</p>

                <div class="cropper-footer">
                    <ion-button type="button" fill="clear" @click="openFilePicker">Selecionar outra imagem</ion-button>
                    <div class="cropper-footer-actions">
                        <ion-button type="button" fill="clear" @click="closeCropper">Cancelar</ion-button>
                        <ion-button type="button" :disabled="!sourceImage" @click="confirmCrop">Usar foto</ion-button>
                    </div>
                </div>
            </div>
        </IonModal>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue';
import { IonButton, IonIcon, IonModal } from '@ionic/vue';
import { cameraOutline, personOutline } from 'ionicons/icons';

defineProps<{ previewUrl: string; hint: string }>();
const emit = defineEmits<{ (event: 'selected', file: File): void }>();

const CROP_SIZE = 512;
const fileInput = ref<HTMLInputElement | null>(null);
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const sourceImage = ref<HTMLImageElement | null>(null);
const isCropperOpen = ref(false);
const cropperError = ref('');
const zoom = ref(1);
const angle = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);
let sourceObjectUrl = '';
let sourceFileName = 'avatar';
let isDragging = false;
let lastPointerX = 0;
let lastPointerY = 0;

const openFilePicker = () => {
    if (fileInput.value) fileInput.value.value = '';
    fileInput.value?.click();
};

const handleFileSelected = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        cropperError.value = 'Selecione um arquivo de imagem válido.';
        isCropperOpen.value = true;
        return;
    }

    if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
    sourceObjectUrl = URL.createObjectURL(file);
    sourceFileName = file.name;
    cropperError.value = '';
    sourceImage.value = null;
    zoom.value = 1;
    angle.value = 0;
    offsetX.value = 0;
    offsetY.value = 0;
    isCropperOpen.value = true;

    const image = new Image();
    image.onload = async () => {
        sourceImage.value = image;
        await nextTick();
        drawPreview();
    };
    image.onerror = () => {
        cropperError.value = 'Não foi possível abrir esta imagem. Selecione outro arquivo.';
    };
    image.src = sourceObjectUrl;
};

const getDrawMetrics = (size: number) => {
    const image = sourceImage.value;
    if (!image) return null;

    const radians = angle.value * Math.PI / 180;
    const rotatedWidth = Math.abs(image.naturalWidth * Math.cos(radians))
        + Math.abs(image.naturalHeight * Math.sin(radians));
    const rotatedHeight = Math.abs(image.naturalWidth * Math.sin(radians))
        + Math.abs(image.naturalHeight * Math.cos(radians));
    const scale = Math.max(size / rotatedWidth, size / rotatedHeight) * zoom.value;
    const maxOffsetX = Math.max(0, (rotatedWidth * scale - size) / 2);
    const maxOffsetY = Math.max(0, (rotatedHeight * scale - size) / 2);
    const offsetScale = size / (previewCanvas.value?.width || size);

    return {
        radians,
        scale,
        x: Math.min(maxOffsetX, Math.max(-maxOffsetX, offsetX.value * offsetScale)),
        y: Math.min(maxOffsetY, Math.max(-maxOffsetY, offsetY.value * offsetScale))
    };
};

const drawCrop = (canvas: HTMLCanvasElement, size: number) => {
    const image = sourceImage.value;
    const context = canvas.getContext('2d');
    const metrics = getDrawMetrics(size);
    if (!image || !context || !metrics) return false;

    context.clearRect(0, 0, size, size);
    context.save();
    context.translate(size / 2 + metrics.x, size / 2 + metrics.y);
    context.rotate(metrics.radians);
    context.scale(metrics.scale, metrics.scale);
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    context.restore();
    return true;
};

const drawPreview = () => {
    if (previewCanvas.value) drawCrop(previewCanvas.value, previewCanvas.value.width);
};

const rotateBy = (degrees: number) => {
    angle.value = ((angle.value + degrees + 180) % 360 + 360) % 360 - 180;
    drawPreview();
};

const restoreOriginalPosition = () => {
    zoom.value = 1;
    angle.value = 0;
    offsetX.value = 0;
    offsetY.value = 0;
    drawPreview();
};

const getPointerPosition = (event: PointerEvent) => {
    const rect = previewCanvas.value?.getBoundingClientRect();
    if (!rect || !previewCanvas.value) return null;
    return {
        x: (event.clientX - rect.left) * previewCanvas.value.width / rect.width,
        y: (event.clientY - rect.top) * previewCanvas.value.height / rect.height
    };
};

const startDragging = (event: PointerEvent) => {
    const position = getPointerPosition(event);
    if (!position || !sourceImage.value) return;
    isDragging = true;
    lastPointerX = position.x;
    lastPointerY = position.y;
    previewCanvas.value?.setPointerCapture(event.pointerId);
};

const dragImage = (event: PointerEvent) => {
    if (!isDragging) return;
    const position = getPointerPosition(event);
    if (!position) return;
    offsetX.value += position.x - lastPointerX;
    offsetY.value += position.y - lastPointerY;
    lastPointerX = position.x;
    lastPointerY = position.y;
    drawPreview();
};

const stopDragging = () => {
    isDragging = false;
};

const closeCropper = () => {
    isCropperOpen.value = false;
    sourceImage.value = null;
    cropperError.value = '';
    isDragging = false;
    if (sourceObjectUrl) {
        URL.revokeObjectURL(sourceObjectUrl);
        sourceObjectUrl = '';
    }
};

const confirmCrop = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    if (!drawCrop(canvas, CROP_SIZE)) {
        cropperError.value = 'Não foi possível preparar o recorte. Selecione a imagem novamente.';
        return;
    }

    try {
        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((result) => {
                if (result) resolve(result);
                else reject(new Error('Falha ao gerar a imagem recortada.'));
            }, 'image/webp', 0.88);
        });
        const baseName = sourceFileName.replace(/\.[^.]+$/, '') || 'avatar';
        emit('selected', new File([blob], `${baseName}.webp`, { type: 'image/webp' }));
        closeCropper();
    } catch (error) {
        cropperError.value = error instanceof Error
            ? `Não foi possível salvar o recorte: ${error.message}`
            : 'Não foi possível salvar o recorte.';
    }
};

watch([zoom, angle], drawPreview);
onUnmounted(closeCropper);
</script>

<style scoped>
.avatar-upload-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.avatar-preview {
    position: relative;
    width: 90px;
    height: 90px;
    padding: 0;
    border: 2px dashed var(--color-border, #9A8C98);
    border-radius: 50%;
    background: var(--color-surface-alt, #EEE5DE);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: pointer;
}

.avatar-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-placeholder-icon {
    font-size: 40px;
    color: var(--color-text-muted, #6E6C7C);
}

.avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    color: #FFFFFF;
    font-size: 22px;
}

.avatar-preview:hover .avatar-overlay,
.avatar-preview:focus-visible .avatar-overlay {
    opacity: 1;
}

.hidden-file-input {
    display: none;
}

.avatar-hint {
    font-size: 12px;
    color: var(--color-text-muted, #6E6C7C);
}

.avatar-cropper-modal {
    --width: min(460px, calc(100vw - 32px));
    --height: auto;
    --border-radius: 18px;
}

.cropper-dialog {
    max-height: min(90vh, 760px);
    overflow-y: auto;
    padding: 24px;
    background: var(--color-surface, #FFFFFF);
    color: var(--color-text-primary, #22223B);
}

.cropper-dialog h2 {
    margin: 0;
    font-size: 20px;
}

.cropper-description {
    margin: 8px 0 18px;
    color: var(--color-text-secondary, #4A4E69);
    font-size: 14px;
}

.crop-preview {
    display: block;
    width: min(280px, 100%);
    height: auto;
    margin: 0 auto 20px;
    border-radius: 50%;
    background-color: var(--color-surface-alt, #EEE5DE);
    cursor: grab;
    touch-action: none;
}

.crop-preview:active {
    cursor: grabbing;
}

.cropper-controls {
    display: grid;
    gap: 16px;
}

.cropper-control {
    display: grid;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
}

.cropper-control span {
    display: flex;
    justify-content: space-between;
}

.cropper-control input {
    width: 100%;
    accent-color: var(--color-brand-primary, #3B52F6);
}

.cropper-actions,
.cropper-footer,
.cropper-footer-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.cropper-actions {
    justify-content: center;
}

.cropper-footer {
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 14px;
    border-top: 1px solid var(--color-border-soft, #E6DBD4);
}

.cropper-footer-actions {
    flex-shrink: 0;
}

.cropper-error {
    margin: 14px 0 0;
    color: var(--color-danger, #B42318);
    font-size: 13px;
}

@media (max-width: 420px) {
    .cropper-dialog {
        padding: 18px;
    }

    .cropper-actions,
    .cropper-footer {
        flex-wrap: wrap;
    }

    .cropper-footer {
        align-items: flex-start;
    }

    .cropper-footer-actions {
        margin-left: auto;
    }
}
</style>
