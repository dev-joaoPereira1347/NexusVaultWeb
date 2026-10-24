<template>
    <section class="featured-section" aria-labelledby="featured-title">
        <header class="featured-heading">
            <div>
                <p class="nv-eyebrow nv-badge">RECÉM-ADICIONADOS</p>
                <h2 id="featured-title" class="nv-heading-h2">Destaques do acervo</h2>
                <p class="nv-page-description">Explore os documentos mais recentes compartilhados pela comunidade.</p>
            </div>

            <div v-if="items.length > 1" class="carousel-controls" aria-label="Controles dos destaques">
                <ion-button
                    fill="outline"
                    class="carousel-arrow"
                    aria-label="Destaque anterior"
                    @click="showPrevious"
                >
                    <ion-icon slot="icon-only" :icon="chevronBackOutline" />
                </ion-button>
                <span class="slide-count" aria-live="polite">{{ currentIndex + 1 }} / {{ items.length }}</span>
                <ion-button
                    fill="outline"
                    class="carousel-arrow"
                    aria-label="Próximo destaque"
                    @click="showNext"
                >
                    <ion-icon slot="icon-only" :icon="chevronForwardOutline" />
                </ion-button>
            </div>
        </header>

        <div v-if="loading" class="featured-feedback nv-surface" role="status">
            <ion-spinner name="crescent" />
            <span>Carregando os destaques...</span>
        </div>
        <p v-else-if="error" class="featured-feedback featured-error nv-surface" role="alert">{{ error }}</p>
        <p v-else-if="!items.length" class="featured-feedback nv-surface">
            Os destaques aparecerão aqui quando novos documentos forem adicionados ao acervo.
        </p>

        <div v-else class="featured-card nv-surface" role="region" aria-label="Carrossel de documentos recentes">
            <Transition name="featured-slide" mode="out-in">
                <article :key="activeItem.id" class="featured-item" aria-live="polite">
                    <RouterLink
                        class="featured-cover"
                        :to="{ name: 'DocumentDetails', params: { id: activeItem.id } }"
                        :aria-label="`Ver detalhes de ${activeItem.title}`"
                    >
                        <img v-if="activeItem.cover_url" :src="activeItem.cover_url" :alt="`Capa de ${activeItem.title}`" />
                        <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                    </RouterLink>

                    <div class="featured-copy">
                        <p class="featured-category">{{ activeItem.category }} · {{ activeItem.content_type }}</p>
                        <h3>
                            <RouterLink :to="{ name: 'DocumentDetails', params: { id: activeItem.id } }">
                                {{ activeItem.title }}
                            </RouterLink>
                        </h3>
                        <p class="featured-author">Por {{ activeItem.author }}</p>
                        <p v-if="activeItem.description" class="featured-description">{{ activeItem.description }}</p>
                        <RouterLink
                            class="featured-link"
                            :to="{ name: 'DocumentDetails', params: { id: activeItem.id } }"
                        >
                            Explorar documento
                            <ion-icon :icon="arrowForwardOutline" aria-hidden="true" />
                        </RouterLink>
                    </div>
                </article>
            </Transition>

            <div v-if="items.length > 1" class="carousel-pagination" aria-label="Selecionar destaque">
                <button
                    v-for="(item, index) in items"
                    :key="item.id"
                    type="button"
                    class="pagination-dot"
                    :class="{ 'is-active': index === currentIndex }"
                    :aria-label="`Mostrar destaque ${index + 1}: ${item.title}`"
                    :aria-current="index === currentIndex ? 'true' : undefined"
                    @click="currentIndex = index"
                />
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { IonButton, IonIcon, IonSpinner } from '@ionic/vue';
import {
    arrowForwardOutline,
    chevronBackOutline,
    chevronForwardOutline,
    documentTextOutline
} from 'ionicons/icons';
import type { PublicLibraryItem } from '@/types/library';

const props = defineProps<{
    items: PublicLibraryItem[];
    loading: boolean;
    error: string;
}>();

const currentIndex = ref(0);
const activeItem = computed(() => props.items[currentIndex.value] ?? props.items[0]);

const showPrevious = () => {
    currentIndex.value = (currentIndex.value - 1 + props.items.length) % props.items.length;
};

const showNext = () => {
    currentIndex.value = (currentIndex.value + 1) % props.items.length;
};

watch(
    () => props.items.map(({ id }) => id).join(','),
    () => {
        if (currentIndex.value >= props.items.length) currentIndex.value = 0;
    }
);
</script>

<style scoped>
.featured-section {
    width: min(calc(100% - var(--page-gutter) - var(--page-gutter)), var(--content-width));
    margin: 0 auto var(--section-gap);
}

.featured-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-lg);
    margin-bottom: var(--space-md);
}

.featured-heading .nv-eyebrow {
    margin-bottom: var(--space-sm);
}

.featured-heading .nv-page-description {
    margin-bottom: 0;
}

.carousel-controls {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.carousel-arrow {
    --color: var(--color-text-primary);
    --border-color: var(--color-border-soft);
    --border-radius: 999px;
    width: 42px;
    height: 42px;
    margin: 0;
}

.slide-count {
    min-width: 48px;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    text-align: center;
}

.featured-card {
    position: relative;
    overflow: hidden;
    padding: clamp(18px, 4vw, 40px);
}

.featured-item {
    display: grid;
    grid-template-columns: minmax(150px, 240px) minmax(0, 1fr);
    align-items: center;
    gap: clamp(24px, 5vw, 64px);
    min-height: 260px;
}

.featured-cover {
    display: grid;
    width: 100%;
    aspect-ratio: 3 / 4;
    place-items: center;
    overflow: hidden;
    border-radius: var(--radius-md);
    background: var(--color-page-background);
    color: var(--color-brand-primary);
    text-decoration: none;
}

.featured-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.featured-cover ion-icon {
    font-size: 3rem;
}

.featured-copy {
    min-width: 0;
}

.featured-category {
    margin: 0 0 var(--space-sm);
    color: var(--color-brand-primary);
    font-size: var(--font-size-caption);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.featured-copy h3 {
    margin: 0;
    font-family: var(--primitive-font-family-display);
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    line-height: 1.2;
}

.featured-copy h3 a {
    color: var(--color-text-primary);
    text-decoration: none;
}

.featured-copy h3 a:hover {
    color: var(--color-brand-primary);
}

.featured-author,
.featured-description {
    color: var(--color-text-secondary);
    line-height: 1.6;
}

.featured-author {
    margin: var(--space-sm) 0;
}

.featured-description {
    display: -webkit-box;
    overflow: hidden;
    margin: 0 0 var(--space-md);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
}

.featured-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--color-brand-primary);
    font-weight: 700;
    text-decoration: none;
}

.featured-link:hover {
    text-decoration: underline;
}

.carousel-pagination {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: var(--space-lg);
}

.pagination-dot {
    width: 10px;
    height: 10px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--color-border-soft);
    cursor: pointer;
}

.pagination-dot.is-active {
    background: var(--color-brand-primary);
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 3px;
}

.featured-feedback {
    display: flex;
    min-height: 150px;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    padding: var(--space-lg);
    color: var(--color-text-secondary);
    text-align: center;
}

.featured-error {
    color: var(--color-danger);
}

.featured-slide-enter-active,
.featured-slide-leave-active {
    transition: opacity 160ms ease, transform 160ms ease;
}

.featured-slide-enter-from {
    opacity: 0;
    transform: translateX(12px);
}

.featured-slide-leave-to {
    opacity: 0;
    transform: translateX(-12px);
}

@media (prefers-reduced-motion: reduce) {
    .featured-slide-enter-active,
    .featured-slide-leave-active {
        transition: none;
    }
}

@media (max-width: 640px) {
    .featured-heading {
        align-items: flex-start;
        flex-direction: column;
    }

    .featured-item {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--space-md);
    }

    .featured-cover {
        width: min(58%, 210px);
        margin-inline: auto;
    }
}
</style>
