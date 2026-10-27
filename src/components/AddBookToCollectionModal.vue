<template>
    <IonModal
        class="collection-picker-modal"
        :is-open="isOpen"
        :initial-breakpoint="0.72"
        :breakpoints="[0, 0.55, 0.72, 0.95]"
        @didDismiss="emit('close')"
    >
        <section class="collection-picker" :aria-labelledby="titleId">
            <header class="picker-header">
                <div>
                    <p class="nv-eyebrow nv-badge">SALVAR OBRA</p>
                    <h2 :id="titleId">{{ selectionOnly ? 'Organizar em coleções' : 'Adicionar a uma coleção' }}</h2>
                    <p class="picker-book">{{ book?.title ?? 'Organize o livro que você está enviando.' }}</p>
                </div>
                <button type="button" class="picker-close" aria-label="Fechar" @click="emit('close')">×</button>
            </header>

            <p v-if="errorMessage" class="picker-message picker-error" role="alert">{{ errorMessage }}</p>
            <p v-if="successMessage" class="picker-message" role="status">{{ successMessage }}</p>
            <p v-if="loading" class="picker-loading" role="status">Carregando suas coleções...</p>
            <p v-else-if="!collections.length && !errorMessage" class="picker-empty">
                Você ainda não tem coleções. Crie uma para guardar esta obra.
            </p>
            <ul v-else class="picker-collection-list" aria-label="Suas coleções">
                <li v-for="collection in collections" :key="collection.id">
                    <button
                        type="button"
                        class="picker-collection-option"
                        :disabled="busy"
                        :aria-pressed="isSelected(collection)"
                        @click="selectionOnly ? toggleSelection(collection) : toggleBook(collection)"
                    >
                        <span class="picker-check" :class="{ 'is-checked': isSelected(collection) }" aria-hidden="true">
                            <ion-icon :icon="isSelected(collection) ? checkmarkOutline : addOutline" />
                        </span>
                        <span class="picker-collection-copy">
                            <strong>{{ collection.name }}</strong>
                            <small>{{ collection.is_public ? 'Pública' : 'Privada' }} · {{ collection.items.length }} {{ collection.items.length === 1 ? 'obra' : 'obras' }}</small>
                        </span>
                        <span v-if="isSelected(collection)" class="picker-saved">
                            {{ selectionOnly ? 'Selecionada' : 'Salvo' }}
                        </span>
                    </button>
                </li>
            </ul>

            <form v-if="showCreateForm" class="picker-create-form" @submit.prevent="createAndSave">
                <label for="quick-collection-name">Nome da coleção</label>
                <input
                    id="quick-collection-name"
                    v-model="newCollectionName"
                    maxlength="80"
                    required
                    autofocus
                    placeholder="Ex.: Ler depois"
                />
                <label class="picker-privacy">
                    <input v-model="newCollectionPublic" type="checkbox" />
                    <span>Coleção pública</span>
                </label>
                <div class="picker-create-actions">
                    <button type="button" class="picker-cancel" :disabled="busy" @click="showCreateForm = false">Cancelar</button>
                    <button type="submit" class="picker-create-submit" :disabled="busy || !newCollectionName.trim()">
                        {{ busy ? 'Salvando...' : selectionOnly ? 'Criar e selecionar' : 'Criar e salvar' }}
                    </button>
                </div>
            </form>

            <footer class="picker-footer">
                <button v-if="!showCreateForm" type="button" class="picker-new-collection" :disabled="busy"
                    @click="showCreateForm = true">
                    <ion-icon :icon="addOutline" aria-hidden="true" />
                    Criar nova coleção
                </button>
            </footer>
        </section>
    </IonModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { IonIcon, IonModal, toastController } from '@ionic/vue';
import { addOutline, checkmarkOutline } from 'ionicons/icons';
import {
    addBookToCollection,
    createBookCollection,
    listMyBookCollections,
    removeBookFromCollection
} from '@/services/bookCollectionService';
import type { BookCollection } from '@/types/bookCollections';
import type { PublicLibraryItem } from '@/types/library';

const props = defineProps<{
    isOpen: boolean;
    book?: Pick<PublicLibraryItem, 'id' | 'title'>;
    selectionOnly?: boolean;
    selectedIds?: string[];
}>();
const emit = defineEmits<{
    close: [];
    saved: [isSaved: boolean];
    updateSelected: [selectedIds: string[]];
}>();

const titleId = computed(() => `collection-picker-title-${props.book?.id ?? 'upload'}`);
const collections = ref<BookCollection[]>([]);
const selectedIdsLocal = ref<string[]>([]);
const loading = ref(false);
const busy = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const showCreateForm = ref(false);
const newCollectionName = ref('');
const newCollectionPublic = ref(false);
const MAX_SELECTED_COLLECTIONS = 100;

const isSelected = (collection: BookCollection) => props.selectionOnly
    ? selectedIdsLocal.value.includes(collection.id)
    : collection.items.some(({ id }) => id === props.book?.id);

const toggleSelection = (collection: BookCollection) => {
    const selected = new Set(selectedIdsLocal.value);
    if (selected.has(collection.id)) selected.delete(collection.id);
    else if (selected.size < MAX_SELECTED_COLLECTIONS) selected.add(collection.id);
    else {
        errorMessage.value = `Você pode selecionar no máximo ${MAX_SELECTED_COLLECTIONS} coleções.`;
        return;
    }
    errorMessage.value = '';
    selectedIdsLocal.value = [...selected];
    emit('updateSelected', selectedIdsLocal.value);
};

const loadCollections = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
        collections.value = await listMyBookCollections();
        if (!props.selectionOnly) {
            emit('saved', collections.value.some((collection) =>
                collection.items.some(({ id }) => id === props.book?.id)));
        }
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Não foi possível carregar suas coleções.';
    } finally {
        loading.value = false;
    }
};

const showToast = async (message: string) => {
    const toast = await toastController.create({
        message,
        duration: 2200,
        color: 'success',
        position: 'bottom'
    });
    await toast.present();
};

const toggleBook = async (collection: BookCollection) => {
    if (busy.value) return;
    busy.value = true;
    errorMessage.value = '';
    successMessage.value = '';
    const wasSaved = isSelected(collection);
    try {
        if (wasSaved) {
            if (!props.book) throw new Error('Livro não identificado.');
            await removeBookFromCollection(collection.id, props.book.id);
        } else {
            if (!props.book) throw new Error('Livro não identificado.');
            await addBookToCollection(collection.id, props.book.id);
        }
        await loadCollections();
        const message = wasSaved
            ? `“${props.book?.title}” removido de “${collection.name}”.`
            : `“${props.book?.title}” salvo em “${collection.name}”.`;
        successMessage.value = message;
        await showToast(message);
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Não foi possível atualizar a coleção.';
    } finally {
        busy.value = false;
    }
};

const createAndSave = async () => {
    if (busy.value || !newCollectionName.value.trim()) return;
    busy.value = true;
    errorMessage.value = '';
    try {
        const collectionName = newCollectionName.value.trim();
        const collectionId = await createBookCollection({
            name: collectionName,
            isPublic: newCollectionPublic.value
        });
        if (props.selectionOnly) {
            if (selectedIdsLocal.value.length >= MAX_SELECTED_COLLECTIONS) {
                throw new Error(`Você pode selecionar no máximo ${MAX_SELECTED_COLLECTIONS} coleções.`);
            }
            selectedIdsLocal.value = [...new Set([...selectedIdsLocal.value, collectionId])];
            emit('updateSelected', selectedIdsLocal.value);
        } else {
            if (!props.book) throw new Error('Livro não identificado.');
            await addBookToCollection(collectionId, props.book.id);
        }
        await loadCollections();
        newCollectionName.value = '';
        newCollectionPublic.value = false;
        showCreateForm.value = false;
        const message = props.selectionOnly
            ? `Coleção “${collectionName}” criada e selecionada.`
            : `“${props.book?.title}” salvo em “${collectionName}”.`;
        successMessage.value = message;
        await showToast(message);
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Não foi possível criar a coleção.';
    } finally {
        busy.value = false;
    }
};

watch(
    () => props.isOpen,
    (isOpen) => {
        if (!isOpen) return;
        showCreateForm.value = false;
        successMessage.value = '';
        selectedIdsLocal.value = [...(props.selectedIds ?? [])];
        void loadCollections();
    }
);
</script>

<style scoped>
.collection-picker-modal {
    --height: min(78vh, 680px);
    --border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    --background: var(--color-surface);
}

.collection-picker {
    display: flex;
    height: 100%;
    flex-direction: column;
    gap: var(--space-md);
    overflow: hidden;
    padding: var(--space-lg);
    color: var(--color-text-primary);
}

.picker-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-md);
}

.picker-header .nv-eyebrow {
    margin: 0 0 var(--space-xs);
}

.picker-header h2 {
    margin: 0;
    font-size: 1.2rem;
}

.picker-book {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-secondary);
}

.picker-close {
    width: 40px;
    height: 40px;
    border: 1px solid var(--color-border-soft);
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-text-primary);
    cursor: pointer;
    font-size: 1.5rem;
}

.picker-collection-list {
    display: grid;
    gap: var(--space-xs);
    overflow-y: auto;
    margin: 0;
    padding: 0 0 var(--space-sm);
    list-style: none;
}

.picker-collection-option {
    display: flex;
    width: 100%;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: inherit;
    cursor: pointer;
    text-align: left;
}

.picker-check {
    display: grid;
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 50%;
    background: var(--color-surface-alt);
    color: var(--color-text-secondary);
    font-size: 1.2rem;
}

.picker-check.is-checked {
    background: var(--color-brand-primary);
    color: var(--color-white);
}

.picker-collection-copy {
    display: grid;
    min-width: 0;
    gap: var(--space-2xs, 4px);
}

.picker-collection-copy small,
.picker-saved,
.picker-empty,
.picker-loading,
.picker-message {
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.picker-saved {
    margin-left: auto;
    color: var(--color-brand-primary);
    font-weight: 700;
}

.picker-message,
.picker-empty,
.picker-loading {
    margin: 0;
}

.picker-error {
    color: var(--color-danger);
}

.picker-create-form {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
}

.picker-create-form > label:first-child {
    font-weight: 600;
}

.picker-create-form input:not([type="checkbox"]) {
    width: 100%;
    min-height: var(--control-height);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-white);
    color: var(--color-text-primary);
    font: inherit;
}

.picker-privacy {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.picker-privacy input {
    width: 18px;
    height: 18px;
    accent-color: var(--color-brand-primary);
}

.picker-create-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
}

.picker-create-actions button,
.picker-new-collection {
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

.picker-create-actions .picker-cancel {
    border-color: var(--color-border-soft);
    background: var(--color-surface);
    color: var(--color-text-primary);
}

.picker-footer {
    position: sticky;
    bottom: 0;
    margin-top: auto;
    padding-top: var(--space-sm);
    background: var(--color-surface);
}

.picker-new-collection {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
}

button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}
</style>
