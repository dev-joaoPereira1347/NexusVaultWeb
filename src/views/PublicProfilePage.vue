<template>
    <IonPage>
        <IonContent :fullscreen="true" class="profile-content">
            <SiteHeader />

            <main class="public-profile nv-page-shell">
                <div v-if="loading" class="feedback" role="status">
                    <ion-spinner name="crescent" />
                    <span>Carregando perfil do colaborador...</span>
                </div>
                <section v-else-if="errorMessage" class="feedback error-message" role="alert">
                    {{ errorMessage }}
                </section>
                <template v-else-if="profile">
                    <section class="profile-card nv-surface">
                        <img
                            v-if="profile.avatar_url"
                            class="avatar"
                            :src="profile.avatar_url"
                            alt="Foto do colaborador"
                        />
                        <div v-else class="avatar avatar-fallback" aria-hidden="true">
                            <ion-icon :icon="personCircleOutline" />
                        </div>
                        <div>
                            <p class="nv-eyebrow nv-badge">COLABORADOR DO ACERVO</p>
                            <h1 class="nv-page-title">{{ profile.username || 'Colaborador do NexusVault' }}</h1>
                        </div>
                        <button type="button" class="report-profile-button" @click="openReportModal">
                            Denunciar perfil
                        </button>
                    </section>

                    <section class="contributions public-collections" aria-labelledby="collections-title">
                        <h2 id="collections-title" class="section-title">Coleções públicas</h2>
                        <p v-if="collectionsError" class="feedback error-message" role="alert">{{ collectionsError }}</p>
                        <p v-else-if="collections.length === 0" class="feedback nv-surface">
                            Este colaborador ainda não compartilhou coleções públicas.
                        </p>
                        <div v-else class="public-collection-grid">
                            <article v-for="collection in collections" :key="collection.id" class="public-collection nv-surface">
                                <header>
                                    <h3>{{ collection.name }}</h3>
                                    <p v-if="collection.description">{{ collection.description }}</p>
                                </header>
                                <ul v-if="collection.items.length">
                                    <li v-for="book in collection.items" :key="book.id">
                                        <RouterLink :to="{ name: 'DocumentDetails', params: { id: book.id } }">
                                            {{ book.title }}
                                        </RouterLink>
                                        <span>Por {{ book.author }}</span>
                                    </li>
                                </ul>
                                <p v-else class="empty-collection">Esta coleção ainda não tem livros.</p>
                            </article>
                        </div>
                    </section>

                    <section class="contributions" aria-labelledby="contributions-title">
                        <h2 id="contributions-title" class="section-title">Livros enviados</h2>
                        <p v-if="items.length === 0" class="feedback nv-surface">
                            Este colaborador ainda não possui livros públicos no acervo.
                        </p>
                        <div v-else class="item-grid">
                            <article v-for="item in items" :key="item.id" class="library-card nv-surface">
                                <div class="cover">
                                    <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`" />
                                    <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                                </div>
                                <div class="item-details">
                                    <h3>
                                        <RouterLink :to="{ name: 'DocumentDetails', params: { id: item.id } }">
                                            {{ item.title }}
                                        </RouterLink>
                                    </h3>
                                    <p class="author">Por {{ item.author }}</p>
                                    <p class="metadata">{{ item.category }} · {{ item.content_type }}</p>
                                    <RouterLink class="details-link" :to="{ name: 'DocumentDetails', params: { id: item.id } }">
                                        Ver detalhes
                                    </RouterLink>
                                </div>
                            </article>
                        </div>
                    </section>
                </template>
            </main>

            <SiteFooter />
        </IonContent>
        <IonModal class="profile-report-modal" :is-open="isReportModalOpen" @didDismiss="closeReportModal">
            <form class="profile-report-form" @submit.prevent="submitReport">
                <header class="profile-report-header">
                    <div>
                        <p class="nv-eyebrow nv-badge">AJUDE A MANTER A COMUNIDADE SEGURA</p>
                        <h2>Denunciar perfil</h2>
                    </div>
                    <button type="button" aria-label="Fechar denúncia" @click="closeReportModal">×</button>
                </header>
                <p class="reported-profile-name">{{ profile?.username || 'Colaborador do NexusVault' }}</p>
                <label class="profile-report-field">
                    <span>Motivo da denúncia</span>
                    <select v-model="reportReason" required>
                        <option disabled value="">Selecione um motivo</option>
                        <option value="harassment">Assédio ou comportamento abusivo</option>
                        <option value="impersonation">Falsidade ideológica ou personificação</option>
                        <option value="fake_profile">Perfil falso ou enganoso</option>
                        <option value="spam">Spam ou atividade enganosa</option>
                        <option value="inappropriate">Conteúdo ou comportamento impróprio</option>
                        <option value="other">Outro motivo</option>
                    </select>
                </label>
                <label class="profile-report-field">
                    <span>Detalhes <span class="report-optional">(opcional)</span></span>
                    <textarea
                        v-model="reportDetails"
                        maxlength="2000"
                        rows="5"
                        placeholder="Descreva o problema para ajudar a equipe a analisar a denúncia."
                    />
                    <small>{{ reportDetails.length }}/2000</small>
                </label>
                <p class="report-privacy">A denúncia será enviada à equipe de moderação para análise.</p>
                <button class="profile-report-submit" type="submit" :disabled="isSubmittingReport || !reportReason">
                    {{ isSubmittingReport ? 'Enviando denúncia...' : 'Enviar denúncia' }}
                </button>
            </form>
        </IonModal>
    </IonPage>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { IonContent, IonIcon, IonModal, IonPage, IonSpinner, toastController } from '@ionic/vue';
import { documentTextOutline, personCircleOutline } from 'ionicons/icons';
import SiteFooter from '@/components/SiteFooter.vue';
import SiteHeader from '@/components/SiteHeader.vue';
import { getCurrentSession, getPublicProfile } from '@/services/authService';
import { submitUserReport, type DocumentReportReason } from '@/services/documentReportService';
import { listPublicLibraryItemsByUploader } from '@/services/libraryService';
import { listPublicBookCollections } from '@/services/bookCollectionService';
import { useLibraryItemsSync } from '@/composables/useLibraryItemsSync';
import type { ProfileData } from '@/types/auth';
import type { PublicLibraryItem } from '@/types/library';
import type { BookCollection } from '@/types/bookCollections';

const route = useRoute();
const router = useRouter();
const profile = ref<Pick<ProfileData, 'username' | 'avatar_url'> | null>(null);
const items = ref<PublicLibraryItem[]>([]);
const collections = ref<BookCollection[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const collectionsError = ref('');
const isReportModalOpen = ref(false);
const isSubmittingReport = ref(false);
const reportReason = ref<DocumentReportReason | ''>('');
const reportDetails = ref('');

watch(
    () => route.params.id,
    async (id) => {
        profile.value = null;
        items.value = [];
        collections.value = [];
        collectionsError.value = '';
        errorMessage.value = '';
        loading.value = true;

        if (typeof id !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) {
            errorMessage.value = 'Identificador do colaborador inválido.';
            loading.value = false;
            return;
        }

        try {
            const [profileResult, libraryItems] = await Promise.all([
                getPublicProfile(id),
                listPublicLibraryItemsByUploader(id)
            ]);
            if (!profileResult) {
                errorMessage.value = 'O perfil deste colaborador não foi encontrado.';
                return;
            }
            profile.value = profileResult;
            items.value = libraryItems;
            try {
                collections.value = await listPublicBookCollections(id);
            } catch (error) {
                collectionsError.value = error instanceof Error
                    ? `Não foi possível carregar as coleções públicas: ${error.message}`
                    : 'Não foi possível carregar as coleções públicas.';
            }
        } catch (error) {
            errorMessage.value = error instanceof Error
                ? `Não foi possível carregar o perfil: ${error.message}`
                : 'Não foi possível carregar o perfil.';
        } finally {
            loading.value = false;
        }
    },
    { immediate: true }
);

const refreshItems = async () => {
    const id = route.params.id;
    if (typeof id !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) return;

    try {
        items.value = await listPublicLibraryItemsByUploader(id);
    } catch (error) {
        console.error('Não foi possível atualizar os livros enviados do perfil.', error);
    }

    try {
        collections.value = await listPublicBookCollections(id);
        collectionsError.value = '';
    } catch (error) {
        collectionsError.value = error instanceof Error
            ? `Não foi possível carregar as coleções públicas: ${error.message}`
            : 'Não foi possível carregar as coleções públicas.';
    }
};

const showToast = async (message: string, color: 'success' | 'danger') => {
    const toast = await toastController.create({ message, duration: 3500, color, position: 'bottom' });
    await toast.present();
};

const openReportModal = async () => {
    const id = route.params.id;
    if (typeof id !== 'string' || !profile.value) return;
    const { data: { session }, error } = await getCurrentSession();
    if (error) {
        await showToast(`Não foi possível verificar sua sessão: ${error.message}`, 'danger');
        return;
    }
    if (!session?.user) {
        await router.push({ name: 'Auth', query: { redirect: route.fullPath } });
        return;
    }
    if (session.user.id === id) {
        await showToast('Você não pode denunciar o próprio perfil.', 'danger');
        return;
    }
    reportReason.value = '';
    reportDetails.value = '';
    isReportModalOpen.value = true;
};

const closeReportModal = () => {
    if (isSubmittingReport.value) return;
    isReportModalOpen.value = false;
};

const submitReport = async () => {
    const id = route.params.id;
    if (typeof id !== 'string' || !reportReason.value || isSubmittingReport.value) return;
    isSubmittingReport.value = true;
    try {
        await submitUserReport({
            userId: id,
            reason: reportReason.value,
            details: reportDetails.value
        });
        isReportModalOpen.value = false;
        await showToast('Denúncia enviada. Obrigado por ajudar a comunidade.', 'success');
    } catch (error) {
        await showToast(
            error instanceof Error ? error.message : 'Não foi possível enviar a denúncia.',
            'danger'
        );
    } finally {
        isSubmittingReport.value = false;
    }
};

useLibraryItemsSync(refreshItems);
</script>

<style scoped>
.profile-content {
    --background: var(--color-page-background);
}

.public-profile {
    --content-width: 1120px;
    min-height: 60vh;
}

.profile-card {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
    padding: var(--surface-padding);
}

.report-profile-button {
    min-height: var(--control-height);
    flex: 0 0 auto;
    margin-left: auto;
    padding: 0 var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-danger);
    cursor: pointer;
    font: inherit;
    font-weight: var(--primitive-font-weight-semibold);
}

.report-profile-button:focus-visible,
.profile-report-header button:focus-visible,
.profile-report-submit:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 2px;
}

:global(ion-modal.profile-report-modal) {
    --width: min(100% - 32px, 560px);
    --height: fit-content;
    --max-height: min(90dvh, 760px);
    --border-radius: var(--radius-lg);
    --background: var(--color-surface);
}

.profile-report-form {
    display: grid;
    max-height: min(90dvh, 760px);
    gap: var(--space-md);
    overflow-y: auto;
    padding: var(--surface-padding);
    color: var(--color-text-primary);
}

.profile-report-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-md);
}

.profile-report-header .nv-eyebrow {
    margin-bottom: var(--space-sm);
}

.profile-report-header h2 {
    margin: 0;
    font-size: 1.15rem;
}

.profile-report-header button {
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    border: 1px solid var(--color-border-soft);
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-text-primary);
    cursor: pointer;
    font-size: 1.5rem;
}

.reported-profile-name {
    margin: 0;
    color: var(--color-text-secondary);
}

.profile-report-field {
    display: grid;
    gap: var(--space-xs);
    color: var(--color-text-primary);
    font-weight: var(--primitive-font-weight-semibold);
}

.profile-report-field select,
.profile-report-field textarea {
    width: 100%;
    min-height: var(--control-height);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-white);
    color: var(--color-text-primary);
    font: inherit;
    font-weight: var(--primitive-font-weight-regular);
}

.profile-report-field textarea {
    min-height: 120px;
    resize: vertical;
}

.profile-report-field small,
.report-privacy,
.report-optional {
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    font-weight: var(--primitive-font-weight-regular);
}

.profile-report-field small {
    justify-self: end;
}

.report-privacy {
    margin: 0;
}

.profile-report-submit {
    min-height: var(--control-height);
    border: 1px solid var(--color-brand-primary);
    border-radius: var(--radius-control);
    background: var(--color-brand-primary);
    color: var(--color-white);
    cursor: pointer;
    font: inherit;
    font-weight: var(--primitive-font-weight-semibold);
}

.profile-report-submit:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

.profile-report-field select:focus-visible,
.profile-report-field textarea:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 2px;
}

.avatar {
    width: 72px;
    height: 72px;
    flex: 0 0 72px;
    border-radius: 50%;
    object-fit: cover;
}

.avatar-fallback {
    display: grid;
    place-items: center;
    background: var(--color-surface-alt);
    color: var(--color-text-muted);
    font-size: 3rem;
}

.profile-card .nv-eyebrow {
    margin-bottom: var(--space-xs);
}

.public-collections {
    margin-bottom: var(--space-xl);
}

.public-collection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    gap: var(--space-md);
}

.public-collection {
    min-width: 0;
    padding: var(--surface-padding);
}

.public-collection h3 {
    margin: 0;
    color: var(--color-text-primary);
}

.public-collection header p,
.empty-collection {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-secondary);
}

.public-collection ul {
    display: grid;
    gap: var(--space-sm);
    margin: var(--space-md) 0 0;
    padding: 0;
    list-style: none;
}

.public-collection li {
    display: grid;
    gap: var(--space-xs);
}

.public-collection li a {
    color: var(--color-brand-primary);
    font-weight: var(--primitive-font-weight-semibold);
    text-decoration: none;
}

.public-collection li a:hover {
    text-decoration: underline;
}

.public-collection li span {
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.section-title {
    margin: 0 0 var(--space-md);
    color: var(--color-text-primary);
    font-size: 1.15rem;
}

.item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr));
    gap: var(--space-md);
}

.library-card {
    display: flex;
    gap: var(--space-md);
    min-width: 0;
    padding: var(--space-md);
}

.cover {
    display: grid;
    flex: 0 0 88px;
    width: 88px;
    height: 120px;
    overflow: hidden;
    place-items: center;
    border-radius: var(--radius-sm);
    background: var(--color-surface-alt);
    color: var(--color-text-muted);
    font-size: 2rem;
}

.cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.item-details {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
}

.item-details h3 {
    margin: 0;
    font-size: 1.05rem;
}

.item-details h3 a {
    color: var(--color-text-primary);
    text-decoration: none;
}

.item-details h3 a:hover,
.details-link:hover {
    text-decoration: underline;
}

.author,
.metadata {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.details-link {
    margin-top: auto;
    padding-top: var(--space-sm);
    color: var(--color-brand-primary);
    font-size: var(--font-size-caption);
    font-weight: 700;
    text-decoration: none;
}

.feedback {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    min-height: 120px;
    padding: var(--space-md);
    color: var(--color-text-secondary);
    text-align: center;
}

.error-message {
    color: var(--color-danger);
}

@media (max-width: 560px) {
    .profile-card {
        flex-wrap: wrap;
    }

    .report-profile-button {
        margin-left: 0;
    }
}
</style>
