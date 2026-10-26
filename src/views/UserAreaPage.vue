<template>
    <IonPage>
        <IonContent :fullscreen="true" :scroll-y="true" class="user-area-content">
            <SiteHeader />

            <main class="user-area nv-page-shell">
                <!-- Hero / SiteHeader da Área do Usuário -->
                <section class="identity-card">
                    <div class="identity-info">
                        <span class="nv-badge">ÁREA DO USUÁRIO</span>
                        <h1>{{ profileForm.fullName || profileForm.username || 'Minha Conta' }}</h1>
                        <p>Gerencie seu perfil, acompanhe o progresso de leitura, suas avaliações e contribuições para o
                            acervo.</p>
                    </div>
                </section>

                <!-- PageLoading State -->
                <div v-if="pageLoading" class="loading-state">
                    <ion-spinner name="crescent" color="primary" />
                    <span>Carregando as suas informações...</span>
                </div>

                <template v-else>
                    <div class="tab-navigation" role="tablist" aria-label="Seções da área do usuário">
                        <button id="profile-tab" type="button" role="tab" class="tab-button"
                            :class="{ 'is-active': selectedTab === 'profile' }"
                            :aria-selected="selectedTab === 'profile'" aria-controls="profile-panel"
                            @click="selectedTab = 'profile'">
                            <ion-icon :icon="personOutline" />
                            <span>Perfil &amp; Segurança</span>
                        </button>
                        <button id="uploads-tab" type="button" role="tab" class="tab-button"
                            :class="{ 'is-active': selectedTab === 'uploads' }"
                            :aria-selected="selectedTab === 'uploads'" aria-controls="uploads-panel"
                            @click="selectedTab = 'uploads'">
                            <ion-icon :icon="documentTextOutline" />
                            <span>Meus Envios ({{ contributions.length + uploadRequests.length }})</span>
                        </button>
                        <button id="progress-tab" type="button" role="tab" class="tab-button"
                            :class="{ 'is-active': selectedTab === 'progress' }"
                            :aria-selected="selectedTab === 'progress'" aria-controls="progress-panel"
                            @click="selectedTab = 'progress'">
                            <ion-icon :icon="bookOutline" />
                            <span>Progresso</span>
                        </button>
                        <button id="reviews-tab" type="button" role="tab" class="tab-button"
                            :class="{ 'is-active': selectedTab === 'reviews' }"
                            :aria-selected="selectedTab === 'reviews'" aria-controls="reviews-panel"
                            @click="selectedTab = 'reviews'">
                            <ion-icon :icon="starOutline" />
                            <span>Avaliações</span>
                        </button>
                    </div>

                    <!-- Aba 1: Perfil e Segurança -->
                    <div v-if="selectedTab === 'profile'" id="profile-panel" role="tabpanel"
                        aria-labelledby="profile-tab" class="tab-content cards-grid">
                        <!-- Painel de Perfil -->
                        <section class="panel" aria-labelledby="profile-title">
                            <div class="panel-header-simple">
                                <h2 id="profile-title">Perfil</h2>
                                <p class="panel-subtitle">Atualize seu nome, e-mail e foto. Imagens são convertidas
                                    automaticamente para WebP.</p>
                            </div>

                            <form class="stack-form" @submit.prevent="handleSaveProfile">
                                <AuthAvatarPicker :preview-url="avatarPreviewUrl"
                                    hint="Toque na foto para alterar. JPEG, PNG ou WebP."
                                    @selected="setAvatar" />

                                <div class="form-group">
                                    <label for="fullName">Nome completo</label>
                                    <ion-input id="fullName" v-model="profileForm.fullName" class="field"
                                        placeholder="Seu nome completo" required enterkeyhint="next" />
                                </div>

                                <div class="form-group">
                                    <label for="username">Nome de usuário</label>
                                    <ion-input id="username" v-model="profileForm.username" class="field"
                                        placeholder="@usuario" required enterkeyhint="next" />
                                </div>

                                <div class="form-group">
                                    <label for="email">E-mail</label>
                                    <ion-input id="email" v-model="profileForm.email" type="email" inputmode="email"
                                        class="field" placeholder="seuemail@dominio.com" required enterkeyhint="done" />
                                    <span class="field-hint">A alteração do e-mail pode exigir confirmação.</span>
                                </div>

                                <ion-button type="submit" class="primary-button" :disabled="savingProfile">
                                    <span v-if="!savingProfile">Salvar alterações</span>
                                    <ion-spinner v-else name="crescent" />
                                </ion-button>
                            </form>
                        </section>

                        <!-- Painel de Segurança e Exclusão -->
                        <div class="stack-vertical">
                            <section class="panel" aria-labelledby="password-title">
                                <div class="panel-header-simple">
                                    <h2 id="password-title">Segurança</h2>
                                    <p class="panel-subtitle">Mantenha sua conta segura definindo uma senha de no mínimo
                                        6 caracteres.</p>
                                </div>

                                <form class="stack-form" @submit.prevent="handleChangePassword">
                                    <div class="form-group">
                                        <label for="newPassword">Nova senha</label>
                                        <ion-input id="newPassword" v-model="newPassword" type="password" class="field"
                                            placeholder="••••••••" required :minlength="6" />
                                    </div>

                                    <ion-button type="submit" class="primary-button" :disabled="savingPassword">
                                        <span v-if="!savingPassword">Atualizar senha</span>
                                        <ion-spinner v-else name="crescent" />
                                    </ion-button>
                                </form>
                            </section>

                            <!-- Zona de Perigo -->
                            <section class="panel danger-panel" aria-labelledby="danger-title">
                                <div class="panel-header-simple">
                                    <h2 id="danger-title">Excluir conta</h2>
                                    <p class="panel-subtitle">A exclusão da sua conta encerrará o acesso à plataforma de
                                        forma irreversível.</p>
                                </div>
                                <div class="danger-action">
                                    <ion-button color="danger" fill="solid" class="danger-button"
                                        :disabled="pageLoading" @click="handleDeleteAccount">
                                        <ion-icon slot="start" :icon="trashOutline" />
                                        Excluir permanentemente
                                    </ion-button>
                                </div>
                            </section>
                        </div>
                    </div>

                    <!-- Aba 2: Meus Envios -->
                    <div v-else-if="selectedTab === 'uploads'" id="uploads-panel" role="tabpanel"
                        aria-labelledby="uploads-tab" class="tab-content">
                        <section class="panel" aria-labelledby="uploads-title">
                            <div class="panel-header">
                                <div>
                                    <h2 id="uploads-title">Meus envios</h2>
                                    <p class="panel-subtitle">Documentos e obras que você disponibilizou para
                                        preservação no acervo público.</p>
                                </div>
                                <div class="upload-panel-actions">
                                    <ion-button v-if="uploadRequests.some((item) => ['pending', 'processing', 'scanning'].includes(item.status))"
                                        fill="outline" class="status-check-button" :disabled="checkingUploads"
                                        @click="refreshUploadStatuses">
                                        <ion-spinner v-if="checkingUploads" name="crescent" />
                                        <span v-else>Verificar status</span>
                                    </ion-button>
                                    <router-link to="/upload" class="action-link-btn">
                                        <ion-icon :icon="addOutline" />
                                        Enviar novo documento
                                    </router-link>
                                </div>
                            </div>

                            <p v-if="uploadRequests.length" class="panel-subtitle scan-explanation">
                                Os arquivos aguardando verificação permanecem privados. O status é consultado ao
                                selecionar “Verificar status”. Para respeitar os limites do VirusTotal, cada consulta
                                atualiza um envio; resultados concluídos aparecem abaixo.
                            </p>

                            <div v-if="uploadRequests.length" class="list-container upload-request-list">
                                <article v-for="item in uploadRequests" :key="item.id" class="media-card upload-request-card">
                                    <div class="cover-wrapper">
                                        <div class="cover-fallback">
                                            <ion-icon :icon="documentOutline" />
                                        </div>
                                    </div>
                                    <div class="media-info">
                                        <h3>{{ item.title }}</h3>
                                        <p class="meta">{{ item.file_name }}</p>
                                        <span class="scan-status" :class="`scan-status--${item.status}`">
                                            {{ getUploadStatusLabel(item.status) }}
                                        </span>
                                        <p v-if="item.status_message" class="scan-status-message" role="status">
                                            {{ item.status_message }}
                                        </p>
                                    </div>
                                </article>
                            </div>

                            <div v-if="contributions.length === 0 && uploadRequests.length === 0" class="empty-state">
                                <ion-icon :icon="documentTextOutline" class="empty-icon" />
                                <p>Você ainda não contribuiu com documentos para o acervo.</p>
                            </div>

                            <div v-if="contributions.length" class="list-container">
                                <article v-for="item in contributions" :key="item.id" class="media-card">
                                    <div class="cover-wrapper">
                                        <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`"
                                            class="cover-img" />
                                        <div v-else class="cover-fallback">
                                            <ion-icon :icon="documentOutline" />
                                        </div>
                                    </div>
                                    <div class="media-info">
                                        <h3>{{ item.title }}</h3>
                                        <p class="meta">{{ item.author }}</p>
                                        <div class="badge-group">
                                            <span class="nv-badge nv-badge--compact">{{ item.category }}</span>
                                            <span class="nv-badge nv-badge--compact">{{ item.content_type }}</span>
                                            <span v-if="getFileExtension(item.file_name)" class="nv-badge nv-badge--compact">{{
                                                getFileExtension(item.file_name) }}</span>
                                        </div>
                                        <div class="media-actions">
                                            <ion-button fill="clear" size="small" class="media-action-button"
                                                :aria-label="`Visualizar ${item.title}`" :title="`Visualizar ${item.title}`"
                                                :router-link="{ name: 'DocumentDetails', params: { id: item.id } }">
                                                <ion-icon slot="icon-only" :icon="eyeOutline" />
                                            </ion-button>
                                            <ion-button fill="clear" size="small" class="media-action-button"
                                                :aria-label="`Editar ${item.title}`" :title="`Editar ${item.title}`"
                                                :disabled="savingContribution"
                                                @click="openContributionEditor(item)">
                                                <ion-icon slot="icon-only" :icon="pencilOutline" />
                                            </ion-button>
                                            <ion-button fill="clear" color="danger" size="small" class="media-action-button"
                                                :aria-label="`Excluir ${item.title}`" :title="`Excluir ${item.title}`"
                                                :disabled="savingContribution" @click="handleDeleteContribution(item)">
                                                <ion-icon slot="icon-only" :icon="trashOutline" />
                                            </ion-button>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </section>
                    </div>

                    <!-- Aba 3: Progresso de Leitura -->
                    <div v-else-if="selectedTab === 'progress'" id="progress-panel" role="tabpanel"
                        aria-labelledby="progress-tab" class="tab-content">
                        <section class="panel" aria-labelledby="progress-title">
                            <div class="panel-header-simple">
                                <h2 id="progress-title">Progresso de leitura</h2>
                                <p class="panel-subtitle">O progresso é atualizado automaticamente enquanto você lê no
                                    navegador. Você pode remover um registro quando quiser.</p>
                            </div>

                            <div v-if="progressList.length === 0" class="empty-state">
                                <p>Seu progresso será registrado automaticamente quando você ler um documento no navegador.</p>
                            </div>

                            <div v-else class="interactive-list">
                                <article v-for="item in progressList" :key="item.id" class="list-item-card progress-card">
                                    <RouterLink
                                        class="progress-card-link"
                                        :to="{ name: 'DocumentDetails', params: { id: item.document_id }, query: { openReader: 'true' } }"
                                        :aria-label="`Continuar lendo ${item.title}, ${item.percent}% concluído`"
                                    >
                                        <div class="item-title-block">
                                            <strong>{{ item.title }}</strong>
                                            <span>{{ item.author }}</span>
                                        </div>

                                        <div
                                            class="progress-bar"
                                            role="progressbar"
                                            :aria-label="`Progresso de leitura de ${item.title}`"
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                            :aria-valuenow="Math.min(100, Math.max(0, item.percent))"
                                        >
                                            <span :style="{ width: `${Math.min(100, Math.max(0, item.percent))}%` }" />
                                        </div>

                                        <p class="progress-summary">
                                            <span v-if="item.page > 0">Página {{ item.page }} · </span>
                                            <span v-else>Progresso por rolagem · </span>
                                            {{ item.percent }}% ·
                                            {{ item.status === 'lido' ? 'Concluído' : item.status === 'pausado' ? 'Pausado' : 'Em andamento' }}
                                        </p>
                                    </RouterLink>

                                    <div class="button-group">
                                        <ion-button size="small" fill="clear" color="danger"
                                            :disabled="savingProgress" @click="handleDeleteProgress(item.id)">
                                            <ion-icon :icon="trashOutline" slot="icon-only" />
                                        </ion-button>
                                    </div>
                                </article>
                            </div>
                        </section>
                    </div>

                    <!-- Aba 4: Minhas Avaliações -->
                    <div v-else-if="selectedTab === 'reviews'" id="reviews-panel" role="tabpanel"
                        aria-labelledby="reviews-tab" class="tab-content">
                        <section class="panel reviews-panel" aria-labelledby="reviews-title">
                            <div class="panel-header-simple">
                                <h2 id="reviews-title">Minhas avaliações</h2>
                                <p class="panel-subtitle">Classifique obras e compartilhe suas análises com a
                                    comunidade.</p>
                            </div>

                            <form class="grid-form reviews-form" @submit.prevent="handleCreateReview">
                                <div class="form-group span-2">
                                    <label>Documento</label>
                                    <select v-model="reviewDraft.documentId" class="native-select" required>
                                        <option value="" disabled selected>Selecione um documento...</option>
                                        <option v-for="item in catalog" :key="`review-${item.id}`" :value="item.id">
                                            {{ item.title }} — {{ item.author }}
                                        </option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label>Classificação</label>
                                    <select v-model.number="reviewDraft.rating" class="native-select">
                                        <option :value="5">★★★★★ (5/5)</option>
                                        <option :value="4">★★★★☆ (4/5)</option>
                                        <option :value="3">★★★☆☆ (3/5)</option>
                                        <option :value="2">★★☆☆☆ (2/5)</option>
                                        <option :value="1">★☆☆☆☆ (1/5)</option>
                                    </select>
                                </div>

                                <div class="form-group span-2">
                                    <label>Comentário / Crítica</label>
                                    <ion-input v-model="reviewDraft.comment" class="field"
                                        placeholder="Escreva a sua avaliação (opcional)" />
                                </div>

                                <ion-button type="submit" class="primary-button btn-align-end"
                                    :disabled="savingReview || catalog.length === 0">
                                    Publicar
                                </ion-button>
                            </form>

                            <div v-if="reviews.length === 0" class="empty-state">
                                <ion-icon :icon="starOutline" class="empty-icon" />
                                <p>Você ainda não submeteu avaliações para obras do acervo.</p>
                            </div>

                            <div v-else class="interactive-list">
                                <article v-for="item in reviews" :key="item.id" class="list-item-card flex-column">
                                    <div class="item-title-block">
                                        <strong>{{ item.title }}</strong>
                                        <span>{{ item.author }}</span>
                                    </div>

                                    <div class="item-controls width-full">
                                        <div class="input-inline">
                                            <select v-model.number="item.rating" class="native-select compact"
                                                aria-label="Nota do documento">
                                                <option :value="5">★★★★★ (5)</option>
                                                <option :value="4">★★★★☆ (4)</option>
                                                <option :value="3">★★★☆☆ (3)</option>
                                                <option :value="2">★★☆☆☆ (2)</option>
                                                <option :value="1">★☆☆☆☆ (1)</option>
                                            </select>
                                        </div>

                                        <div class="input-inline flex-grow">
                                            <ion-input v-model="item.comment" class="field compact"
                                                placeholder="Comentário..." aria-label="Editar comentário" />
                                        </div>

                                        <div class="button-group">
                                            <ion-button size="small" class="primary-button compact-btn"
                                                :disabled="savingReview" @click="handleUpdateReview(item)">
                                                Salvar
                                            </ion-button>
                                            <ion-button size="small" fill="clear" color="danger"
                                                :disabled="savingReview" @click="handleDeleteReview(item.id)">
                                                <ion-icon :icon="trashOutline" slot="icon-only" />
                                            </ion-button>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </section>
                    </div>
                </template>

                <div class="sign-out-action">
                    <ion-button fill="clear" class="sign-out-button" :disabled="pageLoading" @click="handleSignOut">
                        <ion-icon slot="start" :icon="logOutOutline" />
                        Sair da conta
                    </ion-button>
                </div>
            </main>

            <SiteFooter />
        </IonContent>
        <IonModal :is-open="Boolean(editingContribution)" @didDismiss="closeContributionEditor">
            <section class="contribution-editor" aria-labelledby="edit-contribution-title">
                <header class="editor-header">
                    <h2 id="edit-contribution-title">Editar documento</h2>
                    <ion-button fill="clear" aria-label="Fechar edição" :disabled="savingContribution"
                        @click="closeContributionEditor">
                        <ion-icon :icon="closeOutline" />
                    </ion-button>
                </header>

                <p v-if="editingContribution" class="current-file-note">
                    Arquivo atual: <strong>{{ editingContribution.file_name }}</strong>.
                    Selecione outro apenas se quiser substituí-lo.
                </p>
                <UploadDropzone :file="replacementFile" @select="replacementFile = $event"
                    @clear="replacementFile = null" />

                <div v-if="editingContribution?.cover_url" class="current-cover">
                    <img :src="editingContribution.cover_url" alt="Capa atual do documento" />
                    <ion-button fill="outline" size="small"
                        :disabled="savingContribution || Boolean(contributionDraft.cover)"
                        @click="removeExistingCover = !removeExistingCover">
                        {{ removeExistingCover ? 'Manter capa atual' : 'Remover capa atual' }}
                    </ion-button>
                </div>
                <p v-if="removeExistingCover && !contributionDraft.cover" class="cover-removal-note">
                    A capa será removida ao salvar.
                </p>

                <UploadMetadataForm v-model="contributionDraft" id-prefix="edit-contribution"
                    :is-valid="isContributionFormValid" :is-uploading="savingContribution"
                    submit-label="SALVAR ALTERAÇÕES" @submit="handleUpdateContribution" />
            </section>
        </IonModal>
    </IonPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonModal,
    IonPage,
    IonSpinner
} from '@ionic/vue';
import {
    addOutline,
    bookOutline,
    closeOutline,
    documentOutline,
    documentTextOutline,
    eyeOutline,
    logOutOutline,
    pencilOutline,
    personOutline,
    starOutline,
    trashOutline
} from 'ionicons/icons';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import AuthAvatarPicker from '@/components/AuthAvatarPicker.vue';
import UploadDropzone from '@/components/UploadDropzone.vue';
import UploadMetadataForm from '@/components/UploadMetadataForm.vue';
import { useUserArea } from '@/composables/useUserArea';
import { getFileExtension } from '@/utils/getFileExtension';
import { parsePublicationYear } from '@/utils/publicationYear';
import type { UploadScanStatus } from '@/types/userArea';

const route = useRoute();
const selectedTab = ref(route.query.tab === 'uploads' ? 'uploads' : 'profile');

const {
    pageLoading,
    savingProfile,
    savingPassword,
    savingProgress,
    savingReview,
    savingContribution,
    checkingUploads,
    profileForm,
    newPassword,
    avatarPreviewUrl,
    contributions,
    uploadRequests,
    editingContribution,
    contributionDraft,
    replacementFile,
    removeExistingCover,
    catalog,
    progressList,
    reviews,
    reviewDraft,
    setAvatar,
    handleSaveProfile,
    handleChangePassword,
    handleDeleteProgress,
    handleCreateReview,
    handleUpdateReview,
    handleDeleteReview,
    openContributionEditor,
    closeContributionEditor,
    handleUpdateContribution,
    refreshUploadStatuses,
    handleDeleteContribution,
    handleSignOut,
    handleDeleteAccount
} = useUserArea();

const isContributionFormValid = computed(() =>
    Boolean(contributionDraft.title.trim() && contributionDraft.author.trim()
        && contributionDraft.category && contributionDraft.type
        && parsePublicationYear(contributionDraft.year) !== null)
);

const getUploadStatusLabel = (status: UploadScanStatus) => {
    switch (status) {
        case 'pending': return 'Aguardando início';
        case 'processing': return 'Preparando análise';
        case 'scanning': return 'Em verificação';
        case 'approved': return 'Aprovado';
        case 'rejected': return 'Rejeitado';
        case 'failed': return 'Falha na verificação';
    }
};
</script>

<style scoped>
.user-area-content {
    --background: var(--color-page-background);
}

.user-area {
    --content-width: 1200px;
    display: flex;
    flex-direction: column;
    gap: var(--section-gap);
}

/* Base Cards & Panels */
.identity-card,
.panel {
    border: 1px solid var(--color-border-soft, #E2DAD3);
    border-radius: var(--radius-lg, 16px);
    background: var(--color-surface, #FBF8F5);
    box-shadow: var(--shadow-soft, 0 4px 12px rgba(34, 34, 59, 0.08));
}

.identity-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding: var(--surface-padding);
}

.identity-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.identity-info h1 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: clamp(1.4rem, 2.1vw, 2.2rem);
    font-weight: 800;
    line-height: 1.2;
}

.identity-info p {
    max-width: 65ch;
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.55;
    font-size: 0.95rem;
}

.panel h2 {
    margin: 0;
    color: var(--color-text-primary, #22223B);
    font-size: clamp(1.2rem, 2vw, 1.75rem);
    font-weight: 800;
    line-height: 1.2;
}

.panel-subtitle {
    margin: 0;
    color: var(--color-text-secondary, #4A4E69);
    line-height: 1.55;
    font-size: 0.95rem;
}

.field-hint {
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.sign-out-action {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--space-sm);
    padding-bottom: calc(var(--space-xl) + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--color-border-soft);
}

.sign-out-button {
    --color: var(--color-text-secondary);
    margin: 0;
    text-transform: none;
}

/* User area tabs */
.tab-navigation {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
    width: 100%;
    padding: 4px;
    background: rgba(226, 218, 211, 0.4);
    border-radius: var(--radius-lg);
}

.tab-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 0;
    min-height: 48px;
    padding: 8px 12px;
    border: 0;
    border-radius: var(--radius-control);
    background: transparent;
    color: var(--color-text-secondary, #4A4E69);
    cursor: pointer;
    font-weight: 700;
    font-size: 0.88rem;
    line-height: 1.25;
    text-align: center;
    transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.tab-button ion-icon {
    flex: 0 0 auto;
    font-size: 1.1rem;
}

.tab-button.is-active {
    background: var(--color-white, #FFFFFF);
    color: var(--color-text-primary, #22223B);
    box-shadow: 0 1px 3px rgba(34, 34, 59, 0.12);
}

.tab-button:focus-visible {
    outline: 2px solid var(--color-brand-primary, #3B52F6);
    outline-offset: 2px;
}

/* Panels Layout */
.tab-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl, 32px);
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    gap: 24px;
}

.stack-vertical {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.panel {
    padding: var(--surface-padding);
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.panel-header,
.panel-header-simple {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
}

.panel-header {
    padding-bottom: 14px;
    border-bottom: 1px solid var(--color-border-soft, #E2DAD3);
}

.upload-panel-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
}

.status-check-button {
    --border-color: var(--color-brand-primary, #53538F);
    --color: var(--color-brand-primary, #53538F);
    --border-radius: var(--radius-md, 12px);
    margin: 0;
    font-weight: 600;
    text-transform: none;
}

.scan-explanation {
    margin: 0;
}

.upload-request-list {
    margin-bottom: 16px;
}

.upload-request-card {
    align-items: flex-start;
}

.scan-status {
    display: inline-block;
    padding: 3px 9px;
    border-radius: 999px;
    background: var(--color-surface-alt, #EEE5DE);
    color: var(--color-text-primary, #22223B);
    font-size: 0.78rem;
    font-weight: 700;
}

.scan-status--scanning,
.scan-status--processing,
.scan-status--pending {
    background: #fff4d6;
    color: #795600;
}

.scan-status--rejected,
.scan-status--failed {
    background: #fde8e7;
    color: #9f2420;
}

.scan-status-message {
    margin: 6px 0 0;
    color: var(--color-text-secondary, #4A4E69);
    font-size: 0.82rem;
}

.stack-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.grid-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
    gap: 16px;
    align-items: end;
    min-width: 0;
    box-sizing: border-box;
    padding: 20px;
    border: 1px solid var(--color-border-soft, #E2DAD3);
    border-radius: var(--radius-md, 12px);
    background: rgba(255, 255, 255, 0.5);
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

.form-group label {
    color: var(--color-text-primary, #22223B);
    font-size: 0.82rem;
    font-weight: 700;
}

.span-2 {
    grid-column: span 2;
}

.btn-align-end {
    align-self: end;
}

.reviews-form > * {
    min-width: 0;
}

.reviews-form .btn-align-end {
    width: 100%;
    max-width: 100%;
    align-self: stretch;
}

/* Inputs & Form Controls */
.field {
    --background: var(--color-white, #FFFFFF);
    --border-color: var(--color-border-soft, #E2DAD3);
    --border-radius: var(--radius-md, 12px);
    --border-style: solid;
    --border-width: 1px;
    --padding-start: 14px;
    --padding-end: 14px;
    --color: var(--color-text-primary, #22223B);
    min-height: var(--control-height);
    width: 100%;
    min-width: 0;
    font-size: 0.95rem;
}

.native-select {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    height: var(--control-height);
    border: 1px solid var(--color-border-soft, #E2DAD3);
    border-radius: var(--radius-md, 12px);
    background: var(--color-white, #FFFFFF);
    color: var(--color-text-primary, #22223B);
    padding: 0 12px;
    outline: none;
    font-size: 0.9rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.native-select:focus,
.field:focus-within {
    border-color: var(--color-brand-primary);
    box-shadow: 0 0 0 3px rgba(83, 83, 143, 0.12);
}

.native-select.compact,
.field.compact {
    min-height: 38px;
    height: 38px;
    font-size: 0.85rem;
}

/* Buttons & Links */
.primary-button {
    --background: var(--color-primary-dark, #2D2D2D);
    --color: var(--color-white, #FFFFFF);
    --border-radius: var(--radius-md, 12px);
    height: 46px;
    margin: 0;
    text-transform: none;
    font-weight: 700;
}

.compact-btn {
    height: 38px;
    min-width: 80px;
}

.ghost-button {
    --border-color: var(--color-border-soft, #E2DAD3);
    --color: var(--color-text-primary, #22223B);
    --background: var(--color-white, #FFFFFF);
    --border-radius: var(--radius-md, 12px);
    text-transform: none;
    font-weight: 600;
    height: 42px;
}

.action-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--color-primary-dark, #2D2D2D);
    color: var(--color-white, #FFFFFF);
    padding: 10px 18px;
    border-radius: var(--radius-md, 12px);
    font-weight: 700;
    font-size: 0.88rem;
    text-decoration: none;
    transition: opacity 0.2s ease;
}

.action-link-btn:hover {
    opacity: 0.92;
}

/* Cards & Media Lists */
.list-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

.media-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px;
    border: 1px solid var(--color-border-soft, #E2DAD3);
    border-radius: var(--radius-md, 12px);
    background: var(--color-white, #FFFFFF);
}

.cover-wrapper {
    width: 64px;
    height: 84px;
    flex-shrink: 0;
    border-radius: var(--radius-sm, 8px);
    overflow: hidden;
    background: var(--color-surface-alt, #EEE5DE);
}

.cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.cover-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    color: var(--color-text-muted, #6E6C7C);
}

.media-info h3 {
    margin: 0 0 4px 0;
    font-size: 0.95rem;
    color: var(--color-text-primary, #22223B);
}

.media-info {
    flex: 1;
    min-width: 0;
}

.media-info .meta {
    margin: 0 0 6px 0;
    font-size: 0.8rem;
    color: var(--color-text-secondary, #4A4E69);
}

.media-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 10px;
}

.media-actions :deep(.media-action-button) {
    width: 40px;
    height: 40px;
    margin: 0;
    --color: var(--color-brand-primary, #53538F);
    --border-radius: var(--radius-control, 8px);
}

.media-actions :deep(.media-action-button[color="danger"]) {
    --color: var(--color-danger, #B42318);
}

.media-actions :deep(.media-action-button):hover {
    --background: var(--color-surface-alt, #EEE5DE);
}

.contribution-editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    overflow-y: auto;
    padding: clamp(16px, 4vw, 32px);
    background: var(--color-page-background);
}

.editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.editor-header h2 {
    margin: 0;
    color: var(--color-text-primary);
}

.current-file-note,
.cover-removal-note {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.5;
}

.current-cover {
    display: flex;
    align-items: center;
    gap: 12px;
}

.current-cover img {
    width: 56px;
    height: 72px;
    border-radius: var(--radius-sm);
    object-fit: cover;
}

.badge-group {
    display: flex;
    gap: 6px;
}

/* Interactive List */
.interactive-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.list-item-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border: 1px solid var(--color-border-soft, #E2DAD3);
    border-radius: var(--radius-md, 12px);
    background: var(--color-white, #FFFFFF);
}

.list-item-card.flex-column {
    flex-direction: column;
    align-items: flex-start;
}

.item-title-block strong {
    color: var(--color-text-primary, #22223B);
    font-size: 0.95rem;
}

.item-title-block span {
    display: block;
    color: var(--color-text-secondary, #4A4E69);
    font-size: 0.82rem;
}

.item-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.progress-summary {
    margin: 0;
    color: var(--color-text-secondary, #4A4E69);
    font-size: 0.82rem;
}

.progress-card-link {
    display: grid;
    flex: 1;
    min-width: 0;
    gap: var(--space-sm);
    color: inherit;
    text-decoration: none;
}

.progress-card-link .item-title-block {
    min-width: 0;
}

.progress-card-link:hover .item-title-block strong {
    color: var(--color-brand-primary);
}

.progress-card-link:focus-visible {
    border-radius: var(--radius-sm);
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 3px;
}

.progress-bar {
    width: 100%;
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--color-surface-alt, #EEE5DE);
}

.progress-bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--color-brand-primary);
    transition: width 0.25s ease;
}

.width-full {
    width: 100%;
}

.input-inline {
    display: flex;
    align-items: center;
    gap: 6px;
}

.input-inline label {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--color-text-muted, #6E6C7C);
}

.flex-grow {
    flex: 1;
}

.button-group {
    display: flex;
    align-items: center;
    gap: 4px;
}

/* Empty States & PageLoading */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 36px 16px;
    text-align: center;
    color: var(--color-text-secondary, #4A4E69);
}

.empty-icon {
    font-size: 2.2rem;
    margin-bottom: 8px;
    color: var(--color-text-muted, #6E6C7C);
}

.loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px 16px;
    color: var(--color-text-secondary, #4A4E69);
    font-weight: 600;
}

/* Danger Zone */
.danger-panel {
    border-color: rgba(224, 49, 49, 0.25);
    background: rgba(254, 242, 242, 0.6);
}

.danger-button {
    --border-radius: var(--radius-md, 12px);
    font-weight: 700;
    text-transform: none;
    margin: 0;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
    .user-area {
        --page-gutter: 16px;
    }

    .cards-grid {
        grid-template-columns: 1fr;
    }

    .tab-navigation {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .identity-card {
        flex-direction: column;
        align-items: flex-start;
    }

    .panel-header-simple {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-xs);
    }

    .panel-subtitle {
        max-width: 100%;
    }

    .sign-out-action {
        justify-content: center;
    }

    .span-2 {
        grid-column: span 1;
    }

    .panel-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .upload-panel-actions {
        width: 100%;
        justify-content: flex-start;
    }

    .list-item-card {
        flex-direction: column;
        align-items: flex-start;
    }

    .item-controls {
        width: 100%;
        justify-content: space-between;
    }

    .progress-card-link {
        width: 100%;
    }

    .progress-card {
        flex-direction: row;
        align-items: center;
    }

    .grid-form {
        grid-template-columns: minmax(0, 1fr);
    }

    .reviews-panel,
    .reviews-form {
        min-width: 0;
        max-width: 100%;
    }
}

@media (max-width: 420px) {
    .tab-button {
        flex-direction: column;
        gap: 4px;
        padding: 8px 4px;
        font-size: 0.76rem;
    }
}
</style>