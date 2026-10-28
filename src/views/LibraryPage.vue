<template>
    <IonPage>
        <IonContent :fullscreen="true" class="library-content">
            <SiteHeader />

            <main class="library-page nv-page-shell">
                <header class="page-header nv-page-heading">
                    <div class="page-heading-top">
                        <button type="button" class="back-button" aria-label="Voltar à página anterior" @click="goBack">
                            <ion-icon :icon="arrowBackOutline" aria-hidden="true" />
                        </button>
                        <p class="nv-eyebrow nv-badge">ACERVO DIGITAL</p>
                    </div>
                    <h1 class="nv-page-title">
                        {{ selectedGenre ? `Gênero: ${selectedGenre}` : 'Pesquisar no acervo' }}
                    </h1>
                    <p v-if="!selectedGenre" class="nv-page-description">
                        Encontre documentos e obras compartilhados pela comunidade.
                    </p>
                </header>

                <label class="search-field">
                    <span class="visually-hidden">Pesquisar no acervo</span>
                    <ion-icon :icon="searchOutline" aria-hidden="true" />
                    <input v-model="searchQuery" type="search"
                        placeholder="Título, autor ou palavra-chave"
                        autocomplete="off" />
                    <button
                        type="button"
                        class="filter-trigger"
                        :class="{ 'has-active-filters': activeFilterCount > 0 }"
                        :aria-label="`Abrir filtros${activeFilterCount ? `, ${activeFilterCount} ativos` : ''}`"
                        @click="openFilters"
                    >
                        <ion-icon :icon="optionsOutline" aria-hidden="true" />
                        <span class="filter-trigger-label">Filtros</span>
                        <span v-if="activeFilterCount" class="filter-count">{{ activeFilterCount }}</span>
                    </button>
                </label>

                <nav class="catalog-tabs" role="tablist" aria-label="Tipo de conteúdo">
                    <button
                        type="button"
                        role="tab"
                        class="catalog-tab"
                        :class="{ 'is-selected': activeContentType === 'livro' }"
                        :aria-selected="activeContentType === 'livro'"
                        @click="activeContentType = 'livro'"
                    >
                        Livros
                    </button>
                    <button
                        type="button"
                        role="tab"
                        class="catalog-tab"
                        :class="{ 'is-selected': activeContentType === 'documento' }"
                        :aria-selected="activeContentType === 'documento'"
                        @click="activeContentType = 'documento'"
                    >
                        Documentos
                    </button>
                </nav>

                <nav class="quick-filters" aria-label="Filtros rápidos">
                    <button
                        type="button"
                        class="filter-chip"
                        :class="{ 'is-selected': !activeFilterCount && !selectedGenre }"
                        :aria-pressed="!activeFilterCount && !selectedGenre"
                        @click="applyFilters({ ...filters, category: '', format: '' })"
                    >
                        Todos
                    </button>
                    <button
                        v-for="category in availableCategories"
                        :key="category.value"
                        type="button"
                        class="filter-chip"
                        :class="{ 'is-selected': filters.category === category.value }"
                        :aria-pressed="filters.category === category.value"
                        @click="applyFilters({ ...filters, category: category.value, format: '' })"
                    >
                        {{ category.label }}
                    </button>
                    <button
                        v-for="format in quickFormats"
                        :key="format"
                        type="button"
                        class="filter-chip"
                        :class="{ 'is-selected': filters.format === format }"
                        :aria-pressed="filters.format === format"
                        @click="applyFilters({ ...filters, category: '', format: filters.format === format ? '' : format })"
                    >
                        {{ format }}
                    </button>
                </nav>

                <p v-if="!loading && !errorMessage" class="result-count" role="status">
                    {{ filteredItems.length }}
                    {{ activeContentType === 'livro'
                        ? (filteredItems.length === 1 ? 'livro encontrado' : 'livros encontrados')
                        : (filteredItems.length === 1 ? 'documento encontrado' : 'documentos encontrados') }}
                </p>

                <div v-if="loading" class="feedback" role="status">
                    <ion-spinner name="crescent" />
                    <span>Carregando o acervo...</span>
                </div>
                <p v-else-if="errorMessage" class="feedback error-message" role="alert">{{ errorMessage }}</p>
                <p v-else-if="filteredItems.length === 0" class="feedback">
                    {{ items.length ? `Nenhum ${activeContentType} corresponde à pesquisa.` : 'O acervo ainda não possui documentos.' }}
                </p>

                <section v-else class="item-grid" :aria-label="`${activeContentType === 'livro' ? 'Livros' : 'Documentos'} do acervo`">
                    <article v-for="item in filteredItems" :key="item.id" class="library-card">
                        <router-link
                            class="library-card-link"
                            :to="{ name: 'DocumentDetails', params: { id: item.id } }"
                            :aria-label="`${item.title}, por ${item.author}. Ver detalhes do documento.`"
                        >
                            <div class="cover">
                                <img v-if="item.cover_url" :src="item.cover_url" alt="" />
                                <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                            </div>
                            <div class="item-details">
                                <h2>{{ item.title }}</h2>
                                <p class="author">{{ item.author }}</p>
                                <p v-if="item.description" class="description">{{ item.description }}</p>
                                <p class="metadata">
                                    {{ item.category }} · {{ item.content_type }}
                                    <span v-if="item.year"> · {{ item.year }}</span>
                                    <span v-if="getFileExtension(item.file_name)"> · {{ getFileExtension(item.file_name) }}</span>
                                </p>
                            </div>
                        </router-link>
                        <button
                            v-if="item.content_type === 'livro'"
                            type="button"
                            class="save-book-button"
                            :class="{ 'is-saved': savedBookIds.has(item.id) }"
                            :aria-label="`${savedBookIds.has(item.id) ? 'Gerenciar coleções de' : 'Salvar'} ${item.title}`"
                            :aria-pressed="savedBookIds.has(item.id)"
                            @click="openCollectionPicker(item)"
                        >
                            <ion-icon :icon="savedBookIds.has(item.id) ? bookmark : bookmarkOutline" aria-hidden="true" />
                        </button>
                    </article>
                </section>
            </main>

            <SiteFooter />
        </IonContent>
        <IonModal
            class="library-filter-modal"
            :is-open="isFilterModalOpen"
            :initial-breakpoint="0.95"
            :breakpoints="[0, 0.55, 0.72, 0.95]"
            @didDismiss="isFilterModalOpen = false"
        >
            <section class="filter-sheet" aria-labelledby="filter-sheet-title">
                <header class="filter-sheet-header">
                    <div>
                        <h2 id="filter-sheet-title">Filtrar acervo</h2>
                        <p>Combine os critérios para refinar os resultados.</p>
                    </div>
                    <button type="button" class="filter-sheet-close" aria-label="Fechar filtros"
                        @click="isFilterModalOpen = false">×</button>
                </header>

                <div class="filter-fields">
                    <label class="filter-field">
                        <span>Categoria</span>
                        <select v-model="draftFilters.category">
                            <option value="">Todas as categorias</option>
                            <option v-for="option in availableCategories" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </label>
                    <label class="filter-field">
                        <span>Tipo</span>
                        <select v-model="draftFilters.type">
                            <option value="">Todos os tipos</option>
                            <option v-for="option in availableTypes" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </label>
                    <label class="filter-field">
                        <span>Formato</span>
                        <select v-model="draftFilters.format">
                            <option value="">Todos os formatos</option>
                            <option v-for="option in availableFormats" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </label>
                    <label class="filter-field">
                        <span>Idioma</span>
                        <select v-model="draftFilters.language">
                            <option value="">Todos os idiomas</option>
                            <option v-for="option in availableLanguages" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </label>
                </div>

                <footer class="filter-sheet-actions">
                    <button type="button" class="filter-reset" @click="resetDraftFilters">
                        Limpar filtros
                    </button>
                    <button type="button" class="filter-apply" @click="applyFilters(draftFilters)">
                        Mostrar resultados
                    </button>
                </footer>
            </section>
        </IonModal>
        <AddBookToCollectionModal
            :is-open="Boolean(collectionBook)"
            :book="collectionBook ?? emptyBook"
            @close="collectionBook = null"
            @saved="setBookSaved"
        />
    </IonPage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonContent, IonIcon, IonModal, IonPage, IonSpinner } from '@ionic/vue';
import { arrowBackOutline, bookmark, bookmarkOutline, documentTextOutline, optionsOutline, searchOutline } from 'ionicons/icons';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import AddBookToCollectionModal from '@/components/AddBookToCollectionModal.vue';
import { listMyBookCollections } from '@/services/bookCollectionService';
import { listPublicLibraryItems } from '@/services/libraryService';
import { useLibraryItemsSync } from '@/composables/useLibraryItemsSync';
import type { PublicLibraryItem } from '@/types/library';
import { getFileExtension } from '@/utils/getFileExtension';
import {
    getLibraryItemTags,
    normalizeLibraryGenre,
    normalizeLibraryTerm
} from '@/utils/libraryTaxonomy';
import { matchesLibrarySearch } from '@/utils/librarySearch';

const items = ref<PublicLibraryItem[]>([]);
const savedBookIds = ref(new Set<string>());
const collectionBook = ref<PublicLibraryItem | null>(null);
const emptyBook = { id: '', title: '' };
const route = useRoute();
const router = useRouter();
const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '');
const selectedGenre = ref(typeof route.query.genre === 'string' ? route.query.genre : '');
const activeContentType = ref<'livro' | 'documento'>('livro');
const loading = ref(true);
const errorMessage = ref('');
type CatalogFilters = { category: string; type: string; format: string; language: string };
const emptyFilters = (): CatalogFilters => ({ category: '', type: '', format: '', language: '' });
const readQuery = (key: string) => typeof route.query[key] === 'string' ? route.query[key] as string : '';
const filters = ref<CatalogFilters>({
    category: readQuery('category'),
    type: readQuery('type'),
    format: readQuery('format'),
    language: readQuery('language')
});
const draftFilters = reactive<CatalogFilters>(emptyFilters());
const isFilterModalOpen = ref(false);
const normalizeFilterValue = (value: string) => normalizeLibraryTerm(value);
const uniqueOptions = (values: Array<string | null | undefined>) => {
    const options = new Map<string, string>();
    values.forEach((value) => {
        const label = value?.trim();
        if (!label) return;
        const key = normalizeFilterValue(label);
        if (key && !options.has(key)) options.set(key, label);
    });
    return [...options].map(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'));
};
const availableCategories = computed(() => uniqueOptions(items.value.map((item) => item.category)));
const availableTypes = computed(() => uniqueOptions(items.value.map((item) => item.content_type)));
const availableFormats = computed(() => uniqueOptions(items.value.map((item) => getFileExtension(item.file_name))));
const availableLanguages = computed(() => uniqueOptions(items.value.map((item) => item.language)));
const quickFormats = computed(() => availableFormats.value
    .map((option) => option.value)
    .filter((format) => ['pdf', 'epub'].includes(format))
    .slice(0, 2));
const activeFilterCount = computed(() => Object.values(filters.value).filter(Boolean).length);

const loadSavedBooks = async () => {
    try {
        const collections = await listMyBookCollections();
        savedBookIds.value = new Set(collections.flatMap(({ items: books }) => books.map(({ id }) => id)));
    } catch (error) {
        console.error('Não foi possível carregar os livros salvos nas coleções.', error);
    }
};

const openCollectionPicker = (book: PublicLibraryItem) => {
    collectionBook.value = book;
};

const setBookSaved = (isSaved: boolean) => {
    if (!collectionBook.value) return;
    const savedIds = new Set(savedBookIds.value);
    if (isSaved) savedIds.add(collectionBook.value.id);
    else savedIds.delete(collectionBook.value.id);
    savedBookIds.value = savedIds;
};

const syncFiltersFromRoute = () => {
    filters.value = {
        category: normalizeFilterValue(readQuery('category')),
        type: normalizeFilterValue(readQuery('type')),
        format: normalizeFilterValue(readQuery('format')),
        language: normalizeFilterValue(readQuery('language'))
    };
};

const applyFilters = (nextFilters: CatalogFilters) => {
    const normalized = Object.fromEntries(
        Object.entries(nextFilters).map(([key, value]) => [key, normalizeFilterValue(value)])
    ) as CatalogFilters;
    const query = { ...route.query };
    for (const [key, value] of Object.entries(normalized)) {
        if (value) query[key] = value;
        else delete query[key];
    }
    void router.replace({ query });
    filters.value = normalized;
    isFilterModalOpen.value = false;
};

const openFilters = () => {
    Object.assign(draftFilters, filters.value);
    isFilterModalOpen.value = true;
};

const goBack = () => {
    const previousRoute = router.options.history.state.back;
    if (typeof previousRoute === 'string' && previousRoute.startsWith('/')) {
        router.back();
        return;
    }

    void router.replace(selectedGenre.value ? { name: 'Generos' } : { name: 'Home' });
};

const resetDraftFilters = () => {
    Object.assign(draftFilters, emptyFilters());
};

watch(
    () => route.query.q,
    (query) => {
        searchQuery.value = typeof query === 'string' ? query : '';
    }
);

watch(
    () => route.query.genre,
    (genre) => {
        selectedGenre.value = typeof genre === 'string' ? genre : '';
    }
);

watch(
    () => [route.query.category, route.query.type, route.query.format, route.query.language],
    syncFiltersFromRoute
);

const filteredItems = computed(() => {
    const genre = normalizeLibraryGenre(selectedGenre.value);
    const active = filters.value;
    return items.value.filter((item) => {
        if (item.content_type !== activeContentType.value) return false;
        const matchesQuery = matchesLibrarySearch(item, searchQuery.value);
        const matchesGenre = !genre || getLibraryItemTags(item.genre, item.category)
            .some((tag) => normalizeLibraryGenre(tag) === genre);
        const matchesCategory = !active.category || normalizeFilterValue(item.category) === active.category;
        const matchesType = !active.type || normalizeFilterValue(item.content_type) === active.type;
        const matchesFormat = !active.format || normalizeFilterValue(getFileExtension(item.file_name)) === active.format;
        const matchesLanguage = !active.language || normalizeFilterValue(item.language ?? '') === active.language;
        return matchesQuery && matchesGenre && matchesCategory && matchesType && matchesFormat && matchesLanguage;
    }).sort((left, right) =>
        left.title.localeCompare(right.title, 'pt-BR', { sensitivity: 'base', numeric: true })
        || left.id.localeCompare(right.id)
    );
});

const refreshItems = async () => {
    try {
        items.value = await listPublicLibraryItems();
        errorMessage.value = '';
    } catch (error) {
        if (items.value.length === 0) {
            errorMessage.value = error instanceof Error
                ? `Não foi possível carregar o acervo: ${error.message}`
                : 'Não foi possível carregar o acervo.';
        } else {
            console.error('Não foi possível atualizar o acervo.', error);
        }
    } finally {
        loading.value = false;
    }
};

useLibraryItemsSync(refreshItems);
onMounted(loadSavedBooks);
</script>

<style scoped>
.library-content {
    --background: var(--color-page-background);
}

.library-page {
    --content-width: 1120px;
    min-height: 60vh;
}

.page-heading-top {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
}

.page-heading-top .nv-eyebrow {
    margin: 0;
}

.back-button {
    display: grid;
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid var(--color-border-soft);
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-text-primary);
    font-size: 1.25rem;
    cursor: pointer;
}

.back-button:hover {
    background: var(--color-surface-alt);
}

.back-button:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 2px;
}

.search-field {
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(100%, 560px);
    min-height: var(--control-height);
    margin-bottom: 24px;
    padding: 0 14px;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control, var(--radius-sm));
    background: var(--color-surface);
    color: var(--color-text-secondary);
}

.search-field input {
    min-width: 0;
    flex: 1;
}

.filter-trigger {
    display: inline-flex;
    min-width: 40px;
    min-height: 40px;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 10px;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-brand-primary);
    font: inherit;
    font-size: var(--font-size-caption);
    font-weight: 700;
    cursor: pointer;
}

.filter-trigger ion-icon {
    font-size: 1.1rem;
}

.filter-count {
    display: grid;
    width: 20px;
    height: 20px;
    place-items: center;
    border-radius: 50%;
    background: var(--color-brand-primary);
    color: var(--color-white);
    font-size: 0.7rem;
}

.catalog-tabs {
    display: flex;
    gap: var(--space-lg);
    margin: -8px 0 var(--space-md);
    border-bottom: 1px solid var(--color-border-soft);
}

.catalog-tab {
    min-height: 44px;
    padding: 0 2px;
    border: 0;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    background: transparent;
    color: var(--color-text-secondary);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
}

.catalog-tab.is-selected {
    border-bottom-color: var(--color-brand-primary);
    color: var(--color-brand-primary);
}

.catalog-tab:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 2px;
}

.quick-filters {
    display: flex;
    max-width: 100%;
    gap: var(--space-sm);
    margin: calc(-1 * var(--space-sm)) 0 var(--space-md);
    overflow-x: auto;
    padding: 2px 2px 10px;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
}

.filter-chip {
    min-height: 40px;
    flex: 0 0 auto;
    padding: 0 14px;
    border: 1px solid var(--color-border-soft);
    border-radius: 999px;
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font: inherit;
    font-size: var(--font-size-caption);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
}

.filter-chip.is-selected {
    border-color: var(--color-brand-primary);
    background: var(--color-brand-primary);
    color: var(--color-white);
    box-shadow: 0 0 0 1px var(--color-brand-primary);
}

.filter-chip:focus-visible,
.filter-trigger:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 2px;
}

.result-count {
    margin: 0 0 var(--space-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.search-field input {
    width: auto;
    min-width: 0;
    flex: 1;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--color-text-primary);
}

.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
}

.feedback {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 120px;
    color: var(--color-text-secondary);
    text-align: center;
}

.error-message {
    color: var(--color-danger);
}

:global(ion-modal.library-filter-modal) {
    --height: auto;
    --border-radius: 20px 20px 0 0;
    --background: var(--color-surface);
    align-items: flex-end;
}

.filter-sheet {
    display: flex;
    max-height: min(90dvh, 700px);
    flex-direction: column;
    gap: var(--space-lg);
    overflow-y: auto;
    padding: var(--space-lg) var(--page-gutter) calc(var(--space-lg) + env(safe-area-inset-bottom, 0px));
    background: var(--color-surface);
    color: var(--color-text-primary);
}

.filter-sheet-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-md);
}

.filter-sheet-header h2 {
    margin: 0;
    font-size: 1.25rem;
}

.filter-sheet-header p {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.filter-sheet-close {
    display: grid;
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid var(--color-border-soft);
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-text-primary);
    font-size: 1.5rem;
    cursor: pointer;
}

.filter-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
}

.filter-field {
    display: grid;
    gap: var(--space-xs);
    color: var(--color-text-primary);
    font-size: var(--font-size-caption);
    font-weight: 700;
}

.filter-field select {
    width: 100%;
    min-height: var(--control-height);
    padding: 0 12px;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-white);
    color: var(--color-text-primary);
    font: inherit;
    font-weight: 400;
}

.filter-field select:focus-visible,
.filter-sheet-close:focus-visible,
.filter-reset:focus-visible,
.filter-apply:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 2px;
}

.filter-sheet-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
}

.filter-reset,
.filter-apply {
    min-height: var(--control-height);
    border-radius: var(--radius-control);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
}

.filter-reset {
    padding: 0 12px;
    border: 0;
    background: transparent;
    color: var(--color-brand-primary);
}

.filter-apply {
    padding: 0 18px;
    border: 1px solid var(--color-brand-primary);
    background: var(--color-brand-primary);
    color: var(--color-white);
}

.item-grid {
    display: flex;
    flex-direction: column;
}

.library-card {
    display: flex;
    align-items: center;
    min-width: 0;
    border-bottom: 1px solid var(--color-border-soft);
    transition: background-color 0.2s ease;
}

.library-card:first-child {
    border-top: 1px solid var(--color-border-soft);
}

.library-card:hover {
    background: var(--color-surface-alt);
}

.library-card-link {
    display: flex;
    flex: 1;
    align-items: center;
    gap: var(--space-md);
    min-width: 0;
    padding: var(--space-md) var(--space-sm);
    color: inherit;
    text-decoration: none;
}

.library-card-link:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: -2px;
}

.save-book-button {
    display: grid;
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    margin-inline: var(--space-xs);
    place-items: center;
    border: 1px solid var(--color-border-soft);
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: 1.25rem;
}

.save-book-button.is-saved {
    border-color: var(--color-brand-primary);
    color: var(--color-brand-primary);
}

.save-book-button:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 2px;
}

.cover {
    display: grid;
    flex: 0 0 76px;
    place-items: center;
    width: 76px;
    aspect-ratio: 0.72;
    overflow: hidden;
    border-radius: var(--radius-sm);
    background: var(--color-surface-alt);
    color: var(--color-text-muted);
    font-size: 2rem;
}

.cover img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.item-details {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
}

.item-details h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1.05rem;
}

.library-card:hover .item-details h2 {
    color: var(--color-brand-primary);
}

.author,
.description,
.metadata {
    margin: 6px 0 0;
    color: var(--color-text-secondary);
    font-size: 0.88rem;
}

.description {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
}

.metadata {
    padding-top: var(--space-xs);
    font-size: 0.78rem;
}

@media (max-width: 480px) {
    .library-card-link {
        gap: var(--space-sm);
        padding-inline: 0;
    }

    .save-book-button {
        margin-inline: 0;
    }

    .cover {
        flex-basis: 64px;
        width: 64px;
    }

    .description {
        -webkit-line-clamp: 2;
    }

    .filter-fields {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--space-sm);
    }

    .filter-trigger {
        width: 40px;
        padding-inline: 0;
    }

    .filter-trigger.has-active-filters {
        width: auto;
        padding-inline: 8px;
    }

    .filter-trigger-label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
    }
}
</style>
