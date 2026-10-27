<template>
    <section class="rankings-section" aria-labelledby="rankings-title">
        <header class="rankings-heading">
            <div>
                <p class="nv-eyebrow nv-badge">EM DESTAQUE</p>
                <h2 id="rankings-title" class="nv-heading-h2">Mais acessados e mais baixados</h2>
                <p class="nv-page-description">Explore os documentos mais visitados e baixados pela comunidade.</p>
            </div>
            <label class="category-filter">
                <span>Filtrar por categoria</span>
                <select v-model="selectedCategory" aria-label="Filtrar rankings por categoria">
                    <option value="">Todas as categorias</option>
                    <option v-for="category in categories" :key="category.value" :value="category.value">
                        {{ category.label }}
                    </option>
                </select>
            </label>
        </header>

        <section class="ranking-panel nv-surface" aria-label="Rankings de documentos">
            <div class="ranking-tabs" role="tablist" aria-label="Tipo de ranking" @keydown="handleRankingTabKeydown">
                <button
                    id="access-ranking-tab"
                    class="ranking-tab"
                    type="button"
                    role="tab"
                    aria-controls="access-ranking-panel"
                    :aria-selected="selectedRanking === 'accesses'"
                    :tabindex="selectedRanking === 'accesses' ? 0 : -1"
                    @click="selectedRanking = 'accesses'"
                >
                    Mais acessados
                </button>
                <button
                    id="download-ranking-tab"
                    class="ranking-tab"
                    type="button"
                    role="tab"
                    aria-controls="download-ranking-panel"
                    :aria-selected="selectedRanking === 'downloads'"
                    :tabindex="selectedRanking === 'downloads' ? 0 : -1"
                    @click="selectedRanking = 'downloads'"
                >
                    Mais baixados
                </button>
            </div>

            <div
                v-if="selectedRanking === 'accesses'"
                id="access-ranking-panel"
                class="ranking-tab-panel"
                role="tabpanel"
                aria-labelledby="access-ranking-tab"
                tabindex="0"
            >
                <div v-if="accessLoading" class="ranking-feedback" role="status">
                    <ion-spinner name="crescent" />
                    <span>Carregando ranking...</span>
                </div>
                <p v-else-if="accessError" class="ranking-feedback ranking-error" role="alert">{{ accessError }}</p>
                <p v-else-if="!mostAccessed.length" class="ranking-feedback">
                    Ainda não há acessos registrados nesta categoria.
                </p>
                <ol v-else class="ranking-list">
                    <li v-for="(item, index) in mostAccessed" :key="item.id">
                        <RouterLink
                            class="ranking-item"
                            :to="{ name: 'DocumentDetails', params: { id: item.id } }"
                            :aria-label="`Ver detalhes de ${item.title}; ${formatCount(item.access_count)} acessos`"
                        >
                            <span class="rank-number">{{ index + 1 }}</span>
                            <span class="rank-cover" aria-hidden="true">
                                <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`" />
                                <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                            </span>
                            <span class="rank-copy">
                                <span class="rank-title">{{ item.title }}</span>
                                <span class="rank-author">{{ item.author }}</span>
                            </span>
                            <span class="rank-count" :aria-label="`${item.access_count} acessos`">
                                <ion-icon :icon="eyeOutline" aria-hidden="true" />
                                {{ formatCount(item.access_count) }}
                                <ion-icon class="rank-chevron" :icon="chevronForwardOutline" aria-hidden="true" />
                            </span>
                        </RouterLink>
                    </li>
                </ol>
            </div>

            <div
                v-else
                id="download-ranking-panel"
                class="ranking-tab-panel"
                role="tabpanel"
                aria-labelledby="download-ranking-tab"
                tabindex="0"
            >
                <div v-if="downloadLoading" class="ranking-feedback" role="status">
                    <ion-spinner name="crescent" />
                    <span>Carregando ranking...</span>
                </div>
                <p v-else-if="downloadError" class="ranking-feedback ranking-error" role="alert">{{ downloadError }}</p>
                <p v-else-if="!mostDownloaded.length" class="ranking-feedback">
                    Ainda não há downloads registrados nesta categoria.
                </p>
                <ol v-else class="ranking-list">
                    <li v-for="(item, index) in mostDownloaded" :key="item.id">
                        <RouterLink
                            class="ranking-item"
                            :to="{ name: 'DocumentDetails', params: { id: item.id } }"
                            :aria-label="`Ver detalhes de ${item.title}; ${formatCount(item.download_count)} downloads`"
                        >
                            <span class="rank-number">{{ index + 1 }}</span>
                            <span class="rank-cover" aria-hidden="true">
                                <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`" />
                                <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                            </span>
                            <span class="rank-copy">
                                <span class="rank-title">{{ item.title }}</span>
                                <span class="rank-author">{{ item.author }}</span>
                            </span>
                            <span class="rank-count" :aria-label="`${item.download_count} downloads`">
                                <ion-icon :icon="downloadOutline" aria-hidden="true" />
                                {{ formatCount(item.download_count) }}
                                <ion-icon class="rank-chevron" :icon="chevronForwardOutline" aria-hidden="true" />
                            </span>
                        </RouterLink>
                    </li>
                </ol>
            </div>
        </section>
    </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { IonIcon, IonSpinner, onIonViewWillEnter } from '@ionic/vue';
import { chevronForwardOutline, documentTextOutline, downloadOutline, eyeOutline } from 'ionicons/icons';
import { listRankedPublicLibraryItems } from '@/services/libraryService';
import type { RankedPublicLibraryItem } from '@/types/library';

const categories = [
    { value: 'literatura', label: 'Literatura' },
    { value: 'historia', label: 'História & Documentos' },
    { value: 'tecnico', label: 'Técnico & Acadêmico' },
    { value: 'filosofia', label: 'Filosofia' },
    { value: 'poesia', label: 'Poesia' },
    { value: 'outros', label: 'Outros' }
];

const selectedCategory = ref('');
const selectedRanking = ref<'accesses' | 'downloads'>('accesses');
const mostAccessed = ref<RankedPublicLibraryItem[]>([]);
const mostDownloaded = ref<RankedPublicLibraryItem[]>([]);
const accessLoading = ref(true);
const downloadLoading = ref(true);
const accessError = ref('');
const downloadError = ref('');
let requestId = 0;

const formatCount = (count: number): string => new Intl.NumberFormat('pt-BR').format(count);

const handleRankingTabKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (!(event.currentTarget instanceof HTMLElement) || !(event.target instanceof HTMLButtonElement)) return;

    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const currentIndex = tabs.indexOf(event.target);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;

    nextTab.click();
    nextTab.focus();
    event.preventDefault();
};

const refreshRankings = async () => {
    const currentRequestId = ++requestId;
    const category = selectedCategory.value;
    accessLoading.value = true;
    downloadLoading.value = true;
    accessError.value = '';
    downloadError.value = '';

    const [accessResult, downloadResult] = await Promise.allSettled([
        listRankedPublicLibraryItems('accesses', category || null, 5),
        listRankedPublicLibraryItems('downloads', category || null, 5)
    ]);
    if (currentRequestId !== requestId) return;

    if (accessResult.status === 'fulfilled') {
        mostAccessed.value = accessResult.value;
    } else {
        accessError.value = accessResult.reason instanceof Error
            ? `Não foi possível carregar os mais acessados: ${accessResult.reason.message}`
            : 'Não foi possível carregar os mais acessados.';
    }

    if (downloadResult.status === 'fulfilled') {
        mostDownloaded.value = downloadResult.value;
    } else {
        downloadError.value = downloadResult.reason instanceof Error
            ? `Não foi possível carregar os mais baixados: ${downloadResult.reason.message}`
            : 'Não foi possível carregar os mais baixados.';
    }

    accessLoading.value = false;
    downloadLoading.value = false;
};

let hasEntered = false;

watch(selectedCategory, refreshRankings);
onMounted(refreshRankings);
onIonViewWillEnter(() => {
    if (hasEntered) void refreshRankings();
    hasEntered = true;
});
</script>

<style scoped>
.rankings-section {
    width: min(calc(100% - var(--page-gutter) - var(--page-gutter)), var(--content-width));
    margin: 0 auto var(--section-gap);
}

.rankings-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-lg);
    margin-bottom: var(--space-md);
}

.rankings-heading .nv-eyebrow {
    margin-bottom: var(--space-sm);
}

.rankings-heading .nv-page-description {
    margin-bottom: 0;
}

.category-filter {
    display: grid;
    min-width: min(100%, 220px);
    gap: var(--space-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    font-weight: 600;
}

.category-filter select {
    min-height: var(--control-height, 46px);
    padding: 0.625rem var(--space-sm);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text-primary);
}

.ranking-panel {
    min-width: 0;
    overflow: hidden;
    padding: 0 clamp(16px, 3vw, 24px) clamp(16px, 3vw, 24px);
}

.ranking-tabs {
    display: flex;
    margin: 0 calc(clamp(16px, 3vw, 24px) * -1) var(--space-sm);
    border-bottom: 1px solid var(--color-border-soft);
}

.ranking-tab {
    position: relative;
    flex: 1;
    min-height: 3.5rem;
    padding: var(--space-sm);
    border: 0;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    font: inherit;
    font-size: clamp(1rem, 2.5vw, 1.25rem);
    font-weight: 600;
    transition: color 0.2s ease, background-color 0.2s ease;
}

.ranking-tab[aria-selected="true"] {
    color: var(--color-text-primary);
}

.ranking-tab[aria-selected="true"]::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 3px;
    border-radius: var(--radius-pill);
    background: var(--color-brand-primary);
    content: "";
}

.ranking-tab:focus-visible,
.ranking-tab:hover {
    background: rgba(83, 83, 143, 0.06);
    outline: none;
}

.ranking-tab-panel:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 3px;
}

.ranking-list {
    display: grid;
    gap: var(--space-sm);
    margin: 0;
    padding: 0;
    list-style: none;
}

.ranking-list li {
    min-width: 0;
    border-bottom: 1px solid var(--color-border-soft);
}

.ranking-list li:last-child {
    border-bottom: 0;
}

.ranking-item {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) 0;
    border-radius: var(--radius-md);
    color: inherit;
    text-decoration: none;
    transition: background-color 0.2s ease, transform 0.2s ease;
}

.ranking-item:hover,
.ranking-item:focus-visible {
    background: rgba(83, 83, 143, 0.1);
    outline: 2px solid rgba(83, 83, 143, 0.32);
    outline-offset: -2px;
    transform: translateX(2px);
}

.ranking-item:active {
    background: rgba(83, 83, 143, 0.08);
}

.rank-number {
    flex: 0 0 1.5rem;
    color: var(--color-text-secondary);
    font-size: 1rem;
    font-weight: 500;
    text-align: center;
}

.rank-cover {
    display: grid;
    flex: 0 0 48px;
    width: 48px;
    height: 64px;
    place-items: center;
    overflow: hidden;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-soft);
    background: var(--color-page-background);
    color: var(--color-brand-primary);
}

.rank-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.rank-copy {
    display: grid;
    flex: 1;
    min-width: 0;
    align-content: center;
    gap: 3px;
}

.rank-title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    color: var(--color-text-primary);
    font-weight: 700;
    line-height: 1.25;
    overflow-wrap: anywhere;
    text-decoration: none;
}

.rank-author {
    overflow: hidden;
    color: var(--color-text-primary);
    font-size: var(--font-size-caption);
    text-overflow: ellipsis;
    white-space: nowrap;
}

.rank-count {
    display: flex;
    flex: 0 0 auto;
    min-width: 5.25rem;
    align-items: center;
    justify-content: flex-end;
    gap: 0.3rem;
    color: var(--color-text-secondary);
    font-weight: 600;
    white-space: nowrap;
}

.rank-count ion-icon {
    flex: 0 0 auto;
    font-size: 1rem;
}

.rank-count .rank-chevron {
    margin-left: 0.1rem;
    color: var(--color-text-secondary);
    opacity: 0.7;
}

.ranking-feedback {
    display: flex;
    min-height: 160px;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    margin: 0;
    color: var(--color-text-secondary);
    text-align: center;
}

.ranking-error {
    color: var(--color-danger);
}

@media (max-width: 760px) {
    .rankings-heading {
        align-items: stretch;
        flex-direction: column;
    }

    .category-filter {
        width: 100%;
    }

    .ranking-item {
        gap: clamp(0.35rem, 2vw, var(--space-sm));
    }

    .rank-number {
        flex-basis: 1.25rem;
    }

    .rank-cover {
        flex-basis: 44px;
        width: 44px;
        height: 60px;
    }

    .rank-count {
        min-width: 4.5rem;
    }
}
</style>
