<template>
    <ion-page>
        <ion-content :fullscreen="true" :scroll-y="true" class="user-area-content">
            <Header />

            <main class="user-area">
                <!-- Hero Section / Identity Card -->
                <section class="identity-card">
                    <div class="identity-info">
                        <span class="eyebrow">ÁREA DO USUÁRIO</span>
                        <h1>{{ profileForm.fullName || profileForm.username || 'Minha Conta' }}</h1>
                        <p>Gerencie o seu perfil, acompanhe o seu progresso de leitura, avaliações e contribuições para
                            o acervo.</p>
                    </div>
                    <div class="identity-actions">
                        <ion-button fill="outline" class="ghost-button" :disabled="pageLoading" @click="handleSignOut">
                            Sair
                        </ion-button>
                    </div>
                </section>

                <!-- Loading State -->
                <div v-if="pageLoading" class="loading-state">
                    <ion-spinner name="crescent" color="primary" />
                    <span>Carregando as suas informações...</span>
                </div>

                <template v-else>
                    <!-- Grid Principal: Perfil e Segurança -->
                    <div class="cards-grid">
                        <!-- Painel de Perfil -->
                        <section class="panel" aria-labelledby="profile-title">
                            <div class="panel-header-simple">
                                <h2 id="profile-title">Perfil</h2>
                                <p class="panel-subtitle">Atualize o seu nome, e-mail e foto. As imagens são convertidas
                                    para WebP automaticamente.</p>
                            </div>

                            <form class="stack-form" @submit.prevent="handleSaveProfile">
                                <AuthAvatarPicker :preview-url="avatarPreviewUrl"
                                    hint="Formats suportados: JPEG, PNG ou WebP" @selected="setAvatar" />

                                <div class="form-group">
                                    <label for="fullName">Nome completo</label>
                                    <ion-input id="fullName" v-model="profileForm.fullName" class="field"
                                        placeholder="Seu nome completo" required />
                                </div>

                                <div class="form-group">
                                    <label for="username">Nome de usuário</label>
                                    <ion-input id="username" v-model="profileForm.username" class="field"
                                        placeholder="@usuario" required />
                                </div>

                                <div class="form-group">
                                    <label for="email">E-mail</label>
                                    <ion-input id="email" v-model="profileForm.email" type="email" class="field"
                                        placeholder="seuemail@dominio.com" required />
                                </div>

                                <ion-button type="submit" class="primary-button" :disabled="savingProfile">
                                    <span v-if="!savingProfile">Salvar alterações</span>
                                    <ion-spinner v-else name="crescent" />
                                </ion-button>
                            </form>
                        </section>

                        <!-- Painel de Segurança -->
                        <section class="panel" aria-labelledby="password-title">
                            <div class="panel-header-simple">
                                <h2 id="password-title">Segurança</h2>
                                <p class="panel-subtitle">Mantenha a sua conta segura definindo uma senha forte de pelo
                                    menos 6 caracteres.</p>
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
                    </div>

                    <!-- Meus Envios / Contribuições -->
                    <section class="panel" aria-labelledby="uploads-title">
                        <div class="panel-header">
                            <div>
                                <h2 id="uploads-title">Meus envios</h2>
                                <p class="panel-subtitle">Documentos e obras que você disponibilizou para a preservação
                                    no acervo público.</p>
                            </div>
                            <router-link to="/upload" class="action-link">Enviar novo documento</router-link>
                        </div>

                        <p v-if="contributions.length === 0" class="empty-copy">Você ainda não contribuiu com documentos
                            para o acervo.</p>

                        <div v-else class="list-container">
                            <article v-for="item in contributions" :key="item.id" class="media-card">
                                <div class="cover-wrapper">
                                    <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`"
                                        class="cover-img" />
                                    <div v-else class="cover-fallback">
                                        <span>PDF</span>
                                    </div>
                                </div>
                                <div class="media-info">
                                    <h3>{{ item.title }}</h3>
                                    <p class="meta">{{ item.author }} • <span class="badge">{{ item.category }}</span> •
                                        {{ item.content_type }}</p>
                                </div>
                            </article>
                        </div>
                    </section>

                    <!-- Progresso de Leitura -->
                    <section class="panel" aria-labelledby="progress-title">
                        <div class="panel-header-simple">
                            <h2 id="progress-title">Progresso de leitura</h2>
                            <p class="panel-subtitle">Acompanhe a sua evolução, registre a página atual e o status de
                                leitura de cada obra.</p>
                        </div>

                        <form class="grid-form" @submit.prevent="handleCreateProgress">
                            <div class="form-group span-2">
                                <label>Documento / Obra</label>
                                <select v-model="progressDraft.documentId" class="native-select" required>
                                    <option value="" disabled selected>Selecione um documento do acervo...</option>
                                    <option v-for="item in catalog" :key="item.id" :value="item.id">
                                        {{ item.title }} — {{ item.author }}
                                    </option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Página atual</label>
                                <ion-input v-model.number="progressDraft.page" type="number" min="0" class="field"
                                    placeholder="0" required />
                            </div>

                            <div class="form-group">
                                <label>Percentual (%)</label>
                                <ion-input v-model.number="progressDraft.percent" type="number" min="0" max="100"
                                    class="field" placeholder="0" required />
                            </div>

                            <div class="form-group">
                                <label>Status</label>
                                <select v-model="progressDraft.status" class="native-select">
                                    <option value="lendo">Lendo</option>
                                    <option value="lido">Lido</option>
                                    <option value="pausado">Pausado</option>
                                </select>
                            </div>

                            <ion-button type="submit" class="primary-button btn-align-end"
                                :disabled="savingProgress || catalog.length === 0">
                                Adicionar
                            </ion-button>
                        </form>

                        <p v-if="catalog.length === 0" class="empty-copy">Não há documentos disponíveis no acervo para
                            registrar progresso.</p>
                        <p v-else-if="progressList.length === 0" class="empty-copy">Nenhum progresso de leitura
                            registrado até o momento.</p>

                        <div v-else class="interactive-list">
                            <article v-for="item in progressList" :key="item.id" class="list-item-card">
                                <div class="item-title-block">
                                    <strong>{{ item.title }}</strong>
                                    <span>{{ item.author }}</span>
                                </div>

                                <div class="item-controls">
                                    <div class="input-inline">
                                        <label>Pág.</label>
                                        <ion-input v-model.number="item.page" type="number" min="0"
                                            class="field compact" aria-label="Página atual" />
                                    </div>

                                    <div class="input-inline">
                                        <label>%</label>
                                        <ion-input v-model.number="item.percent" type="number" min="0" max="100"
                                            class="field compact" aria-label="Percentual concluído" />
                                    </div>

                                    <div class="input-inline">
                                        <select v-model="item.status" class="native-select compact"
                                            aria-label="Status de leitura">
                                            <option value="lendo">Lendo</option>
                                            <option value="lido">Lido</option>
                                            <option value="pausado">Pausado</option>
                                        </select>
                                    </div>

                                    <div class="button-group">
                                        <ion-button size="small" class="primary-button" :disabled="savingProgress"
                                            @click="handleUpdateProgress(item)">
                                            Salvar
                                        </ion-button>
                                        <ion-button size="small" fill="clear" color="danger" :disabled="savingProgress"
                                            @click="handleDeleteProgress(item.id)">
                                            Excluir
                                        </ion-button>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </section>

                    <!-- Minhas Avaliações -->
                    <section class="panel" aria-labelledby="reviews-title">
                        <div class="panel-header-simple">
                            <h2 id="reviews-title">Minhas avaliações</h2>
                            <p class="panel-subtitle">Classifique de 1 a 5 estrelas e adicione observações ou análises
                                sobre o acervo público.</p>
                        </div>

                        <form class="grid-form" @submit.prevent="handleCreateReview">
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
                                    <option :value="1">★☆☆☆☆ (1/5)</option>
                                    <option :value="2">★★☆☆☆ (2/5)</option>
                                    <option :value="3">★★★☆☆ (3/5)</option>
                                    <option :value="4">★★★★☆ (4/5)</option>
                                    <option :value="5">★★★★★ (5/5)</option>
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

                        <p v-if="reviews.length === 0" class="empty-copy">Você ainda não submeteu avaliações para obras
                            do acervo.</p>

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
                                            <option :value="1">★☆☆☆☆ (1)</option>
                                            <option :value="2">★★☆☆☆ (2)</option>
                                            <option :value="3">★★★☆☆ (3)</option>
                                            <option :value="4">★★★★☆ (4)</option>
                                            <option :value="5">★★★★★ (5)</option>
                                        </select>
                                    </div>

                                    <div class="input-inline flex-grow">
                                        <ion-input v-model="item.comment" class="field compact"
                                            placeholder="Comentário..." aria-label="Editar comentário" />
                                    </div>

                                    <div class="button-group">
                                        <ion-button size="small" class="primary-button" :disabled="savingReview"
                                            @click="handleUpdateReview(item)">
                                            Salvar
                                        </ion-button>
                                        <ion-button size="small" fill="clear" color="danger" :disabled="savingReview"
                                            @click="handleDeleteReview(item.id)">
                                            Excluir
                                        </ion-button>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </section>

                    <!-- Zona de Perigo -->
                    <section class="panel danger-panel" aria-labelledby="danger-title">
                        <div class="panel-header-simple">
                            <h2 id="danger-title">Excluir conta</h2>
                            <p class="panel-subtitle">A exclusão da sua conta encerrará o acesso à plataforma. Esta ação
                                é irreversível.</p>
                        </div>
                        <div class="danger-action">
                            <ion-button color="danger" fill="solid" class="danger-button" :disabled="pageLoading"
                                @click="handleDeleteAccount">
                                Excluir permanentemente a minha conta
                            </ion-button>
                        </div>
                    </section>
                </template>
            </main>

            <Footer />
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonContent, IonInput, IonPage, IonSpinner } from '@ionic/vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import AuthAvatarPicker from '@/components/AuthAvatarPicker.vue';
import { useUserArea } from '@/composables/useUserArea';

const {
    pageLoading,
    savingProfile,
    savingPassword,
    savingProgress,
    savingReview,
    profileForm,
    newPassword,
    avatarPreviewUrl,
    contributions,
    catalog,
    progressList,
    reviews,
    progressDraft,
    reviewDraft,
    setAvatar,
    handleSaveProfile,
    handleChangePassword,
    handleCreateProgress,
    handleUpdateProgress,
    handleDeleteProgress,
    handleCreateReview,
    handleUpdateReview,
    handleDeleteReview,
    handleSignOut,
    handleDeleteAccount
} = useUserArea();
</script>

<style scoped>
/* Variáveis da página */
.user-area-content {
    --background: var(--color-page-background, #F3ECE6);
}

.user-area {
    width: min(100% - 32px, 1120px);
    margin: 0 auto;
    padding: var(--space-2xl, 32px) 0 var(--space-3xl, 48px);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 24px);
}

/* Cartões e Painéis */
.identity-card,
.panel {
    padding: clamp(20px, 3vw, 32px);
    border: 1px solid var(--color-border-soft, #E2DAD3);
    border-radius: var(--radius-lg, 16px);
    background: var(--color-white, #FFFFFF);
    box-shadow: var(--shadow-soft, 0 4px 12px rgba(34, 34, 59, 0.05));
    transition: box-shadow 0.2s ease-in-out;
}

.identity-card {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--space-lg, 24px);
    background: linear-gradient(135deg, var(--color-white, #FFFFFF) 0%, var(--color-surface, #FBF8F5) 100%);
}

.eyebrow {
    color: var(--color-brand-primary, #3B52F6);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    display: block;
    margin-bottom: 4px;
}

.identity-info h1,
.panel h2 {
    margin: 0 0 8px 0;
    color: var(--color-text-primary, #22223B);
    font-size: clamp(1.4rem, 2.5vw, 1.8rem);
    font-weight: 800;
}

.identity-info p,
.panel-subtitle,
.empty-copy {
    margin: 0;
    color: var(--color-text-secondary, #4A4E69);
    line-height: 1.5;
    font-size: 0.95rem;
}

.loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px;
    color: var(--color-text-secondary, #4A4E69);
    font-weight: 600;
}

/* Grids */
.cards-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: var(--space-lg, 24px);
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
}

.panel-header-simple {
    margin-bottom: 20px;
}

/* Formulaários */
.stack-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.grid-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    align-items: flex-end;
    margin-bottom: 24px;
    background: var(--color-surface, #FBF8F5);
    padding: 20px;
    border-radius: var(--radius-md, 12px);
    border: 1px solid var(--color-border-soft, #E2DAD3);
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    color: var(--color-text-primary, #22223B);
    font-size: 0.825rem;
    font-weight: 700;
}

.span-2 {
    grid-column: span 2;
}

.btn-align-end {
    margin-bottom: 2px;
}

/* Campos de entrada e selects */
.field {
    --background: var(--color-white, #FFFFFF);
    --border-color: var(--color-border-soft, #E2DAD3);
    --border-radius: 10px;
    --border-style: solid;
    --border-width: 1px;
    --padding-start: 14px;
    --padding-end: 14px;
    --color: var(--color-text-primary, #22223B);
    min-height: 44px;
    font-size: 0.95rem;
}

.native-select {
    height: 44px;
    border: 1px solid var(--color-border-soft, #E2DAD3);
    border-radius: 10px;
    background: var(--color-white, #FFFFFF);
    color: var(--color-text-primary, #22223B);
    padding: 0 12px;
    outline: none;
    font-size: 0.9rem;
    transition: border-color 0.2s;
}

.native-select:focus {
    border-color: var(--color-brand-primary, #3B52F6);
}

.native-select.compact,
.field.compact {
    min-height: 38px;
    height: 38px;
    font-size: 0.875rem;
}

/* Botões e Links */
.primary-button {
    --background: var(--color-primary-dark, #2D2D2D);
    --color: #ffffff;
    --border-radius: 10px;
    height: 44px;
    margin: 0;
    text-transform: none;
    font-weight: 700;
}

.ghost-button {
    --border-color: var(--color-border-soft, #E2DAD3);
    --color: var(--color-text-primary, #22223B);
    --border-radius: 10px;
    text-transform: none;
    font-weight: 600;
}

.action-link {
    color: var(--color-brand-primary, #3B52F6);
    font-weight: 700;
    font-size: 0.9rem;
    text-decoration: none;
    white-space: nowrap;
}

.action-link:hover {
    text-decoration: underline;
}

/* Lista de Envios */
.list-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 12px;
}

.media-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px;
    border: 1px solid var(--color-border-soft, #E2DAD3);
    border-radius: var(--radius-md, 12px);
    background: var(--color-surface, #FBF8F5);
}

.cover-wrapper {
    width: 48px;
    height: 64px;
    flex-shrink: 0;
    border-radius: 6px;
    overflow: hidden;
    background: var(--color-border-soft, #E2DAD3);
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
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-secondary, #4A4E69);
}

.media-info h3 {
    margin: 0 0 4px 0;
    font-size: 0.95rem;
    color: var(--color-text-primary, #22223B);
}

.media-info .meta {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-text-secondary, #4A4E69);
}

.badge {
    background: var(--color-border-soft, #E2DAD3);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
}

/* Listas Interativas (Progresso e Avaliações) */
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
    background: var(--color-surface, #FBF8F5);
}

.list-item-card.flex-column {
    flex-direction: column;
    align-items: flex-start;
}

.item-title-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.item-title-block strong {
    color: var(--color-text-primary, #22223B);
    font-size: 0.95rem;
}

.item-title-block span {
    color: var(--color-text-secondary, #4A4E69);
    font-size: 0.825rem;
}

.item-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
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
    font-size: 0.8rem;
    font-weight: 600;
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

/* Zona de Perigo */
.danger-panel {
    border-color: rgba(180, 35, 24, 0.3);
    background: #FFFBFB;
}

.danger-action {
    margin-top: 16px;
}

.danger-button {
    --border-radius: 10px;
    font-weight: 700;
    text-transform: none;
    margin: 0;
}

/* Responsividade e Layout Adaptativo */
@media (max-width: 900px) {
    .cards-grid {
        grid-template-columns: 1fr;
    }

    .identity-card {
        flex-direction: column;
        align-items: flex-start;
    }

    .identity-actions {
        width: 100%;
    }

    .identity-actions ion-button {
        width: 100%;
    }

    .span-2 {
        grid-column: span 1;
    }

    .list-item-card {
        flex-direction: column;
        align-items: flex-start;
    }

    .item-controls {
        width: 100%;
        justify-content: space-between;
    }

    .grid-form {
        grid-template-columns: 1fr;
    }
}
</style> 