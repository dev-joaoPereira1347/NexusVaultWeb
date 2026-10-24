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

        <div class="ranking-grid">
            <section class="ranking-panel nv-surface" aria-labelledby="access-ranking-title">
                <h3 id="access-ranking-title">Mais acessados</h3>
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
                        <span class="rank-number">{{ index + 1 }}</span>
                        <RouterLink
                            class="rank-cover"
                            :to="{ name: 'DocumentDetails', params: { id: item.id } }"
                            :aria-label="`Ver detalhes de ${item.title}`"
                        >
                            <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`" />
                            <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                        </RouterLink>
                        <div class="rank-copy">
                            <RouterLink class="rank-title" :to="{ name: 'DocumentDetails', params: { id: item.id } }">
                                {{ item.title }}
                            </RouterLink>
                            <span>{{ item.author }}</span>
                        </div>
                        <span class="rank-count" :aria-label="`${item.access_count} acessos`">
                            {{ formatCount(item.access_count) }}
                            <small>{{ item.access_count === 1 ? 'acesso' : 'acessos' }}</small>
                        </span>
                    </li>
                </ol>
            </section>

            <section class="ranking-panel nv-surface" aria-labelledby="download-ranking-title">
                <h3 id="download-ranking-title">Mais baixados</h3>
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
                        <span class="rank-number">{{ index + 1 }}</span>
                        <RouterLink
                            class="rank-cover"
                            :to="{ name: 'DocumentDetails', params: { id: item.id } }"
                            :aria-label="`Ver detalhes de ${item.title}`"
                        >
                            <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`" />
                            <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                        </RouterLink>
                        <div class="rank-copy">
                            <RouterLink class="rank-title" :to="{ name: 'DocumentDetails', params: { id: item.id } }">
                                {{ item.title }}
                            </RouterLink>
                            <span>{{ item.author }}</span>
                        </div>
                        <span class="rank-count" :aria-label="`${item.download_count} downloads`">
                            {{ formatCount(item.download_count) }}
                            <small>{{ item.download_count === 1 ? 'download' : 'downloads' }}</small>
                        </span>
                    </li>
                </ol>
            </section>
        </div>
    </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { IonIcon, IonSpinner, onIonViewWillEnter } from '@ionic/vue';
import { documentTextOutline } from 'ionicons/icons';
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
const mostAccessed = ref<RankedPublicLibraryItem[]>([]);
const mostDownloaded = ref<RankedPublicLibraryItem[]>([]);
const accessLoading = ref(true);
const downloadLoading = ref(true);
const accessError = ref('');
const downloadError = ref('');
let requestId = 0;

const formatCount = (count: number): string => new Intl.NumberFormat('pt-BR').format(count);

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
    min-height: 42px;
    padding: 0 var(--space-sm);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text-primary);
}

.ranking-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
}

.ranking-panel {
    min-width: 0;
    padding: clamp(16px, 3vw, 24px);
}

.ranking-panel h3 {
    margin: 0 0 var(--space-md);
    color: var(--color-text-primary);
    font-family: var(--primitive-font-family-display);
    font-size: var(--typography-heading-h3-font-size);
}

.ranking-list {
    display: grid;
    gap: var(--space-sm);
    margin: 0;
    padding: 0;
    list-style: none;
}

.ranking-list li {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: var(--space-sm);
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--color-border-soft);
}

.ranking-list li:last-child {
    padding-bottom: 0;
    border-bottom: 0;
}

.rank-number {
    flex: 0 0 1.5rem;
    color: var(--color-brand-primary);
    font-family: var(--primitive-font-family-display);
    font-size: 1.2rem;
    font-weight: 700;
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
    gap: 3px;
}

.rank-title,
.rank-copy > span {
    overflow: hidden;
    color: var(--color-text-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
}

.rank-title {
    font-weight: 700;
    text-decoration: none;
}

.rank-title:hover {
    color: var(--color-brand-primary);
    text-decoration: underline;
}

.rank-copy > span {
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.rank-count {
    display: grid;
    flex: 0 0 auto;
    color: var(--color-text-primary);
    font-weight: 700;
    text-align: right;
}

.rank-count small {
    color: var(--color-text-muted);
    font-size: 0.7rem;
    font-weight: 500;
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

    .ranking-grid {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
