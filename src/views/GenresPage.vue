<template>
    <IonPage>
        <IonContent :fullscreen="true" class="genres-content">
            <SiteHeader />

            <main class="genres-page nv-page-shell">
                <header class="page-heading nv-page-heading">
                    <p class="nv-eyebrow nv-badge">EXPLORE O ACERVO</p>
                    <h1 class="nv-page-title">Gêneros e temas</h1>
                    <p class="nv-page-description">
                        Descubra livros e documentos por assunto e encontre sua próxima leitura.
                    </p>
                </header>

                <div v-if="loading" class="feedback" role="status">
                    <ion-spinner name="crescent" />
                    <span>Carregando gêneros do acervo...</span>
                </div>
                <p v-else-if="errorMessage" class="feedback error-message" role="alert">{{ errorMessage }}</p>
                <p v-else-if="genres.length === 0" class="feedback empty-state nv-surface">
                    Ainda não há gêneros cadastrados no acervo.
                    <RouterLink :to="{ name: 'Search' }">Explore todos os documentos</RouterLink>
                </p>

                <section v-else class="genre-list nv-surface" aria-label="Gêneros disponíveis">
                    <RouterLink
                        v-for="genre in genres"
                        :key="genre.key"
                        class="genre-row"
                        :to="{ name: 'Search', query: { genre: genre.key } }"
                    >
                        <span class="genre-icon" aria-hidden="true">
                            <ion-icon :icon="bookOutline" />
                        </span>
                        <span class="genre-card-copy">
                            <strong>{{ genre.label }}</strong>
                            <span>{{ genre.count }} {{ genre.count === 1 ? 'documento' : 'documentos' }}</span>
                        </span>
                        <ion-icon class="genre-arrow" :icon="arrowForwardOutline" aria-hidden="true" />
                    </RouterLink>
                </section>
            </main>

            <SiteFooter />
        </IonContent>
    </IonPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { IonContent, IonIcon, IonPage, IonSpinner } from '@ionic/vue';
import { arrowForwardOutline, bookOutline } from 'ionicons/icons';
import SiteFooter from '@/components/SiteFooter.vue';
import SiteHeader from '@/components/SiteHeader.vue';
import { listPublicLibraryItems } from '@/services/libraryService';
import { useLibraryItemsSync } from '@/composables/useLibraryItemsSync';
import type { PublicLibraryItem } from '@/types/library';
import {
    getLibraryGenreLabel,
    getLibraryItemTags,
    normalizeLibraryGenre
} from '@/utils/libraryTaxonomy';

const items = ref<PublicLibraryItem[]>([]);
const loading = ref(true);
const errorMessage = ref('');

const genres = computed(() => {
    const counts = new Map<string, { name: string; count: number }>();

    for (const item of items.value) {
        for (const name of getLibraryItemTags(item.genre, item.category)) {
            const key = normalizeLibraryGenre(name);
            const entry = counts.get(key);
            if (entry) {
                entry.count += 1;
            } else {
                counts.set(key, { name: getLibraryGenreLabel(name), count: 1 });
            }
        }
    }

    return [...counts.entries()]
        .map(([key, entry]) => ({ key, label: entry.name, count: entry.count }))
        .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'));
});

const refreshItems = async () => {
    try {
        items.value = await listPublicLibraryItems();
        errorMessage.value = '';
    } catch (error) {
        if (items.value.length === 0) {
            errorMessage.value = error instanceof Error
                ? `Não foi possível carregar os gêneros: ${error.message}`
                : 'Não foi possível carregar os gêneros.';
        } else {
            console.error('Não foi possível atualizar os gêneros do acervo.', error);
        }
    } finally {
        loading.value = false;
    }
};

useLibraryItemsSync(refreshItems);
</script>

<style scoped>
.genres-content {
    --background: var(--color-page-background);
}

.genres-page {
    --content-width: 1120px;
    min-height: 60vh;
}

.page-heading {
    margin-bottom: var(--space-xl);
}

.genre-list {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0 var(--space-md);
}

.genre-row {
    display: flex;
    min-height: 76px;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-sm) 0;
    border-bottom: 1px solid var(--color-border-soft);
    color: var(--color-text-primary);
    text-decoration: none;
    transition: background-color 0.2s ease, padding-inline 0.2s ease;
}

.genre-row:last-child {
    border-bottom: 0;
}

.genre-row:hover,
.genre-row:focus-visible {
    background: var(--color-surface-alt);
}

.genre-row:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: -2px;
}

.genre-icon {
    display: grid;
    flex: 0 0 48px;
    width: 48px;
    height: 48px;
    place-items: center;
    border-radius: var(--radius-md);
    background: var(--color-surface-alt);
    color: var(--color-brand-primary);
    font-size: 1.5rem;
}

.genre-card-copy {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: var(--space-xs);
}

.genre-card-copy strong {
    overflow-wrap: anywhere;
    font-family: var(--primitive-font-family-display);
    font-size: var(--typography-heading-h4-font-size);
    font-weight: var(--typography-heading-h4-font-weight);
    line-height: var(--typography-heading-h4-line-height);
}

.genre-card-copy > span {
    color: var(--color-text-secondary);
    font-size: var(--typography-caption-default-font-size);
}

.genre-arrow {
    flex: 0 0 auto;
    color: var(--color-text-muted);
}

.feedback {
    display: flex;
    min-height: 140px;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    color: var(--color-text-secondary);
    text-align: center;
}

.empty-state {
    flex-direction: column;
    padding: var(--space-lg);
}

.empty-state a {
    color: var(--color-brand-primary);
    font-weight: 600;
}

.error-message {
    color: var(--color-danger);
}
</style>
