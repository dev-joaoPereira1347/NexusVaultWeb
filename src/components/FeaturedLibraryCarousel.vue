<template>
    <section class="featured-section" aria-labelledby="featured-title">
        <header class="featured-heading">
            <div>
                <p class="nv-eyebrow nv-badge">RECÉM-ADICIONADOS</p>
                <h2 id="featured-title" class="nv-heading-h2">Destaques do acervo</h2>
                <p class="nv-page-description">Explore os documentos mais recentes compartilhados pela comunidade.</p>
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

        <div v-else class="featured-carousel" role="region" aria-label="Carrossel de documentos recentes">
            <div ref="carouselViewport" class="carousel-viewport" @scroll.passive="updateCurrentIndex">
                <div class="carousel-track">
                    <article v-for="(item, index) in items" :key="item.id"
                        :ref="(element) => setSlideElement(element, index)"
                        class="featured-item nv-surface" :aria-label="`${item.title}, destaque ${index + 1} de ${items.length}`">
                        <RouterLink
                            class="featured-cover"
                            :to="{ name: 'DocumentDetails', params: { id: item.id } }"
                            :aria-label="`Ver detalhes de ${item.title}`"
                        >
                            <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`" />
                            <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                        </RouterLink>

                        <div class="featured-copy">
                            <p class="featured-category">{{ item.category }} · {{ item.content_type }}</p>
                            <h3>
                                <RouterLink :to="{ name: 'DocumentDetails', params: { id: item.id } }">
                                    {{ item.title }}
                                </RouterLink>
                            </h3>
                            <p class="featured-author">Por {{ item.author }}</p>
                            <p v-if="item.description" class="featured-description">{{ item.description }}</p>
                            <RouterLink
                                class="featured-link"
                                :to="{ name: 'DocumentDetails', params: { id: item.id } }"
                            >
                                Explorar documento
                                <ion-icon :icon="arrowForwardOutline" aria-hidden="true" />
                            </RouterLink>
                        </div>
                    </article>
                </div>
            </div>

            <div v-if="items.length > 1" class="carousel-pagination" role="group" aria-label="Selecionar destaque">
                <button
                    v-for="(item, index) in items"
                    :key="item.id"
                    type="button"
                    class="pagination-dot"
                    :class="{ 'is-active': index === currentIndex }"
                    :aria-label="`Mostrar destaque ${index + 1}: ${item.title}`"
                    :aria-pressed="index === currentIndex"
                    @click="goToSlide(index)"
                />
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { IonIcon, IonSpinner } from '@ionic/vue';
import {
    arrowForwardOutline,
    documentTextOutline
} from 'ionicons/icons';
import type { PublicLibraryItem } from '@/types/library';

const props = defineProps<{
    items: PublicLibraryItem[];
    loading: boolean;
    error: string;
}>();

const currentIndex = ref(0);
const carouselViewport = ref<HTMLElement | null>(null);
const slideElements: (HTMLElement | null)[] = [];

const setSlideElement = (element: unknown, index: number) => {
    slideElements[index] = element instanceof HTMLElement ? element : null;
};

const updateCurrentIndex = () => {
    const viewport = carouselViewport.value;
    if (!viewport) return;
    const center = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    slideElements.forEach((slide, index) => {
        if (!slide) return;
        const bounds = slide.getBoundingClientRect();
        const distance = Math.abs(bounds.left + bounds.width / 2 - center);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });
    currentIndex.value = closestIndex;
};

const goToSlide = (index: number) => {
    const viewport = carouselViewport.value;
    const slide = slideElements[index];
    if (viewport && slide) {
        const left = viewport.scrollLeft + slide.getBoundingClientRect().left - viewport.getBoundingClientRect().left;
        viewport.scrollTo({ left, behavior: 'smooth' });
    }
    currentIndex.value = index;
};

watch(
    () => props.items.map(({ id }) => id).join(','),
    async () => {
        currentIndex.value = 0;
        slideElements.length = props.items.length;
        await nextTick();
        carouselViewport.value?.scrollTo({ left: 0 });
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

.featured-carousel {
    min-width: 0;
}

.carousel-viewport {
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scrollbar-width: none;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
}

.carousel-viewport::-webkit-scrollbar {
    display: none;
}

.carousel-track {
    display: flex;
    gap: var(--space-md);
}

.featured-item {
    display: grid;
    width: 100%;
    flex: 0 0 100%;
    grid-template-columns: minmax(150px, 240px) minmax(0, 1fr);
    align-items: center;
    gap: clamp(24px, 5vw, 64px);
    min-height: 260px;
    padding: clamp(18px, 4vw, 40px);
    scroll-snap-align: start;
    scroll-snap-stop: always;
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

@media (prefers-reduced-motion: reduce) {
    .carousel-viewport {
        scroll-behavior: auto;
    }
}

@media (max-width: 640px) {
    .featured-heading {
        align-items: flex-start;
        flex-direction: column;
    }

    .featured-item {
        width: 85%;
        flex-basis: 85%;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--space-md);
    }

    .featured-cover {
        width: min(58%, 210px);
        margin-inline: auto;
    }
}
</style>
