<!-- src/components/DocumentCard.vue -->
<template>
    <ion-card class="nexus-document-card">
        <ion-card-content class="card-body">
            <!-- Capa / Placeholder do Documento -->
            <div class="cover-container">
                <img v-if="coverUrl" :src="coverUrl" :alt="`Capa de ${title}`" class="cover-image" />
                <div v-else class="cover-placeholder" aria-label="Capa não disponível">
                    <ion-icon :icon="documentTextOutline" class="placeholder-icon" />
                </div>
            </div>

            <!-- Detalhes do Documento -->
            <div class="info-container">
                <header class="card-header">
                    <h2 class="document-title nv-card-title">{{ title }}</h2>
                    <p class="document-author">{{ author }}</p>
                </header>

                <p class="document-description">
                    {{ description }}
                </p>

                <!-- Chips / Tags de Categoria -->
                <div v-if="tags && tags.length > 0" class="tags-row">
                    <ion-chip v-for="(tag, index) in tags" :key="index" class="tag-chip">
                        <ion-label>{{ tag }}</ion-label>
                    </ion-chip>
                </div>

                <!-- Ações do Documento -->
                <footer class="actions-row">
                    <!-- Botão Acessar -->
                    <ion-button fill="solid" class="btn-action btn-access" @click="$emit('access')">
                        Acessar
                    </ion-button>

                    <!-- Botão Download (RF13) -->
                    <ion-button fill="solid" class="btn-action btn-download" @click="$emit('download')">
                        <ion-icon slot="start" :icon="downloadOutline" />
                        Download
                    </ion-button>

                    <!-- Botão Denúncia (RF08) -->
                    <ion-button fill="clear" class="btn-report" @click="$emit('report')">
                        <ion-icon slot="start" :icon="warningOutline" />
                        Denúncia
                    </ion-button>
                </footer>
            </div>
        </ion-card-content>
    </ion-card>
</template>

<script setup lang="ts">
import {
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonChip,
    IonLabel
} from '@ionic/vue';
import {
    downloadOutline,
    warningOutline,
    documentTextOutline
} from 'ionicons/icons';

// Interface das Propriedades do Componente
interface Props {
    title?: string;
    author?: string;
    description?: string;
    coverUrl?: string;
    tags?: string[];
}

// Valores padrão alinhados ao mock da imagem
withDefaults(defineProps<Props>(), {
    title: 'O Código de Hamurabi (Traduzido)',
    author: 'Anônimo',
    description: 'Descriptião toanta em una covertor equiatno do alonInmo para authar rescuna e namaém tomtialmentis por lalto...',
    coverUrl: '',
    tags: () => ['História', 'Legal', 'Documento']
});

// Emissão de eventos para ações do card
defineEmits<{
    (e: 'access'): void;
    (e: 'download'): void;
    (e: 'report'): void;
}>();
</script>

<style scoped>
/* Card Principal */
.nexus-document-card {
    margin: 12px;
    border-radius: 12px;
    border: 1.5px solid var(--color-border-soft, #9A8C98);
    box-shadow: none;
    background-color: var(--color-surface, #FBF8F5);
    color: var(--color-text-primary, #22223B);
}

.card-body {
    display: flex;
    flex-direction: row;
    padding: 16px;
    gap: 16px;
    align-items: flex-start;
}

/* Capa / Frame da Imagem */
.cover-container {
    flex-shrink: 0;
    width: 120px;
    height: 160px;
    border-radius: 8px;
    overflow: hidden;
    background-color: #C0C0C0;
    border: 1px solid #767676;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.cover-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #555555;
}

.placeholder-icon {
    font-size: 48px;
    opacity: 0.6;
}

/* Bloco de Conteúdo */
.info-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.card-header {
    margin-bottom: 4px;
}

.document-title {
    margin: 0 0 2px 0;
    color: #000000;
}

.document-author {
    margin: 0;
    font-size: 0.95rem;
    color: #222222;
    font-weight: 500;
}

.document-description {
    margin: 8px 0 12px 0;
    font-size: 0.9rem;
    line-height: 1.35;
    color: #333333;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Categorias / Chips */
.tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
}

.tag-chip {
    --background: #D9D9D9;
    --color: #111111;
    border: 1px solid #555555;
    border-radius: 16px;
    height: 26px;
    font-size: 0.82rem;
    font-weight: 500;
    margin: 0;
    padding: 0 10px;
}

/* Botões e Ações */
.actions-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.btn-action {
    --background: #B9D9EB;
    --color: #000000;
    --border-radius: 8px;
    --border-color: #4A4E69;
    --border-style: solid;
    --border-width: 1.5px;
    --box-shadow: none;
    font-weight: 700;
    text-transform: none;
    height: 36px;
    margin: 0;
}

.btn-download ion-icon {
    font-size: 1.1rem;
    margin-right: 2px;
}

.btn-report {
    --color: #000000;
    font-weight: 600;
    text-transform: none;
    height: 36px;
    margin: 0;
    --padding-start: 6px;
    --padding-end: 6px;
}

.btn-report ion-icon {
    color: #767676;
    font-size: 1.2rem;
}

/* Adaptabilidade Responsiva (Mobile) */
@media (max-width: 576px) {
    .card-body {
        flex-direction: column;
    }

    .cover-container {
        width: 100%;
        height: 180px;
    }
}
</style>