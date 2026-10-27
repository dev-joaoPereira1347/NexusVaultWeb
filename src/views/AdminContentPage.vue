<template>
    <IonPage>
        <IonContent :fullscreen="true" class="admin-content">
            <SiteHeader />
            <main class="admin-page nv-page-shell">
                <header class="page-heading nv-page-heading">
                    <p class="nv-eyebrow nv-badge">ADMINISTRAÇÃO</p>
                    <h1 class="nv-page-title">Gestão administrativa</h1>
                    <p class="nv-page-description">
                        Gerencie contas, livros digitais e documentos de texto. As remoções são permanentes.
                    </p>
                </header>

                <div class="management-tabs" role="tablist" aria-label="Conteúdo administrativo">
                    <button
                        id="users-tab"
                        type="button"
                        role="tab"
                        aria-controls="users-panel"
                        :aria-selected="selectedTab === 'users'"
                        :tabindex="selectedTab === 'users' ? 0 : -1"
                        @click="selectTab('users')"
                        @keydown="handleTabKeydown"
                    >
                        Usuários
                    </button>
                    <button
                        id="documents-tab"
                        type="button"
                        role="tab"
                        aria-controls="documents-panel"
                        :aria-selected="selectedTab === 'documents'"
                        :tabindex="selectedTab === 'documents' ? 0 : -1"
                        @click="selectTab('documents')"
                        @keydown="handleTabKeydown"
                    >
                        Documentos de texto
                    </button>
                    <button
                        id="books-tab"
                        type="button"
                        role="tab"
                        aria-controls="books-panel"
                        :aria-selected="selectedTab === 'books'"
                        :tabindex="selectedTab === 'books' ? 0 : -1"
                        @click="selectTab('books')"
                        @keydown="handleTabKeydown"
                    >
                        Livros digitais
                    </button>
                </div>

                <section
                    v-if="selectedTab === 'users'"
                    id="users-panel"
                    class="management-panel nv-surface"
                    role="tabpanel"
                    aria-labelledby="users-tab"
                    tabindex="0"
                >
                    <header class="panel-heading">
                        <div>
                            <h2>Contas cadastradas</h2>
                            <p>Contas administrativas e a sua própria conta são protegidas contra exclusão.</p>
                        </div>
                        <button type="button" class="refresh-button" :disabled="loading || !!deletingId" @click="loadUsers">
                            Atualizar
                        </button>
                    </header>

                    <div v-if="loading" class="feedback" role="status">
                        <IonSpinner name="crescent" />
                        <span>Carregando usuários...</span>
                    </div>
                    <p v-else-if="errorMessage" class="feedback error-feedback" role="alert">{{ errorMessage }}</p>
                    <p v-else-if="users.length === 0" class="feedback">Nenhum usuário nesta página.</p>

                    <ul v-else class="entry-list">
                        <li v-for="managedUser in users" :key="managedUser.id" class="entry">
                            <div class="entry-copy">
                                <strong>{{ managedUser.name || managedUser.email || 'Conta sem identificação' }}</strong>
                                <span v-if="managedUser.name && managedUser.email">{{ managedUser.email }}</span>
                                <code>{{ managedUser.id }}</code>
                                <span v-if="managedUser.isAdmin" class="protected-label">Conta administrativa protegida</span>
                            </div>
                            <button
                                type="button"
                                class="delete-button"
                                :disabled="managedUser.isAdmin || deletingId === managedUser.id"
                                :aria-label="`Remover usuário ${managedUser.email || managedUser.id}`"
                                @click="confirmDeleteUser(managedUser)"
                            >
                                <IonSpinner v-if="deletingId === managedUser.id" name="crescent" />
                                <span v-else>Remover</span>
                            </button>
                        </li>
                    </ul>

                    <nav class="pagination" aria-label="Paginação de usuários">
                        <button type="button" :disabled="page === 1 || loading || !!deletingId" @click="changePage(-1)">Anterior</button>
                        <span>Página {{ page }}</span>
                        <button type="button" :disabled="!hasMore || loading || !!deletingId" @click="changePage(1)">Próxima</button>
                    </nav>
                </section>

                <section
                    v-else-if="selectedTab === 'documents'"
                    id="documents-panel"
                    class="management-panel nv-surface"
                    role="tabpanel"
                    aria-labelledby="documents-tab"
                    tabindex="0"
                >
                    <header class="panel-heading">
                        <div>
                            <h2>Documentos de texto</h2>
                            <p>Remover um documento também exclui seus arquivos e atualiza as denúncias relacionadas.</p>
                        </div>
                        <button type="button" class="refresh-button" :disabled="loading || !!deletingId" @click="loadDocuments">
                            Atualizar
                        </button>
                    </header>

                    <div v-if="loading" class="feedback" role="status">
                        <IonSpinner name="crescent" />
                        <span>Carregando documentos...</span>
                    </div>
                    <p v-else-if="errorMessage" class="feedback error-feedback" role="alert">{{ errorMessage }}</p>
                    <p v-else-if="documents.length === 0" class="feedback">Nenhum documento nesta página.</p>

                    <ul v-else class="entry-list">
                        <li v-for="document in documents" :key="document.id" class="entry">
                            <div class="entry-copy">
                                <strong>{{ document.title }}</strong>
                                <span>Por {{ document.author }}</span>
                                <code>Enviado por {{ document.uploaded_by }}</code>
                            </div>
                            <button
                                type="button"
                                class="delete-button"
                                :disabled="deletingId === document.id"
                                :aria-label="`Remover documento ${document.title}`"
                                @click="confirmDeleteDocument(document)"
                            >
                                <IonSpinner v-if="deletingId === document.id" name="crescent" />
                                <span v-else>Remover</span>
                            </button>
                        </li>
                    </ul>

                    <nav class="pagination" aria-label="Paginação de documentos">
                        <button type="button" :disabled="page === 1 || loading || !!deletingId" @click="changePage(-1)">Anterior</button>
                        <span>Página {{ page }}</span>
                        <button type="button" :disabled="!hasMore || loading || !!deletingId" @click="changePage(1)">Próxima</button>
                    </nav>
                </section>

                <section
                    v-else
                    id="books-panel"
                    class="management-panel nv-surface"
                    role="tabpanel"
                    aria-labelledby="books-tab"
                    tabindex="0"
                >
                    <header class="panel-heading">
                        <div>
                            <h2>Livros digitais</h2>
                            <p>Gerencie livros do acervo sem misturá-los aos demais documentos.</p>
                        </div>
                        <button type="button" class="refresh-button" :disabled="loading || !!deletingId" @click="loadDocuments">
                            Atualizar
                        </button>
                    </header>

                    <div v-if="loading" class="feedback" role="status">
                        <IonSpinner name="crescent" />
                        <span>Carregando livros digitais...</span>
                    </div>
                    <p v-else-if="errorMessage" class="feedback error-feedback" role="alert">{{ errorMessage }}</p>
                    <p v-else-if="documents.length === 0" class="feedback">Nenhum livro nesta página.</p>

                    <ul v-else class="entry-list">
                        <li v-for="document in documents" :key="document.id" class="entry">
                            <div class="entry-copy">
                                <strong>{{ document.title }}</strong>
                                <span>Por {{ document.author }}</span>
                                <code>Enviado por {{ document.uploaded_by }}</code>
                            </div>
                            <button
                                type="button"
                                class="delete-button"
                                :disabled="deletingId === document.id"
                                :aria-label="`Remover livro ${document.title}`"
                                @click="confirmDeleteDocument(document)"
                            >
                                <IonSpinner v-if="deletingId === document.id" name="crescent" />
                                <span v-else>Remover</span>
                            </button>
                        </li>
                    </ul>

                    <nav class="pagination" aria-label="Paginação de livros digitais">
                        <button type="button" :disabled="page === 1 || loading || !!deletingId" @click="changePage(-1)">Anterior</button>
                        <span>Página {{ page }}</span>
                        <button type="button" :disabled="!hasMore || loading || !!deletingId" @click="changePage(1)">Próxima</button>
                    </nav>
                </section>
            </main>
            <SiteFooter />
        </IonContent>
    </IonPage>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { alertController, IonContent, IonPage, IonSpinner, toastController } from '@ionic/vue';
import SiteFooter from '@/components/SiteFooter.vue';
import SiteHeader from '@/components/SiteHeader.vue';
import {
    deleteAdminDocument,
    deleteAdminUser,
    listAdminDocuments,
    listAdminUsers
} from '@/services/adminContentService';
import type { AdminContentType, AdminManagedDocument, AdminManagedUser } from '@/services/adminContentService';

type ManagementTab = 'users' | 'documents' | 'books';
const contentTypeByTab: Record<Exclude<ManagementTab, 'users'>, AdminContentType> = {
    documents: 'documento',
    books: 'livro'
};

const selectedTab = ref<ManagementTab>('users');
const users = ref<AdminManagedUser[]>([]);
const documents = ref<AdminManagedDocument[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const deletingId = ref('');
const page = ref(1);
const hasMore = ref(false);

const loadUsers = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
        const result = await listAdminUsers(page.value);
        users.value = result.items;
        hasMore.value = result.hasMore;
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Não foi possível carregar os usuários.';
    } finally {
        loading.value = false;
    }
};

const loadDocuments = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
        const selectedContentType = selectedTab.value === 'users' ? 'documento' : contentTypeByTab[selectedTab.value];
        const result = await listAdminDocuments(page.value, selectedContentType);
        documents.value = result.items;
        hasMore.value = result.hasMore;
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Não foi possível carregar os documentos.';
    } finally {
        loading.value = false;
    }
};

const loadCurrentTab = async () => {
    if (selectedTab.value === 'users') await loadUsers();
    else await loadDocuments();
};

const selectTab = async (tab: ManagementTab) => {
    if (selectedTab.value === tab) return;
    selectedTab.value = tab;
    page.value = 1;
    await loadCurrentTab();
};

const changePage = async (direction: -1 | 1) => {
    page.value += direction;
    await loadCurrentTab();
};

const handleTabKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const tabs: ManagementTab[] = ['users', 'documents', 'books'];
    const currentIndex = tabs.indexOf(selectedTab.value);
    const nextIndex = (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    void selectTab(nextTab);
    const tabId = nextTab === 'users' ? 'users-tab' : 'documents-tab';
    document.getElementById(tabId)?.focus();
    event.preventDefault();
};

const showToast = async (message: string, color: 'success' | 'danger') => {
    const toast = await toastController.create({ message, duration: 3500, color, position: 'bottom' });
    await toast.present();
};

const confirmDeleteUser = async (managedUser: AdminManagedUser) => {
    if (managedUser.isAdmin || deletingId.value) return;
    const alert = await alertController.create({
        header: 'Remover conta permanentemente?',
        message: `A conta ${managedUser.email || managedUser.id}, seus documentos enviados, arquivos e solicitações pendentes serão removidos. Esta ação não pode ser desfeita.`,
        buttons: [
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Remover conta', role: 'destructive' }
        ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;

    deletingId.value = managedUser.id;
    try {
        const result = await deleteAdminUser(managedUser.id);
        users.value = users.value.filter((entry) => entry.id !== managedUser.id);
        if (users.value.length === 0 && page.value > 1) {
            page.value -= 1;
            await loadUsers();
        }
        await showToast(
            `Conta removida; ${result.removedDocuments} ${result.removedDocuments === 1 ? 'documento associado removido' : 'documentos associados removidos'}.`,
            'success'
        );
    } catch (error) {
        await showToast(error instanceof Error ? error.message : 'Não foi possível remover a conta.', 'danger');
    } finally {
        deletingId.value = '';
    }
};

const confirmDeleteDocument = async (document: AdminManagedDocument) => {
    if (deletingId.value) return;
    const contentType = selectedTab.value === 'users' ? 'documento' : contentTypeByTab[selectedTab.value];
    const contentLabel = contentType === 'livro' ? 'livro' : 'documento';
    const alert = await alertController.create({
        header: `Remover ${contentLabel} permanentemente?`,
        message: `“${document.title}”, os arquivos associados e os metadados serão removidos. Esta ação não pode ser desfeita.`,
        buttons: [
            { text: 'Cancelar', role: 'cancel' },
            { text: `Remover ${contentLabel}`, role: 'destructive' }
        ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;

    deletingId.value = document.id;
    try {
        await deleteAdminDocument(document.id, contentType);
        documents.value = documents.value.filter((entry) => entry.id !== document.id);
        if (documents.value.length === 0 && page.value > 1) {
            page.value -= 1;
            await loadDocuments();
        }
        await showToast('Documento e arquivos removidos.', 'success');
    } catch (error) {
        await showToast(error instanceof Error ? error.message : 'Não foi possível remover o documento.', 'danger');
    } finally {
        deletingId.value = '';
    }
};

onMounted(loadUsers);
</script>

<style scoped>
.admin-content {
    --background: var(--color-page-background);
}

.admin-page {
    --content-width: 1120px;
    min-height: 60vh;
}

.management-tabs {
    display: flex;
    margin-bottom: var(--space-md);
    border-bottom: 1px solid var(--color-border-soft);
}

.management-tabs button {
    position: relative;
    min-width: 8rem;
    min-height: 48px;
    padding: var(--space-sm) var(--space-md);
    border: 0;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    font: inherit;
    font-weight: var(--primitive-font-weight-semibold);
}

.management-tabs button[aria-selected="true"] {
    color: var(--color-text-primary);
}

.management-tabs button[aria-selected="true"]::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 3px;
    border-radius: 999px;
    background: var(--color-brand-primary);
    content: "";
}

.management-tabs button:focus-visible,
.management-panel:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 2px;
}

.management-panel {
    min-width: 0;
    padding: var(--surface-padding);
}

.panel-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-md);
    margin-bottom: var(--space-md);
}

.panel-heading h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--typography-heading-h3-font-size);
}

.panel-heading p {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.refresh-button,
.pagination button,
.delete-button {
    min-height: 40px;
    padding: 0 var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text-primary);
    cursor: pointer;
    font: inherit;
    font-weight: var(--primitive-font-weight-semibold);
}

.refresh-button:disabled,
.pagination button:disabled,
.delete-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
}

.delete-button {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.delete-button:not(:disabled):hover {
    background: rgba(180, 35, 24, 0.08);
}

.refresh-button:focus-visible,
.pagination button:focus-visible,
.delete-button:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 2px;
}

.entry-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.entry {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-md) 0;
    border-top: 1px solid var(--color-border-soft);
}

.entry-copy {
    display: grid;
    min-width: 0;
    gap: var(--space-xs);
}

.entry-copy strong {
    overflow-wrap: anywhere;
    color: var(--color-text-primary);
}

.entry-copy span,
.entry-copy code {
    overflow-wrap: anywhere;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.protected-label {
    color: var(--color-text-muted) !important;
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

.error-feedback {
    color: var(--color-danger);
}

.pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    margin-top: var(--space-md);
    color: var(--color-text-secondary);
}

@media (max-width: 600px) {
    .management-panel {
        padding: var(--space-md);
    }

    .panel-heading {
        flex-direction: column;
    }

    .entry {
        align-items: flex-start;
    }

    .delete-button {
        min-height: 44px;
        padding-inline: var(--space-sm);
    }
}
</style>
