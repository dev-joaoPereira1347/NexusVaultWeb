<template>
    <section class="panel collections-panel" aria-labelledby="collections-title">
        <header class="collections-heading">
            <div>
                <h2 id="collections-title">Suas coleções</h2>
                <p>Organize seus livros em listas para encontrar tudo com facilidade.</p>
            </div>
            <button v-if="!createFormOpen" type="button" class="collection-primary-button"
                :disabled="busy !== ''" @click="createFormOpen = true">
                + Nova coleção
            </button>
        </header>

        <form v-if="createFormOpen" class="collection-create-form" @submit.prevent="handleCreateCollection">
            <label class="collection-name-field">
                <span>Nome da coleção</span>
                <input
                    v-model="draft.name"
                    maxlength="80"
                    required
                    autofocus
                    placeholder="Ex.: Ler nas férias"
                />
            </label>
            <label class="create-privacy">
                <input v-model="draft.isPublic" type="checkbox" />
                <span>Exibir no meu perfil público</span>
            </label>
            <div class="collection-form-actions">
                <button type="button" class="collection-secondary-button" :disabled="busy !== ''"
                    @click="cancelCreate">Cancelar</button>
                <button type="submit" class="collection-primary-button"
                    :disabled="busy !== '' || !draft.name.trim()">
                    {{ busy === 'create' ? 'Criando...' : 'Criar coleção' }}
                </button>
            </div>
        </form>

        <div v-if="errorMessage" class="collections-error" role="alert">
            <p class="collections-feedback">{{ errorMessage }}</p>
            <button type="button" class="collections-retry" :disabled="loading" @click="loadCollections">
                {{ loading ? 'Atualizando...' : 'Tentar novamente' }}
            </button>
        </div>
        <p v-if="successMessage" class="collections-feedback" role="status">{{ successMessage }}</p>
        <div v-if="loading" class="collections-empty" role="status">Carregando coleções...</div>
        <div v-else-if="collections.length === 0 && !errorMessage" class="collections-empty">
            <strong>Você ainda não tem coleções.</strong>
            <span>Crie uma lista para organizar os livros que quer ler depois.</span>
        </div>
        <div v-else class="collection-grid">
            <button
                v-for="collection in collections"
                :key="collection.id"
                type="button"
                class="collection-card"
                @click="openCollection(collection)"
            >
                <span class="collection-cover-mosaic" aria-hidden="true">
                    <span
                        v-for="index in 4"
                        :key="index"
                        class="mosaic-tile"
                        :class="{ 'mosaic-placeholder': !collection.items[index - 1]?.cover_url }"
                    >
                        <img
                            v-if="collection.items[index - 1]?.cover_url"
                            :src="collection.items[index - 1].cover_url"
                            alt=""
                        />
                    </span>
                </span>
                <span class="collection-card-copy">
                    <strong>{{ collection.name }}</strong>
                    <small>{{ collection.is_public ? 'Pública' : 'Privada' }} · {{ collection.items.length }} {{ collection.items.length === 1 ? 'livro' : 'livros' }}</small>
                </span>
            </button>
        </div>

        <IonModal
            class="collection-detail-modal"
            :is-open="Boolean(activeCollection)"
            @didDismiss="activeCollection = null"
        >
            <section v-if="activeCollection" class="collection-detail" :aria-labelledby="`collection-detail-${activeCollection.id}`">
                <header class="collection-detail-header">
                    <button type="button" class="collection-back-button" @click="activeCollection = null">
                        ← <span>Minhas coleções</span>
                    </button>
                    <button type="button" class="collection-close-button" aria-label="Fechar coleção"
                        @click="activeCollection = null">×</button>
                    <div class="detail-collection-mosaic" aria-hidden="true">
                        <span v-for="index in 4" :key="index" class="mosaic-tile">
                            <img v-if="activeCollection.items[index - 1]?.cover_url"
                                :src="activeCollection.items[index - 1].cover_url" alt="" />
                        </span>
                    </div>
                    <div class="collection-detail-title">
                        <p class="nv-eyebrow nv-badge">COLEÇÃO {{ activeCollection.is_public ? 'PÚBLICA' : 'PRIVADA' }}</p>
                        <h2 :id="`collection-detail-${activeCollection.id}`">{{ activeCollection.name }}</h2>
                        <p>{{ activeCollection.items.length }} {{ activeCollection.items.length === 1 ? 'livro' : 'livros' }}</p>
                    </div>
                </header>

                <div class="collection-detail-controls">
                    <section class="collection-edit-section" aria-label="Detalhes da coleção">
                        <template v-if="isEditingCollection">
                            <label class="collection-title-editor">
                                <span>Nome da coleção</span>
                                <input v-model="editDraft.name" maxlength="80" required />
                            </label>
                            <label class="detail-privacy">
                                <input v-model="editDraft.isPublic" type="checkbox" />
                                <span>Exibir no meu perfil público</span>
                            </label>
                            <div class="collection-form-actions">
                                <button type="button" class="collection-secondary-button" :disabled="busy !== ''"
                                    @click="cancelEdit">Cancelar</button>
                                <button type="button" class="collection-primary-button"
                                    :disabled="busy !== '' || !editDraft.name.trim()"
                                    @click="handleUpdateCollection">
                                    {{ busy.startsWith('update:') ? 'Salvando...' : 'Salvar alterações' }}
                                </button>
                            </div>
                        </template>
                        <button v-else type="button" class="collection-secondary-button"
                            :disabled="busy !== ''" @click="startEdit">
                            Editar coleção
                        </button>
                    </section>
                    <label class="collection-sort">
                        <span>Ordenar por</span>
                        <select v-model="sortOrder">
                            <option value="added">Adição</option>
                            <option value="title">Título</option>
                            <option value="author">Autor</option>
                        </select>
                    </label>
                    <button type="button" class="collection-delete-button" :disabled="busy !== ''"
                        @click="handleDeleteCollection">
                        Excluir coleção
                    </button>
                </div>

                <p v-if="activeCollection.items.length === 0" class="collections-empty">
                    Esta coleção está vazia. Use o marcador nos cards ou na página de um livro para adicioná-lo.
                </p>
                <ul v-else class="collection-book-list" aria-label="Livros desta coleção">
                    <li v-for="book in sortedBooks" :key="book.id" class="collection-book">
                        <RouterLink :to="{ name: 'DocumentDetails', params: { id: book.id } }" class="collection-book-link"
                            @click="activeCollection = null">
                            <span class="collection-book-cover">
                                <img v-if="book.cover_url" :src="book.cover_url" :alt="`Capa de ${book.title}`" />
                                <ion-icon v-else :icon="bookOutline" aria-hidden="true" />
                            </span>
                            <span class="collection-book-copy">
                                <strong>{{ book.title }}</strong>
                                <small>{{ book.author }}</small>
                            </span>
                        </RouterLink>
                        <button type="button" class="remove-book-button" :disabled="busy !== ''"
                            :aria-label="`Remover ${book.title} da coleção`"
                            @click="handleRemoveBook(book.id)">
                            <ion-icon :icon="removeCircleOutline" aria-hidden="true" />
                        </button>
                    </li>
                </ul>
            </section>
        </IonModal>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { IonIcon, IonModal, alertController } from '@ionic/vue';
import { bookOutline, removeCircleOutline } from 'ionicons/icons';
import {
    deleteBookCollection,
    createBookCollection,
    listMyBookCollections,
    removeBookFromCollection,
    updateBookCollection
} from '@/services/bookCollectionService';
import type { BookCollection, BookCollectionDraft } from '@/types/bookCollections';

type CollectionSort = 'added' | 'title' | 'author';
const collections = ref<BookCollection[]>([]);
const activeCollection = ref<BookCollection | null>(null);
const draft = ref<BookCollectionDraft>({ name: '', isPublic: false });
const editDraft = ref<BookCollectionDraft>({ name: '', isPublic: false });
const loading = ref(true);
const busy = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const sortOrder = ref<CollectionSort>('added');
const createFormOpen = ref(false);
const isEditingCollection = ref(false);

const sortedBooks = computed(() => {
    const items = [...(activeCollection.value?.items ?? [])];
    if (sortOrder.value === 'title') items.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    if (sortOrder.value === 'author') items.sort((a, b) => a.author.localeCompare(b.author, 'pt-BR'));
    return items;
});

const loadCollections = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
        collections.value = await listMyBookCollections();
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Não foi possível carregar as coleções.';
        throw error;
    } finally {
        loading.value = false;
    }
};

const reloadActiveCollection = async (id: string) => {
    await loadCollections();
    activeCollection.value = collections.value.find((collection) => collection.id === id) ?? null;
};

const runAction = async (actionId: string, success: string, action: () => Promise<void>) => {
    busy.value = actionId;
    errorMessage.value = '';
    successMessage.value = '';
    try {
        await action();
        const collectionId = activeCollection.value?.id;
        if (collectionId) await reloadActiveCollection(collectionId);
        else await loadCollections();
        successMessage.value = success;
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Não foi possível atualizar a coleção.';
    } finally {
        busy.value = '';
    }
};

const cancelCreate = () => {
    if (busy.value) return;
    createFormOpen.value = false;
    draft.value = { name: '', isPublic: false };
    errorMessage.value = '';
};

const handleCreateCollection = () => {
    if (!draft.value.name.trim() || busy.value) return;
    return runAction('create', 'Coleção criada.', async () => {
        await createBookCollection(draft.value);
        draft.value = { name: '', isPublic: false };
        createFormOpen.value = false;
    });
};

const openCollection = (collection: BookCollection) => {
    sortOrder.value = 'added';
    isEditingCollection.value = false;
    activeCollection.value = collection;
};

const startEdit = () => {
    if (!activeCollection.value) return;
    editDraft.value = {
        name: activeCollection.value.name,
        isPublic: activeCollection.value.is_public
    };
    isEditingCollection.value = true;
};

const cancelEdit = () => {
    isEditingCollection.value = false;
    editDraft.value = { name: '', isPublic: false };
};

const handleUpdateCollection = async () => {
    const collection = activeCollection.value;
    if (!collection || !editDraft.value.name.trim()) return;
    await runAction(`update:${collection.id}`, 'Coleção atualizada.', () =>
        updateBookCollection(collection.id, {
            name: editDraft.value.name,
            isPublic: editDraft.value.isPublic
        }));
    if (!errorMessage.value) cancelEdit();
};

const handleDeleteCollection = async () => {
    const collection = activeCollection.value;
    if (!collection) return;
    const alert = await alertController.create({
        header: 'Excluir coleção?',
        message: `“${collection.name}” será removida. Os livros continuarão no acervo.`,
        buttons: [
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Excluir coleção', role: 'destructive' }
        ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;
    await runAction(`delete:${collection.id}`, 'Coleção excluída.', async () => {
        await deleteBookCollection(collection.id);
        activeCollection.value = null;
    });
};

const handleRemoveBook = (bookId: string) => {
    const collection = activeCollection.value;
    if (!collection) return;
    void runAction(`remove:${collection.id}`, 'Livro removido da coleção.', () =>
        removeBookFromCollection(collection.id, bookId));
};

onMounted(() => {
    void loadCollections().catch(() => undefined);
});
</script>

<style scoped>
.collections-panel {
    padding: var(--surface-padding);
}

.collections-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-lg);
    margin-bottom: var(--space-lg);
}

.collections-heading h2 {
    margin: 0;
    color: var(--color-text-primary);
}

.collections-heading p,
.collection-detail-title > p:last-child {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-secondary);
}

.collection-create-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
    padding: var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--color-surface);
}

.collection-name-field {
    display: grid;
    gap: var(--space-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.collection-name-field input,
.collection-title-editor input,
.collection-sort select {
    min-height: var(--control-height);
    padding: 0 var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text-primary);
    font: inherit;
}

.collection-name-field input {
    width: 100%;
}

.create-privacy,
.detail-privacy {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.create-privacy input,
.detail-privacy input {
    width: 18px;
    height: 18px;
    accent-color: var(--color-brand-primary);
}

.collection-primary-button,
.collection-delete-button {
    min-height: var(--control-height);
    padding: 0 var(--space-md);
    border: 1px solid var(--color-brand-primary);
    border-radius: var(--radius-control);
    background: var(--color-brand-primary);
    color: var(--color-white);
    cursor: pointer;
    font: inherit;
    font-weight: 600;
}

.collection-secondary-button {
    min-height: var(--control-height);
    padding: 0 var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text-primary);
    cursor: pointer;
    font: inherit;
    font-weight: 600;
}

.collection-delete-button {
    border-color: var(--color-border-soft);
    background: transparent;
    color: var(--color-danger);
}

.collection-primary-button:disabled,
.collection-delete-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
}

.collection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
    gap: var(--space-md);
}

.collection-card {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text-primary);
    cursor: pointer;
    text-align: left;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.collection-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgb(34 34 59 / 12%);
}

.collection-cover-mosaic,
.detail-collection-mosaic {
    display: grid;
    grid-template-columns: 1fr 1fr;
    aspect-ratio: 1.65;
    overflow: hidden;
    border-radius: var(--radius-sm);
    background: var(--color-surface-alt);
}

.mosaic-tile {
    display: grid;
    overflow: hidden;
    place-items: center;
    background: var(--color-surface-alt);
}

.mosaic-tile:nth-child(2),
.mosaic-tile:nth-child(3) {
    background: var(--color-surface);
}

.mosaic-tile img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.collection-card-copy {
    display: grid;
    gap: var(--space-xs);
}

.collection-card-copy strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.collection-card-copy small,
.collections-empty,
.collections-feedback {
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.collections-empty {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-lg);
    text-align: center;
}

.collections-empty strong {
    color: var(--color-text-primary);
    font-size: 1rem;
}

.collection-form-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-sm);
}

.collections-error {
    color: var(--color-danger);
}

.collections-error .collections-feedback {
    margin-bottom: var(--space-sm);
}

.collections-retry {
    min-height: 38px;
    padding: 0 var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text-primary);
    cursor: pointer;
    font: inherit;
}

.collection-detail-modal {
    --background: var(--color-page-background);
}

.collection-detail {
    height: 100%;
    overflow-y: auto;
    padding: var(--space-lg);
    color: var(--color-text-primary);
}

.collection-detail-header {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-md);
    align-items: end;
}

.collection-back-button,
.collection-close-button {
    min-height: 40px;
    border: 0;
    background: transparent;
    color: var(--color-brand-primary);
    cursor: pointer;
    font: inherit;
    text-align: left;
}

.collection-close-button {
    color: var(--color-text-secondary);
    font-size: 1.6rem;
    text-align: center;
}

.detail-collection-mosaic {
    grid-column: 1 / -1;
    width: min(220px, 100%);
    aspect-ratio: 1;
}

.collection-detail-title .nv-eyebrow {
    margin: 0 0 var(--space-xs);
}

.collection-detail-title h2 {
    margin: 0;
    font-size: clamp(1.5rem, 5vw, 2.2rem);
}

.collection-detail-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--space-md);
    margin-block: var(--space-lg);
    padding-block: var(--space-md);
    border-block: 1px solid var(--color-border-soft);
}

.collection-edit-section {
    display: flex;
    flex: 1 1 100%;
    align-items: end;
    flex-wrap: wrap;
    gap: var(--space-md);
}

.collection-edit-section > .collection-form-actions {
    flex: 1 1 100%;
}

.collection-title-editor,
.collection-sort {
    display: grid;
    flex: 1 1 190px;
    gap: var(--space-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.collection-title-editor input,
.collection-sort select {
    width: 100%;
}

.collection-book-list {
    display: grid;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
}

.collection-book {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
}

.collection-book:hover {
    background: var(--color-surface);
}

.collection-book-link {
    display: flex;
    flex: 1;
    align-items: center;
    gap: var(--space-md);
    min-width: 0;
    color: inherit;
    text-decoration: none;
}

.collection-book-cover {
    display: grid;
    width: 54px;
    height: 72px;
    flex: 0 0 54px;
    overflow: hidden;
    place-items: center;
    border-radius: var(--radius-sm);
    background: var(--color-surface-alt);
    color: var(--color-text-muted);
}

.collection-book-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.collection-book-copy {
    display: grid;
    min-width: 0;
    gap: var(--space-xs);
}

.collection-book-copy strong,
.collection-book-copy small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.collection-book-copy small {
    color: var(--color-text-secondary);
}

.remove-book-button {
    display: grid;
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    place-items: center;
    border: 0;
    background: transparent;
    color: var(--color-danger);
    cursor: pointer;
    font-size: 1.3rem;
}

.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    clip-path: inset(50%);
}

@media (max-width: 700px) {
    .collections-heading {
        align-items: flex-start;
    }

    .collection-create-form {
        grid-template-columns: minmax(0, 1fr);
    }

    .collection-name-field input {
        width: 100%;
    }

    .collection-form-actions {
        justify-content: stretch;
    }

    .collection-form-actions > button {
        flex: 1;
    }

    .collection-detail {
        padding: var(--space-md);
    }
}
</style>
