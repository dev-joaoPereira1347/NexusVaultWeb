<template>
    <ion-page>
        <ion-content :fullscreen="true" class="details-content">
            <SiteHeader />

            <main class="details-page nv-page-shell">
                <div v-if="loading" class="feedback" role="status">
                    <ion-spinner name="crescent" />
                    <span>Carregando detalhes do documento...</span>
                </div>
                <section v-else-if="errorMessage" class="feedback error-message" role="alert">
                    {{ errorMessage }}
                </section>
                <template v-else-if="item">
                    <section class="document-summary nv-surface" aria-labelledby="document-title">
                        <div class="cover-panel">
                            <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`" />
                            <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                        </div>

                        <div class="summary-info">
                            <p class="nv-eyebrow">{{ item.category }} · {{ item.content_type }}</p>
                            <h1 id="document-title" class="nv-page-title">{{ item.title }}</h1>
                            <p class="author">Por {{ item.author }}</p>
                            <p class="summary-meta">
                                <span v-if="item.year">{{ item.year }}</span>
                                <span v-if="item.language">{{ item.language }}</span>
                                <span>{{ formatFileSize(item.file_size) }}</span>
                            </p>
                            <div class="summary-actions">
                                <ion-button class="download-button" :href="item.download_url" target="_blank"
                                    rel="noopener noreferrer">
                                    <ion-icon slot="start" :icon="downloadOutline" />
                                    Abrir documento
                                </ion-button>
                                <RouterLink class="back-button" :to="{ name: 'Generos' }">
                                    Voltar ao acervo
                                </RouterLink>
                            </div>
                        </div>
                    </section>

                    <section class="detail-section nv-surface" aria-labelledby="description-title">
                        <h2 id="description-title" class="section-title">Descrição</h2>
                        <p v-if="item.description" class="section-copy">{{ item.description }}</p>
                        <p v-else class="section-copy muted">Este documento ainda não possui uma descrição.</p>
                    </section>

                    <section class="detail-section reviews-section nv-surface" aria-labelledby="reviews-title">
                        <div class="section-heading">
                            <div>
                                <h2 id="reviews-title" class="section-title">Avaliações da comunidade</h2>
                                <p class="section-copy muted">
                                    {{ reviewsError ? 'As avaliações estão indisponíveis no momento.' : reviews.length ? `${reviews.length} ${reviews.length === 1 ? 'avaliação recente' : 'avaliações recentes'}` : 'Ainda não há avaliações para este documento.' }}
                                </p>
                            </div>
                            <div v-if="reviews.length" class="rating-summary" :aria-label="`Média ${averageRating} de 5`">
                                <span class="rating-stars" aria-hidden="true">{{ starRating(averageRating) }}</span>
                                <strong>{{ averageRating.toFixed(1) }}</strong>
                            </div>
                        </div>
                        <p v-if="reviewsError" class="reviews-error" role="alert">{{ reviewsError }}</p>
                        <ul v-else-if="reviews.length" class="review-list">
                            <li v-for="review in reviews" :key="review.id" class="review-item">
                                <div class="review-avatar" aria-hidden="true">
                                    <ion-icon :icon="personCircleOutline" />
                                </div>
                                <div class="review-body">
                                    <div class="review-heading">
                                        <strong>Leitor da comunidade</strong>
                                        <span class="rating-stars" :aria-label="`${review.rating} de 5 estrelas`">
                                            {{ starRating(review.rating) }}
                                        </span>
                                    </div>
                                    <p v-if="review.comment">{{ review.comment }}</p>
                                    <time :datetime="review.created_at">{{ formatDate(review.created_at) }}</time>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <section class="detail-section author-section nv-surface" aria-labelledby="author-title">
                        <div class="author-avatar" aria-hidden="true">
                            <ion-icon :icon="personCircleOutline" />
                        </div>
                        <div>
                            <h2 id="author-title" class="section-title">Autor</h2>
                            <p class="section-copy">
                                {{ item.author }} · {{ item.content_type }}{{ item.year ? ` · ${item.year}` : '' }}
                            </p>
                        </div>
                    </section>

                    <section v-if="relatedItems.length" class="related-section" aria-labelledby="related-title">
                        <h2 id="related-title" class="section-title">Mais do acervo</h2>
                        <p v-if="relatedError" class="reviews-error" role="alert">{{ relatedError }}</p>
                        <div class="related-grid">
                            <RouterLink v-for="related in relatedItems" :key="related.id"
                                :to="{ name: 'DocumentDetails', params: { id: related.id } }"
                                class="related-card nv-surface">
                                <img v-if="related.cover_url" :src="related.cover_url" :alt="`Capa de ${related.title}`" />
                                <div v-else class="related-cover-fallback">
                                    <ion-icon :icon="documentTextOutline" aria-hidden="true" />
                                </div>
                                <strong>{{ related.title }}</strong>
                                <span>{{ related.author }}</span>
                            </RouterLink>
                        </div>
                    </section>
                    <p v-else-if="relatedError" class="reviews-error" role="alert">{{ relatedError }}</p>
                </template>
            </main>

            <SiteFooter />
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { IonButton, IonContent, IonIcon, IonPage, IonSpinner } from '@ionic/vue';
import { documentTextOutline, downloadOutline, personCircleOutline } from 'ionicons/icons';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import { getPublicLibraryItem, listRelatedPublicLibraryItems } from '@/services/libraryService';
import { listPublicDocumentReviews } from '@/services/publicReviewService';
import type { PublicDocumentReview } from '@/services/publicReviewService';
import type { PublicLibraryItem, PublicLibraryItemDetails } from '@/types/library';

const route = useRoute();
const item = ref<PublicLibraryItemDetails | null>(null);
const reviews = ref<PublicDocumentReview[]>([]);
const relatedItems = ref<PublicLibraryItem[]>([]);
const reviewsError = ref('');
const relatedError = ref('');
const loading = ref(true);
const errorMessage = ref('');
const averageRating = computed(() => reviews.value.reduce((total, review) => total + review.rating, 0) / reviews.value.length);

const starRating = (rating: number): string =>
    `${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}`;

const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) {
        return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(size / 1024)} KB`;
    }
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(size / (1024 * 1024))} MB`;
};

const formatDate = (date: string): string =>
    new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(date));

watch(
    () => route.params.id,
    async (id) => {
        item.value = null;
        reviews.value = [];
        relatedItems.value = [];
        errorMessage.value = '';
        reviewsError.value = '';
        relatedError.value = '';
        loading.value = true;

        if (typeof id !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) {
            errorMessage.value = 'Identificador do documento inválido.';
            loading.value = false;
            return;
        }

        try {
            item.value = await getPublicLibraryItem(id);
            if (!item.value) errorMessage.value = 'O documento solicitado não foi encontrado.';
            if (item.value) {
                const [reviewResult, relatedResult] = await Promise.allSettled([
                    listPublicDocumentReviews(id),
                    listRelatedPublicLibraryItems(item.value)
                ]);

                if (reviewResult.status === 'fulfilled') {
                    reviews.value = reviewResult.value;
                } else {
                    reviewsError.value = reviewResult.reason instanceof Error
                        ? `Não foi possível carregar as avaliações: ${reviewResult.reason.message}`
                        : 'Não foi possível carregar as avaliações.';
                }

                if (relatedResult.status === 'fulfilled') {
                    relatedItems.value = relatedResult.value;
                } else {
                    relatedError.value = relatedResult.reason instanceof Error
                        ? `Não foi possível carregar recomendações: ${relatedResult.reason.message}`
                        : 'Não foi possível carregar recomendações.';
                }
            }
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : typeof error === 'object' && error !== null && 'message' in error
                    && typeof error.message === 'string'
                    ? error.message
                    : '';
            errorMessage.value = message
                ? `Não foi possível carregar o documento: ${message}`
                : 'Não foi possível carregar o documento.';
        } finally {
            loading.value = false;
        }
    },
    { immediate: true }
);
</script>

<style scoped>
.details-content {
    --background: var(--color-page-background);
}

.details-page {
    --content-width: 1120px;
    min-height: 60vh;
}

.document-summary {
    display: grid;
    grid-template-columns: minmax(160px, 0.34fr) minmax(0, 1fr);
    align-items: start;
    gap: var(--space-lg);
    margin-bottom: var(--space-md);
    padding: var(--surface-padding);
}

.cover-panel {
    display: grid;
    min-height: 240px;
    padding: var(--space-sm);
    place-items: center;
    color: var(--color-text-muted);
    font-size: 3rem;
}

.cover-panel img {
    width: 100%;
    max-height: 300px;
    border-radius: var(--radius-md);
    object-fit: contain;
}

.summary-info {
    min-width: 0;
}

.summary-info .nv-eyebrow {
    margin-bottom: var(--space-sm);
}

.summary-info .nv-page-title {
    font-size: clamp(1.6rem, 3vw, 2.25rem);
}

.author {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-body);
}

.summary-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs) var(--space-md);
    margin: var(--space-md) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.summary-meta span + span::before {
    content: '·';
    margin-right: var(--space-md);
    color: var(--color-text-muted);
}

.summary-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    margin-top: var(--space-lg);
}

.back-button {
    display: inline-flex;
    min-height: var(--control-height);
    align-items: center;
    justify-content: center;
    padding: 0 var(--space-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text-primary);
    font-size: var(--font-size-caption);
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
}

.back-button:hover {
    background: var(--color-surface-alt);
}

.download-button {
    --background: var(--color-primary-dark);
    --background-hover: var(--color-text-primary);
    --color: var(--color-white);
    --border-color: var(--color-primary-dark);
    --border-style: solid;
    --border-width: 1px;
    --border-radius: var(--radius-control);
    --box-shadow: none;
    --padding-start: var(--space-md);
    --padding-end: var(--space-md);
    height: var(--control-height);
    margin: 0;
    font-size: var(--font-size-caption);
    font-weight: 700;
    text-transform: none;
}

.back-button {
    --color: var(--color-text-primary);
    --border-color: var(--color-border);
    --background: var(--color-surface);
}

.detail-section {
    margin-bottom: var(--space-md);
    padding: var(--surface-padding);
}

.section-title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1.15rem;
    font-weight: 700;
}

.section-copy {
    margin: var(--space-sm) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    line-height: 1.65;
    white-space: pre-line;
}

.muted {
    color: var(--color-text-muted);
}

.section-heading,
.review-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
}

.rating-summary {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-shrink: 0;
    color: var(--color-text-primary);
}

.rating-stars {
    color: #c58b1b;
    letter-spacing: 0.08em;
    white-space: nowrap;
}

.review-list {
    display: grid;
    gap: var(--space-md);
    margin: var(--space-lg) 0 0;
    padding: 0;
    list-style: none;
}

.review-item {
    display: flex;
    gap: var(--space-sm);
    padding-top: var(--space-md);
    border-top: 1px solid var(--color-border-soft);
}

.review-avatar,
.author-avatar {
    display: grid;
    flex: 0 0 36px;
    width: 36px;
    height: 36px;
    place-items: center;
    border-radius: 50%;
    background: var(--color-surface-alt);
    color: var(--color-text-secondary);
    font-size: 1.7rem;
}

.review-body {
    flex: 1;
    min-width: 0;
}

.review-heading strong {
    color: var(--color-text-primary);
    font-size: var(--font-size-caption);
}

.review-body p {
    margin: var(--space-xs) 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    line-height: 1.5;
    overflow-wrap: anywhere;
}

.review-body time {
    color: var(--color-text-muted);
    font-size: 0.75rem;
}

.reviews-error {
    margin: var(--space-md) 0 0;
    color: var(--color-danger);
    font-size: var(--font-size-caption);
}

.author-section {
    display: flex;
    align-items: center;
    gap: var(--space-md);
}

.author-avatar {
    flex-basis: 48px;
    width: 48px;
    height: 48px;
    font-size: 2.2rem;
}

.related-section {
    margin-top: var(--space-xl);
}

.related-section > .section-title {
    margin-bottom: var(--space-md);
}

.related-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-md);
}

.related-card {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-sm);
    color: inherit;
    text-decoration: none;
}

.related-card:hover {
    border-color: var(--color-brand-primary);
    transform: translateY(-2px);
}

.related-card img,
.related-cover-fallback {
    display: grid;
    width: 100%;
    height: 120px;
    margin-bottom: var(--space-xs);
    place-items: center;
    border-radius: var(--radius-sm);
    background: var(--color-surface-alt);
    color: var(--color-text-muted);
    object-fit: contain;
}

.related-cover-fallback {
    font-size: 2rem;
}

.related-card strong,
.related-card span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.related-card strong {
    color: var(--color-text-primary);
    font-size: var(--font-size-caption);
}

.related-card span {
    color: var(--color-text-secondary);
    font-size: 0.75rem;
}

.feedback {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    min-height: 180px;
    color: var(--color-text-secondary);
    text-align: center;
}

.error-message {
    color: var(--color-danger);
}

@media (max-width: 700px) {
    .document-summary {
        grid-template-columns: 104px minmax(0, 1fr);
        gap: var(--space-md);
        padding: var(--space-md);
    }

    .cover-panel {
        min-height: 142px;
        align-self: start;
    }

    .cover-panel img {
        max-height: 180px;
    }

    .summary-info .nv-page-title {
        font-size: 1.25rem;
        letter-spacing: -0.03em;
    }

    .summary-info .nv-eyebrow {
        padding: 4px 8px;
        font-size: 0.65rem;
    }

    .summary-meta {
        gap: 4px var(--space-sm);
        font-size: 0.75rem;
    }

    .summary-meta span + span::before {
        margin-right: var(--space-sm);
    }

    .summary-actions {
        grid-column: 1 / -1;
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-xs);
        margin-top: var(--space-md);
    }

    .summary-actions ion-button {
        width: 100%;
    }

    .related-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .related-card img,
    .related-cover-fallback {
        height: 150px;
    }
}

@media (max-width: 380px) {
    .document-summary {
        grid-template-columns: 1fr;
    }

    .cover-panel {
        min-height: 180px;
    }

    .cover-panel img {
        max-height: 220px;
    }
}
</style>
