<template>
    <IonPage>
        <IonContent :fullscreen="true" :scroll-y="true" class="user-area-content">
            <SiteHeader />

            <main class="user-area nv-page-shell">
                <!-- Hero / SiteHeader da Área do Usuário -->
                <section class="identity-card">
                    <div class="identity-info">
                        <h1>Olá, {{ profileForm.fullName || profileForm.username || 'Minha Conta' }}</h1>
                    </div>
                    <ion-button fill="clear" class="sign-out-button" :disabled="pageLoading" @click="handleSignOut">
                        <ion-icon slot="start" :icon="logOutOutline" />
                        Sair da conta
                    </ion-button>
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
                            <span>Perfil</span>
                        </button>
                        <button id="security-tab" type="button" role="tab" class="tab-button"
                            :class="{ 'is-active': selectedTab === 'security' }"
                            :aria-selected="selectedTab === 'security'" aria-controls="security-panel"
                            @click="selectedTab = 'security'">
                            <ion-icon :icon="shieldCheckmarkOutline" />
                            <span>Segurança</span>
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
                        <button id="collections-tab" type="button" role="tab" class="tab-button"
                            :class="{ 'is-active': selectedTab === 'collections' }"
                            :aria-selected="selectedTab === 'collections'" aria-controls="collections-panel"
                            @click="selectedTab = 'collections'">
                            <ion-icon :icon="albumsOutline" />
                            <span>Coleções</span>
                        </button>
                        <button id="reviews-tab" type="button" role="tab" class="tab-button"
                            :class="{ 'is-active': selectedTab === 'reviews' }"
                            :aria-selected="selectedTab === 'reviews'" aria-controls="reviews-panel"
                            @click="selectedTab = 'reviews'">
                            <ion-icon :icon="starOutline" />
                            <span>Avaliações</span>
                        </button>
                    </div>

                    <!-- Perfil -->
                    <div v-if="selectedTab === 'profile'" id="profile-panel" role="tabpanel"
                        aria-labelledby="profile-tab" class="tab-content">
                        <!-- Painel de Perfil -->
                        <section class="panel profile-panel" aria-labelledby="profile-title">
                            <div class="panel-header-simple">
                                <h2 id="profile-title">Perfil</h2>
                                <p class="panel-subtitle">Gerencie seus dados pessoais e sua foto de perfil.</p>
                                <span v-if="pendingEmail" class="field-hint" role="status">
                                    Aguardando confirmação do novo e-mail: {{ pendingEmail }}
                                </span>
                            </div>

                            <div v-if="!isEditingProfile" class="stack-form profile-view-card">
                                <button type="button" class="profile-avatar-preview"
                                    :aria-label="`Editar perfil de ${profileForm.fullName || 'usuário'}`"
                                    @click="isEditingProfile = true">
                                    <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" alt="" />
                                    <ion-icon v-else :icon="personOutline" aria-hidden="true" />
                                    <span class="profile-avatar-action" aria-hidden="true">
                                        <ion-icon :icon="cameraOutline" />
                                    </span>
                                </button>
                                <dl class="profile-details">
                                    <div class="profile-detail">
                                        <dt>Nome completo</dt>
                                        <dd>{{ profileForm.fullName || 'Não informado' }}</dd>
                                    </div>
                                    <div class="profile-detail">
                                        <dt>Nome de usuário</dt>
                                        <dd>{{ getDisplayUsername(profileForm.username) }}</dd>
                                    </div>
                                    <div class="profile-detail">
                                        <dt>E-mail</dt>
                                        <dd>{{ profileForm.email || 'Não informado' }}</dd>
                                    </div>
                                </dl>
                                <div class="profile-actions profile-view-actions">
                                    <ion-button type="button" class="primary-button"
                                        @click="isEditingProfile = true">Editar perfil</ion-button>
                                </div>
                            </div>

                            <form v-else class="stack-form" @submit.prevent="handleSaveProfile">
                                <AuthAvatarPicker :preview-url="avatarPreviewUrl"
                                    hint="Toque na foto para alterar." @selected="setAvatar" />
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
                                        class="field" placeholder="seuemail@dominio.com" required enterkeyhint="done"
                                        :disabled="Boolean(pendingEmail)" />
                                    <span class="field-hint">Alterar o e-mail exige sua senha atual e confirmação do novo endereço.</span>
                                </div>
                                <div v-if="emailNeedsReauthentication" class="form-group">
                                    <label for="currentPassword">Senha atual</label>
                                    <ion-input id="currentPassword" v-model="currentPassword" type="password"
                                        class="field" autocomplete="current-password" required
                                        placeholder="Confirme sua senha atual" />
                                </div>
                                <div class="profile-actions">
                                    <ion-button type="button" class="ghost-button" :disabled="savingProfile"
                                        @click="cancelProfileEdit">Cancelar</ion-button>
                                    <ion-button type="submit" class="primary-button" :disabled="savingProfile">
                                        <span v-if="!savingProfile">Salvar alterações</span>
                                        <ion-spinner v-else name="crescent" />
                                    </ion-button>
                                </div>
                            </form>
                        </section>
                    </div>

                    <!-- Segurança -->
                    <div v-else-if="selectedTab === 'security'" id="security-panel" role="tabpanel"
                        aria-labelledby="security-tab" class="tab-content cards-grid">
                        <div class="stack-vertical">
                            <section class="panel" aria-labelledby="password-title">
                                <div class="panel-header-simple">
                                    <h2 id="password-title">Segurança</h2>
                                    <p class="panel-subtitle">Mantenha sua conta segura definindo uma senha de no mínimo
                                        6 caracteres.</p>
                                </div>

                                <div v-if="!isChangingPassword" class="profile-actions">
                                    <ion-button type="button" class="primary-button"
                                        @click="isChangingPassword = true">Alterar senha</ion-button>
                                </div>
                                <form v-else class="stack-form" @submit.prevent="handleChangePassword">
                                    <div class="form-group">
                                        <label for="passwordCurrent">Senha atual</label>
                                        <ion-input id="passwordCurrent" v-model="currentPassword" type="password"
                                            class="field" autocomplete="current-password"
                                            placeholder="Digite sua senha atual" required />
                                    </div>
                                    <div class="form-group">
                                        <label for="newPassword">Nova senha</label>
                                        <ion-input id="newPassword" v-model="newPassword" type="password" class="field"
                                            placeholder="••••••••" autocomplete="new-password" required :minlength="6" />
                                        <span class="field-hint">{{ passwordStrengthLabel }}</span>
                                    </div>
                                    <div class="form-group">
                                        <label for="confirmPassword">Confirme a nova senha</label>
                                        <ion-input id="confirmPassword" v-model="passwordConfirmation" type="password"
                                            class="field" autocomplete="new-password"
                                            placeholder="Digite novamente a nova senha" required :minlength="6" />
                                        <span v-if="passwordConfirmation && newPassword !== passwordConfirmation"
                                            class="field-error" role="alert">As senhas não correspondem.</span>
                                    </div>

                                    <div class="profile-actions">
                                        <ion-button type="button" class="ghost-button" :disabled="savingPassword"
                                            @click="cancelPasswordChange">Cancelar</ion-button>
                                        <ion-button type="submit" class="primary-button"
                                            :disabled="savingPassword || !currentPassword || newPassword.length < 6
                                                || newPassword !== passwordConfirmation">
                                            <span v-if="!savingPassword">Atualizar senha</span>
                                            <ion-spinner v-else name="crescent" />
                                        </ion-button>
                                    </div>
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

                            <details v-if="uploadRequests.length" class="scan-explanation">
                                <summary>Sobre a verificação</summary>
                                <p>Envios pendentes ficam privados. Cada consulta verifica um envio para respeitar os limites do VirusTotal.</p>
                            </details>

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
                        <section class="panel reading-progress-panel" aria-labelledby="progress-title">
                            <div class="panel-header-simple">
                                <h2 id="progress-title">Progresso de leitura</h2>
                                <p class="panel-subtitle">O progresso é atualizado automaticamente enquanto você lê no
                                    navegador. Você pode remover um registro quando quiser.</p>
                            </div>

                            <div class="reading-stats" aria-label="Resumo das leituras">
                                <article class="reading-stat">
                                    <span class="reading-stat-icon"><ion-icon :icon="bookOutline" /></span>
                                    <strong>{{ completedReadingCount }}</strong>
                                    <span>Livros lidos</span>
                                </article>
                                <article class="reading-stat">
                                    <span class="reading-stat-icon"><ion-icon :icon="timeOutline" /></span>
                                    <strong>{{ activeReadingCount }}</strong>
                                    <span>Em andamento</span>
                                </article>
                                <article class="reading-stat">
                                    <span class="reading-stat-icon"><ion-icon :icon="libraryOutline" /></span>
                                    <strong>{{ readingHistory.length }}</strong>
                                    <span>No histórico</span>
                                </article>
                                <article class="reading-stat">
                                    <span class="reading-stat-icon"><ion-icon :icon="statsChartOutline" /></span>
                                    <strong>{{ averageReadingProgress }}%</strong>
                                    <span>Progresso médio</span>
                                </article>
                            </div>

                            <article v-if="currentReading" class="current-reading-card">
                                <span class="current-reading-cover" aria-hidden="true">
                                    <img v-if="currentReading.cover_url" :src="currentReading.cover_url" alt="" />
                                    <ion-icon v-else :icon="bookOutline" />
                                </span>
                                <div class="current-reading-content">
                                    <span class="current-reading-label">LENDO AGORA</span>
                                    <RouterLink
                                        class="progress-card-link"
                                        :to="{ name: 'DocumentDetails', params: { id: currentReading.document_id }, query: { openReader: 'true' } }"
                                        :aria-label="`Continuar lendo ${currentReading.title}, ${currentReading.percent}% concluído`"
                                    >
                                        <div class="item-title-block">
                                            <strong>{{ currentReading.title }}</strong>
                                            <span>{{ currentReading.author }}</span>
                                        </div>
                                        <div
                                            class="progress-bar"
                                            role="progressbar"
                                            :aria-label="`Progresso de leitura de ${currentReading.title}`"
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                            :aria-valuenow="Math.min(100, Math.max(0, currentReading.percent))"
                                        >
                                            <span :style="{ width: `${Math.min(100, Math.max(0, currentReading.percent))}%` }" />
                                        </div>
                                        <p class="progress-summary">
                                            <span v-if="currentReading.page > 0">Página {{ currentReading.page }} · </span>
                                            <span v-else>Progresso por rolagem · </span>
                                            {{ currentReading.percent }}% concluído
                                        </p>
                                    </RouterLink>
                                </div>
                                <RouterLink
                                    class="continue-reading-link"
                                    :to="{ name: 'DocumentDetails', params: { id: currentReading.document_id }, query: { openReader: 'true' } }"
                                    :aria-label="`Continuar lendo ${currentReading.title}`"
                                >
                                    <ion-icon :icon="chevronForwardOutline" aria-hidden="true" />
                                </RouterLink>
                            </article>
                            <p v-else class="current-reading-empty">
                                Seu progresso será registrado automaticamente quando você ler um documento no navegador.
                            </p>

                            <section class="reading-history" aria-labelledby="reading-history-title">
                                <header class="reading-history-header">
                                    <h3 id="reading-history-title">Seu histórico de leitura</h3>
                                    <button
                                        v-if="readingHistory.length > 5"
                                        type="button"
                                        class="reading-history-more"
                                        @click="showAllReadingHistory = !showAllReadingHistory"
                                    >
                                        {{ showAllReadingHistory ? 'Mostrar menos' : 'Ver todos' }}
                                        <ion-icon :icon="chevronForwardOutline" aria-hidden="true" />
                                    </button>
                                </header>

                                <p v-if="readingHistory.length === 0" class="empty-state reading-history-empty">
                                    Ainda não há outras leituras no seu histórico.
                                </p>
                                <div v-else class="interactive-list reading-history-list">
                                    <article
                                        v-for="item in visibleReadingHistory"
                                        :key="item.id"
                                        class="list-item-card progress-card history-card"
                                    >
                                        <RouterLink
                                            class="history-book-link"
                                            :to="{ name: 'DocumentDetails', params: { id: item.document_id }, query: { openReader: 'true' } }"
                                            :aria-label="`Continuar lendo ${item.title}, ${item.percent}% concluído`"
                                        >
                                            <span class="history-book-cover" aria-hidden="true">
                                                <img v-if="item.cover_url" :src="item.cover_url" alt="" />
                                                <ion-icon v-else :icon="bookOutline" />
                                            </span>
                                            <span class="history-book-copy">
                                                <strong>{{ item.title }}</strong>
                                                <small>{{ item.author }}</small>
                                            </span>
                                            <span class="history-progress-badge"
                                                :class="{ 'is-complete': item.percent >= 100 }">
                                                {{ Math.round(Math.min(100, Math.max(0, item.percent))) }}%
                                            </span>
                                            <ion-icon class="history-chevron" :icon="chevronForwardOutline" aria-hidden="true" />
                                        </RouterLink>
                                        <ion-button size="small" fill="clear" color="danger"
                                            :aria-label="`Excluir progresso de ${item.title}`"
                                            :disabled="savingProgress" @click="handleDeleteProgress(item.id)">
                                            <ion-icon slot="icon-only" :icon="trashOutline" />
                                        </ion-button>
                                    </article>
                                </div>
                            </section>
                        </section>
                    </div>

                    <div v-else-if="selectedTab === 'collections'" id="collections-panel" role="tabpanel"
                        aria-labelledby="collections-tab" class="tab-content">
                        <BookCollectionsPanel
                        />
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
    albumsOutline,
    bookOutline,
    cameraOutline,
    chevronForwardOutline,
    closeOutline,
    documentOutline,
    documentTextOutline,
    eyeOutline,
    libraryOutline,
    logOutOutline,
    pencilOutline,
    personOutline,
    shieldCheckmarkOutline,
    statsChartOutline,
    starOutline,
    timeOutline,
    trashOutline
} from 'ionicons/icons';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import AuthAvatarPicker from '@/components/AuthAvatarPicker.vue';
import UploadDropzone from '@/components/UploadDropzone.vue';
import UploadMetadataForm from '@/components/UploadMetadataForm.vue';
import BookCollectionsPanel from '@/components/BookCollectionsPanel.vue';
import { useUserArea } from '@/composables/useUserArea';
import { getFileExtension } from '@/utils/getFileExtension';
import { parsePublicationYear } from '@/utils/publicationYear';
import type { UploadScanStatus } from '@/types/userArea';

const route = useRoute();
const selectedTab = ref(
    route.query.tab === 'uploads' || route.query.tab === 'security' || route.query.tab === 'collections'
        || route.query.tab === 'progress'
        ? route.query.tab
        : 'profile'
);
const showAllReadingHistory = ref(false);
const getDisplayUsername = (username: string) =>
    username ? `@${username.replace(/^@+/, '')}` : 'Não informado';

const {
    pageLoading,
    savingProfile,
    savingPassword,
    savingProgress,
    savingReview,
    savingContribution,
    checkingUploads,
    profileForm,
    isEditingProfile,
    isChangingPassword,
    pendingEmail,
    emailNeedsReauthentication,
    currentPassword,
    newPassword,
    passwordConfirmation,
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
    cancelProfileEdit,
    cancelPasswordChange,
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

const currentReading = computed(() =>
    progressList.value.find((item) => item.status === 'lendo') ?? null
);
const readingHistory = computed(() => progressList.value);
const visibleReadingHistory = computed(() =>
    showAllReadingHistory.value ? readingHistory.value : readingHistory.value.slice(0, 5)
);
const completedReadingCount = computed(() =>
    progressList.value.filter((item) => item.status === 'lido').length
);
const activeReadingCount = computed(() =>
    progressList.value.filter((item) => item.status !== 'lido').length
);
const averageReadingProgress = computed(() => progressList.value.length
    ? Math.round(progressList.value.reduce((sum, item) => sum + item.percent, 0) / progressList.value.length)
    : 0
);

const passwordStrengthLabel = computed(() => {
    const password = newPassword.value;
    if (!password) return 'Use pelo menos 6 caracteres.';
    const score = [
        password.length >= 8,
        /[a-z]/.test(password) && /[A-Z]/.test(password),
        /\d/.test(password),
        /[^A-Za-z0-9]/.test(password)
    ].filter(Boolean).length;
    return score >= 3 ? 'Força da senha: forte' : score >= 2 ? 'Força da senha: razoável' : 'Força da senha: fraca';
});

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
    gap: var(--space-md);
    padding: var(--space-md) var(--surface-padding);
}

.identity-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.identity-info h1 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: clamp(1.2rem, 2vw, 1.65rem);
    font-weight: 800;
    line-height: 1.2;
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

.field-error {
    color: var(--color-danger, #B42318);
    font-size: var(--font-size-caption);
}

.profile-avatar-preview {
    position: relative;
    display: grid;
    width: 80px;
    height: 80px;
    place-items: center;
    overflow: visible;
    padding: 0;
    border: 1px solid var(--color-border-soft);
    border-radius: 50%;
    background: var(--color-surface-alt);
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: 2rem;
}

.profile-avatar-preview img {
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 50%;
    object-fit: cover;
}

.profile-avatar-action {
    position: absolute;
    right: -3px;
    bottom: -3px;
    z-index: 1;
    display: grid;
    width: 30px;
    height: 30px;
    place-items: center;
    border: 2px solid var(--color-surface);
    border-radius: 50%;
    background: var(--color-primary-dark);
    color: var(--color-white);
    pointer-events: none;
}

.profile-avatar-action ion-icon {
    display: block;
    width: 16px;
    height: 16px;
    color: var(--color-white);
    --ionicon-stroke-width: 30px;
}

.profile-avatar-preview:focus-visible {
    outline: 3px solid var(--color-brand-primary);
    outline-offset: 3px;
}

.profile-details {
    display: grid;
    gap: var(--space-sm);
    margin: 0;
}

.profile-panel {
    width: min(100%, 560px);
    align-self: center;
    padding: clamp(var(--space-md), 4vw, var(--surface-padding));
}

.profile-panel .panel-header-simple {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
}

.profile-panel .panel-header-simple h2 {
    font-size: 1.15rem;
}

.profile-panel .panel-subtitle {
    max-width: 34ch;
    font-size: 0.88rem;
    line-height: 1.4;
}

.profile-view-card {
    gap: var(--space-md);
}

.profile-view-card .profile-avatar-preview {
    align-self: center;
}

.profile-view-card .profile-detail {
    gap: 2px;
}

.profile-view-card .profile-detail dt {
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    font-weight: 500;
}

.profile-view-card .profile-detail dd {
    font-size: 0.95rem;
    line-height: 1.35;
}

.profile-view-actions :deep(ion-button) {
    --border-radius: var(--radius-control);
    height: 42px;
    font-size: 0.9rem;
}

.profile-detail {
    display: grid;
    gap: 4px;
}

.profile-detail dt {
    color: var(--color-text-muted, #6E6C7C);
    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.3;
}

.profile-detail dd {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.45;
    overflow-wrap: anywhere;
}

.profile-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-sm);
}

.profile-view-actions,
.profile-view-actions :deep(ion-button) {
    width: 100%;
    min-height: 44px;
}

.profile-view-actions :deep(ion-button) {
    margin: 0;
}

.sign-out-button {
    --color: var(--color-text-secondary);
    margin: 0;
    text-transform: none;
    flex-shrink: 0;
}

/* User area tabs */
.tab-navigation {
    display: flex;
    gap: 4px;
    width: 100%;
    padding: 4px;
    background: rgba(226, 218, 211, 0.4);
    border-radius: var(--radius-lg);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    scroll-snap-type: x mandatory;
}

.tab-navigation::-webkit-scrollbar {
    display: none;
}

.tab-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex: 0 0 auto;
    min-width: max-content;
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
    scroll-snap-align: start;
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
    color: var(--color-text-secondary, #4A4E69);
    font-size: 0.85rem;
}

.scan-explanation summary {
    width: fit-content;
    cursor: pointer;
    font-weight: 700;
}

.scan-explanation p {
    margin: 8px 0 0;
    line-height: 1.5;
}

.upload-request-list {
    margin-bottom: 16px;
}

.upload-request-card {
    align-items: center;
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
    aspect-ratio: 3 / 4;
    flex-shrink: 0;
    border-radius: var(--radius-sm, 8px);
    overflow: hidden;
    background: var(--color-surface-alt, #EEE5DE);
}

.cover-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.cover-fallback {
    display: grid;
    width: 100%;
    height: 100%;
    place-items: center;
    border: 1px solid var(--color-border-soft, #E2DAD3);
    box-sizing: border-box;
    background: var(--color-surface-alt, #EEE5DE);
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

.reading-progress-panel {
    gap: var(--space-lg);
}

.reading-progress-panel > .panel-header-simple {
    margin-bottom: 0;
}

.reading-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-sm);
}

.reading-stat {
    display: grid;
    justify-items: center;
    gap: 3px;
    min-width: 0;
    padding: var(--space-sm);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text-primary);
    text-align: center;
}

.reading-stat-icon {
    display: grid;
    width: 34px;
    height: 34px;
    margin-bottom: 2px;
    place-items: center;
    border-radius: 50%;
    background: var(--color-surface-alt);
    color: var(--color-brand-primary);
    font-size: 1.1rem;
}

.reading-stat strong {
    font-size: 0.95rem;
    line-height: 1.2;
}

.reading-stat > span:last-child {
    color: var(--color-text-secondary);
    font-size: 0.68rem;
    line-height: 1.25;
}

.current-reading-card {
    display: grid;
    grid-template-columns: 90px minmax(0, 1fr) 42px;
    align-items: center;
    gap: var(--space-md);
    min-width: 0;
    padding: var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--color-surface);
}

.current-reading-cover,
.history-book-cover {
    display: grid;
    overflow: hidden;
    place-items: center;
    background: var(--color-surface-alt);
    color: var(--color-text-muted);
}

.current-reading-cover {
    width: 90px;
    height: 112px;
    border-radius: var(--radius-sm);
    font-size: 2rem;
}

.current-reading-cover img,
.history-book-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.current-reading-content {
    display: grid;
    min-width: 0;
    gap: var(--space-sm);
}

.current-reading-label {
    width: fit-content;
    padding: 3px 9px;
    border-radius: 999px;
    background: var(--color-surface-alt);
    color: var(--color-brand-primary);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.04em;
}

.current-reading-content .progress-card-link {
    display: grid;
    gap: var(--space-sm);
    min-width: 0;
    color: var(--color-text-primary);
    text-decoration: none;
}

.current-reading-content .item-title-block {
    display: grid;
    gap: 4px;
    min-width: 0;
}

.current-reading-content .item-title-block strong {
    overflow: hidden;
    color: var(--color-text-primary);
    font-size: 0.95rem;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.current-reading-content .item-title-block span {
    overflow: hidden;
    color: var(--color-text-secondary);
    font-size: 0.78rem;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.current-reading-content .progress-bar {
    height: 7px;
    background: var(--color-surface-alt);
}

.current-reading-content .progress-bar span {
    background: var(--color-brand-primary);
}

.current-reading-content .progress-summary {
    font-size: 0.7rem;
}

.continue-reading-link {
    display: grid;
    width: 40px;
    height: 40px;
    place-items: center;
    border: 1px solid var(--color-brand-primary);
    border-radius: var(--radius-control);
    color: var(--color-brand-primary);
    font-size: 1.3rem;
    text-decoration: none;
}

.continue-reading-link:focus-visible,
.history-book-link:focus-visible,
.view-all-collections:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 3px;
}

.current-reading-empty {
    margin: 0;
    padding: var(--space-md);
    border: 1px dashed var(--color-border-soft);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    text-align: center;
}

.reading-history {
    display: grid;
    gap: var(--space-sm);
}

.reading-history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
}

.reading-history-header h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 0.95rem;
    font-weight: 600;
}

.reading-history-more {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: var(--space-xs);
    border: 0;
    background: transparent;
    color: var(--color-brand-primary);
    cursor: pointer;
    font: inherit;
    font-size: var(--font-size-caption);
}

.reading-history-more ion-icon {
    font-size: 1rem;
}

.reading-history-list {
    gap: var(--space-sm);
}

.reading-history-list .history-card {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space-xs);
    min-width: 0;
    padding: var(--space-sm);
    border-color: transparent;
    background: var(--color-surface);
}

.history-book-link {
    display: flex;
    flex: 1;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
    color: var(--color-text-primary);
    text-decoration: none;
}

.history-book-cover {
    width: 54px;
    height: 64px;
    flex: 0 0 54px;
    border-radius: var(--radius-sm);
    font-size: 1.35rem;
}

.history-book-copy {
    display: grid;
    flex: 1;
    gap: 4px;
    min-width: 0;
}

.history-book-copy strong,
.history-book-copy small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.history-book-copy strong {
    color: var(--color-text-primary);
    font-size: 0.82rem;
}

.history-book-copy small {
    color: var(--color-text-secondary);
    font-size: 0.7rem;
}

.history-progress-badge {
    flex: 0 0 auto;
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--color-surface-alt);
    color: var(--color-brand-primary);
    font-size: 0.68rem;
    font-weight: 600;
}

.history-progress-badge.is-complete {
    background: color-mix(in srgb, var(--color-success, #228B66) 16%, white);
    color: var(--color-success, #228B66);
}

.history-chevron {
    flex: 0 0 auto;
    color: var(--color-text-muted);
    font-size: 1.2rem;
}

.reading-history-list .history-card > ion-button {
    flex: 0 0 34px;
    width: 34px;
    height: 34px;
    margin: 0;
}

.reading-history-empty {
    min-height: 0;
    margin: 0;
    padding: var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--font-size-caption);
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

    .identity-card {
        flex-direction: column;
        flex-direction: row;
        align-items: center;
    }

    .panel-header-simple {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-xs);
    }

    .panel-subtitle {
        max-width: 100%;
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

    .reading-stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .current-reading-card {
        grid-template-columns: 68px minmax(0, 1fr) 34px;
        gap: var(--space-sm);
        padding: var(--space-sm);
    }

    .current-reading-cover {
        width: 68px;
        height: 92px;
    }

    .continue-reading-link {
        width: 34px;
        height: 34px;
    }

    .reading-history-list .history-card {
        gap: 0;
        padding: var(--space-xs);
    }

    .history-book-link {
        gap: var(--space-xs);
    }

    .history-book-cover {
        width: 42px;
        height: 54px;
        flex-basis: 42px;
    }

    .history-progress-badge {
        padding: 3px 6px;
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