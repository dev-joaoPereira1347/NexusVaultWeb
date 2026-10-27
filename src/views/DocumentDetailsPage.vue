<template>
    <IonPage>
        <IonContent :fullscreen="true" class="details-content">
            <SiteHeader />

            <main class="details-page nv-page-shell">
                <div v-if="loading" class="feedback" role="status">
                    <ion-spinner name="crescent" />
                    <span>Carregando detalhes do documento...</span>
                </div>
                <section v-else-if="errorMessage" class="feedback error-message" role="alert">
                    {{ errorMessage }}
                </section>
                <template v-else-if="item">
                    <RouterLink class="back-link" :to="{ name: 'Search' }" aria-label="Voltar ao acervo">
                        <ion-icon :icon="arrowBackOutline" aria-hidden="true" />
                        <span>Voltar ao acervo</span>
                    </RouterLink>

                    <section class="document-summary nv-surface" aria-labelledby="document-title">
                        <div class="cover-panel">
                            <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`" />
                            <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                        </div>

                        <div class="summary-info">
                            <div class="summary-topline">
                                <p class="nv-eyebrow nv-badge">{{ item.category }} · {{ item.content_type }}</p>
                            </div>
                            <h1 id="document-title" class="nv-page-title">{{ item.title }}</h1>
                            <p class="author">Por {{ item.author }}</p>
                            <p class="uploader">
                                Enviado por
                                <RouterLink v-if="uploaderName" :to="{ name: 'PublicProfile', params: { id: item.uploaded_by } }">
                                    {{ uploaderName }}
                                </RouterLink>
                                <span v-else>Perfil indisponível</span>
                            </p>
                            <ul class="summary-meta" aria-label="Metadados do livro">
                                <li v-if="item.year">
                                    <ion-icon :icon="calendarOutline" aria-hidden="true" />
                                    <span>{{ item.year }}</span>
                                </li>
                                <li v-if="item.language">
                                    <ion-icon :icon="languageOutline" aria-hidden="true" />
                                    <span>{{ item.language.toUpperCase() }}</span>
                                </li>
                                <li v-if="getFileExtension(item.file_name)">
                                    <ion-icon :icon="bookOutline" aria-hidden="true" />
                                    <span>{{ getFileExtension(item.file_name) }}</span>
                                </li>
                                <li>
                                    <ion-icon :icon="documentOutline" aria-hidden="true" />
                                    <span>{{ formatFileSize(item.file_size) }}</span>
                                </li>
                            </ul>
                            <p v-if="!reviewsError && !reviews.length && !reviewLoading" class="review-empty">
                                Ainda não há avaliações para este documento.
                            </p>
                            <div class="summary-actions" aria-label="Ações do documento">
                                <ion-button
                                    v-if="item.content_type === 'livro'"
                                    class="collection-save-button"
                                    fill="outline"
                                    :aria-label="`${isSavedInCollection ? 'Gerenciar coleções de' : 'Salvar'} ${item.title}`"
                                    :aria-pressed="isSavedInCollection"
                                    @click="isCollectionPickerOpen = true"
                                >
                                    <ion-icon
                                        slot="start"
                                        :icon="isSavedInCollection ? bookmark : bookmarkOutline"
                                    />
                                    {{ isSavedInCollection ? 'Salvo em coleções' : 'Salvar em coleção' }}
                                </ion-button>
                                <ion-button class="read-button" :aria-label="`Ler ${item.title} online`"
                                    @click="openReader">
                                    <ion-icon slot="start" :icon="bookOutline" />
                                    Ler online
                                </ion-button>
                                <ion-button class="download-button" :disabled="isDownloading" :aria-busy="isDownloading"
                                    :aria-label="isDownloading ? 'Baixando documento' : `Baixar ${item.title}`"
                                    @click="downloadDocument">
                                    <ion-spinner v-if="isDownloading" slot="start" name="crescent" />
                                    <ion-icon v-else slot="start" :icon="downloadOutline" />
                                    {{ isDownloading ? 'Baixando...' : 'Download' }}
                                </ion-button>
                            </div>
                            <p class="actions-hint">Leia no navegador ou baixe uma cópia para o seu dispositivo.</p>
                        </div>
                    </section>

                    <section class="detail-section nv-surface" aria-labelledby="description-title">
                        <h2 id="description-title" class="section-title">Descrição</h2>
                        <p
                            v-if="item.description"
                            class="section-copy description-copy"
                            :class="{ 'description-copy-collapsed': isDescriptionLong && !isDescriptionExpanded }"
                        >{{ item.description }}</p>
                        <button
                            v-if="isDescriptionLong"
                            type="button"
                            class="description-toggle"
                            :aria-expanded="isDescriptionExpanded"
                            @click="isDescriptionExpanded = !isDescriptionExpanded"
                        >
                            {{ isDescriptionExpanded ? 'Ler menos' : 'Ler mais' }}
                        </button>
                        <p v-if="!item.description" class="section-copy muted">
                            Este documento ainda não possui uma descrição.
                        </p>
                    </section>

                    <section class="detail-section reviews-section nv-surface" aria-labelledby="reviews-title">
                        <div class="section-heading">
                            <div>
                                <h2 id="reviews-title" class="section-title">Avaliações da comunidade</h2>
                                <p class="section-copy muted">
                                    {{ reviewsError ? 'As avaliações estão indisponíveis no momento.' : reviewLoading ? 'Carregando avaliações...' : reviews.length ? `${reviews.length} ${reviews.length === 1 ? 'avaliação recente' : 'avaliações recentes'}` : 'Ainda não há avaliações para este documento.' }}
                                </p>
                            </div>
                            <div v-if="reviews.length" class="rating-summary" :aria-label="`Média ${averageRating} de 5`">
                                <span class="rating-stars" aria-hidden="true">{{ starRating(averageRating) }}</span>
                                <strong>{{ averageRating.toFixed(1) }}</strong>
                            </div>
                        </div>
                        <p v-if="reviewsError" class="reviews-error" role="alert">{{ reviewsError }}</p>
                        <form v-if="reviewUserId" class="review-editor" @submit.prevent="submitReview">
                            <h3>{{ myReview ? 'Sua avaliação' : 'Avalie este documento' }}</h3>
                            <div class="review-rating-picker" role="group" aria-label="Sua nota">
                                <button
                                    v-for="rating in 5"
                                    :key="rating"
                                    type="button"
                                    class="rating-choice"
                                    :class="{ 'is-selected': rating <= reviewRating }"
                                    :aria-label="`${rating} ${rating === 1 ? 'estrela' : 'estrelas'}`"
                                    :aria-pressed="reviewRating === rating"
                                    :disabled="reviewLoading || savingReview"
                                    @click="reviewRating = rating"
                                >
                                    ★
                                </button>
                                <span class="rating-choice-label">{{ reviewRating }} de 5</span>
                            </div>
                            <label class="review-comment-field">
                                <span>Comentário <span class="muted">(opcional)</span></span>
                                <textarea
                                    v-model="reviewComment"
                                    rows="3"
                                    maxlength="2000"
                                    placeholder="Compartilhe sua opinião sobre este documento."
                                    :disabled="reviewLoading || savingReview"
                                />
                            </label>
                            <p v-if="reviewSubmitError" class="reviews-error" role="alert">{{ reviewSubmitError }}</p>
                            <ion-button class="review-submit" type="submit" :disabled="savingReview || reviewLoading">
                                <ion-spinner v-if="savingReview" slot="start" name="crescent" />
                                {{ savingReview ? 'Salvando avaliação...' : myReview ? 'Atualizar avaliação' : 'Enviar avaliação' }}
                            </ion-button>
                        </form>
                        <p v-else-if="!reviewLoading" class="review-sign-in">
                            <RouterLink :to="{ name: 'Auth', query: { redirect: route.fullPath } }">
                                Entre na sua conta
                            </RouterLink>
                            para avaliar este documento.
                        </p>
                        <p v-if="reviewLoading" class="review-loading" role="status">
                            <ion-spinner name="crescent" /> Carregando sua avaliação...
                        </p>
                        <p v-if="reviewLoadError" class="reviews-error" role="alert">{{ reviewLoadError }}</p>
                        <ul v-if="!reviewsError && reviews.length" class="review-list">
                            <li v-for="review in reviews" :key="review.id" class="review-item">
                                <div class="review-avatar" aria-hidden="true">
                                    <img v-if="review.avatar_url" :src="review.avatar_url" alt="" />
                                    <ion-icon v-else :icon="personCircleOutline" />
                                </div>
                                <div class="review-body">
                                    <div class="review-heading">
                                        <strong>{{ review.username }}</strong>
                                        <span class="rating-stars" :aria-label="`${review.rating} de 5 estrelas`">
                                            {{ starRating(review.rating) }}
                                        </span>
                                    </div>
                                    <p v-if="review.comment">{{ review.comment }}</p>
                                    <time :datetime="review.created_at">{{ formatDate(review.created_at) }}</time>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <section class="detail-section author-section nv-surface" aria-labelledby="author-title">
                        <div class="author-avatar" aria-hidden="true">
                            <ion-icon :icon="personCircleOutline" />
                        </div>
                        <div>
                            <h2 id="author-title" class="section-title">Autor</h2>
                            <p class="section-copy">
                                {{ item.author }} · {{ item.content_type }}{{ item.year ? ` · ${item.year}` : '' }}
                            </p>
                        </div>
                    </section>
                    <div class="report-action">
                        <ion-button class="report-button" fill="clear" type="button" aria-label="Denunciar documento"
                            @click="openReportModal">
                            <ion-icon slot="start" :icon="flagOutline" />
                            Denunciar livro
                        </ion-button>
                    </div>

                    <section v-if="relatedItems.length" class="related-section" aria-labelledby="related-title">
                        <h2 id="related-title" class="section-title">Mais do acervo</h2>
                        <p v-if="relatedError" class="reviews-error" role="alert">{{ relatedError }}</p>
                        <div class="related-grid">
                            <RouterLink v-for="related in relatedItems" :key="related.id"
                                :to="{ name: 'DocumentDetails', params: { id: related.id } }"
                                class="related-card nv-surface">
                                <img v-if="related.cover_url" :src="related.cover_url" :alt="`Capa de ${related.title}`" />
                                <div v-else class="related-cover-fallback">
                                    <ion-icon :icon="documentTextOutline" aria-hidden="true" />
                                </div>
                                <strong>{{ related.title }}</strong>
                                <span>{{ related.author }}</span>
                                <span v-if="getFileExtension(related.file_name)">{{ getFileExtension(related.file_name) }}</span>
                            </RouterLink>
                        </div>
                    </section>
                    <p v-else-if="relatedError" class="reviews-error" role="alert">{{ relatedError }}</p>
                </template>
            </main>

            <SiteFooter />
        </IonContent>
        <IonModal class="reader-modal" :is-open="isReaderOpen" @didDismiss="closeReader">
            <section class="reader-section" :class="`reader-theme-${readerTheme}`" aria-labelledby="reader-title">
                <div class="reader-heading" :class="{ 'reader-controls-hidden': !readerControlsVisible }">
                    <span class="reader-heading-spacer" aria-hidden="true" />
                    <div class="reader-title-wrap">
                        <h2 id="reader-title" class="reader-book-title">{{ item?.title }}</h2>
                    </div>
                    <ion-button class="reader-close" fill="clear" type="button" aria-label="Fechar leitor"
                        @click="closeReader">
                        <ion-icon slot="start" :icon="closeOutline" aria-hidden="true" />
                        Fechar
                    </ion-button>
                </div>
                <ion-button
                    class="reader-controls-toggle"
                    fill="outline"
                    type="button"
                    :aria-label="readerControlsVisible ? 'Ocultar opções do leitor' : 'Mostrar opções do leitor'"
                    :aria-pressed="readerControlsVisible"
                    @click.stop="toggleReaderControls"
                >
                    <ion-icon
                        slot="icon-only"
                        :icon="readerControlsVisible ? eyeOffOutline : eyeOutline"
                        aria-hidden="true"
                    />
                </ion-button>
                <div class="reader-tools" :class="{ 'reader-controls-hidden': !readerControlsVisible }">
                    <ion-button class="reader-tool-trigger" fill="outline" type="button"
                        :aria-expanded="activeReaderPanel !== null" aria-label="Abrir ferramentas de leitura"
                        @click="toggleReaderPanel('actions')">
                        <ion-icon slot="start" :icon="ellipsisHorizontalOutline" />
                        Ferramentas
                    </ion-button>
                    <div v-if="activeReaderPanel" class="reader-tools-panel">
                        <div class="reader-tools-actions" aria-label="Ferramentas de leitura">
                            <ion-button fill="clear" type="button" @click="toggleReaderPanel('search')">
                                <ion-icon slot="start" :icon="searchOutline" /> Buscar
                            </ion-button>
                            <ion-button fill="clear" type="button" :disabled="!readerContents.length"
                                @click="toggleReaderPanel('contents')">
                                <ion-icon slot="start" :icon="listOutline" /> Sumário
                            </ion-button>
                            <ion-button v-if="isPdf || isEpub" fill="clear" type="button"
                                :disabled="readerLoading" @click="toggleContinuousReading">
                                <ion-icon slot="start" :icon="readerContinuous ? bookOutline : documentTextOutline" />
                                {{ readerContinuous ? 'Leitura por páginas' : 'Leitura contínua' }}
                            </ion-button>
                            <ion-button fill="clear" type="button" @click="toggleReaderPanel('settings')">
                                <ion-icon slot="start" :icon="readerTheme === 'dark' ? moonOutline : sunnyOutline" />
                                Visualização
                            </ion-button>
                            <ion-button fill="clear" type="button" @click="toggleFullscreen">
                                <ion-icon slot="start" :icon="isFullscreen ? contractOutline : expandOutline" />
                                {{ isFullscreen ? 'Sair da tela cheia' : 'Tela cheia' }}
                            </ion-button>
                            <ion-button v-if="pageCount" fill="clear" type="button" @click="toggleBookmark">
                                <ion-icon slot="start" :icon="bookmarkOutline" />
                                {{ bookmarkedPage === currentPage ? 'Remover marcador' : 'Marcar esta página' }}
                            </ion-button>
                            <ion-button v-if="bookmarkedPage && pageCount" fill="clear" type="button"
                                @click="goToPageNumber(bookmarkedPage)">
                                <ion-icon slot="start" :icon="bookmarkOutline" /> Ir ao marcador ({{ bookmarkedPage }})
                            </ion-button>
                            <ion-button fill="clear" type="button" @click="downloadDocument">
                                <ion-icon slot="start" :icon="downloadOutline" /> Baixar documento
                            </ion-button>
                            <ion-button fill="clear" type="button" @click="openDocumentForPrint">
                                <ion-icon slot="start" :icon="printOutline" /> Imprimir
                            </ion-button>
                        </div>
                        <form v-if="activeReaderPanel === 'search'" class="reader-search" @submit.prevent="searchDocument">
                            <label for="reader-search-input">Buscar no documento</label>
                            <div>
                                <input id="reader-search-input" v-model="readerSearchQuery" type="search"
                                    placeholder="Palavra ou frase" />
                                <ion-button type="submit" :disabled="readerSearching || !readerSearchQuery.trim()">
                                    {{ readerSearching ? 'Buscando...' : 'Buscar' }}
                                </ion-button>
                            </div>
                            <p v-if="readerSearchMessage" role="status">{{ readerSearchMessage }}</p>
                            <ul v-if="readerSearchResults.length" class="reader-result-list">
                                <li v-for="result in readerSearchResults" :key="result.page">
                                    <button type="button" @click="goToPageNumber(result.page)">
                                        {{ result.title }}
                                    </button>
                                </li>
                            </ul>
                        </form>
                        <div v-else-if="activeReaderPanel === 'contents'" class="reader-contents">
                            <p>Sumário</p>
                            <ul>
                                <li v-for="entry in readerContents" :key="`${entry.page}-${entry.title}`">
                                    <button type="button" :style="{ paddingInlineStart: `${12 + entry.level * 16}px` }"
                                        @click="goToPageNumber(entry.page)">
                                        {{ entry.title }} <span>{{ entry.page }}</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <div v-else-if="activeReaderPanel === 'settings'" class="reader-settings">
                            <fieldset>
                                <legend>Ajustar página PDF</legend>
                                <ion-button fill="outline" :class="{ selected: pdfFitMode === 'width' }"
                                    :disabled="!isPdf" @click="setPdfFitMode('width')">
                                    Ajustar à largura
                                </ion-button>
                                <ion-button fill="outline" :class="{ selected: pdfFitMode === 'page' }"
                                    :disabled="!isPdf" @click="setPdfFitMode('page')">
                                    Ajustar à página
                                </ion-button>
                            </fieldset>
                            <fieldset>
                                <legend>Tema de leitura</legend>
                                <ion-button fill="outline" :class="{ selected: readerTheme === 'light' }"
                                    @click="readerTheme = 'light'">Claro</ion-button>
                                <ion-button fill="outline" :class="{ selected: readerTheme === 'sepia' }"
                                    @click="readerTheme = 'sepia'">Sépia</ion-button>
                                <ion-button fill="outline" :class="{ selected: readerTheme === 'dark' }"
                                    @click="readerTheme = 'dark'">Escuro</ion-button>
                            </fieldset>
                        </div>
                    </div>
                </div>
                <p v-if="readingProgressError" class="reader-progress-error" role="status">
                    {{ readingProgressError }}
                </p>

                <div v-if="isPdf || isEpub" class="reader-toolbar" :class="{ 'reader-controls-hidden': !readerControlsVisible }" aria-label="Controles do leitor">
                    <ion-button class="reader-control" fill="outline" type="button"
                        :disabled="readerLoading || currentPage <= 1" aria-label="Página anterior"
                        @click="changePage(-1)">
                        <ion-icon slot="icon-only" :icon="arrowBackOutline" />
                    </ion-button>
                    <span class="reader-page">
                        <span class="reader-page-label">{{ isEpub ? 'Capítulo' : 'Página' }}</span>
                        <input
                            type="number"
                            min="1"
                            :max="pageCount || undefined"
                            :value="currentPage"
                            :disabled="readerLoading || !pageCount"
                            :aria-label="`Ir para ${isEpub ? 'capítulo' : 'página'}`"
                            @change="goToPage"
                        />
                        <span class="reader-page-total">
                            {{ pageCount ? `de ${pageCount}` : `de ${isEpub ? 'capítulos' : 'páginas'}...` }}
                        </span>
                    </span>
                    <ion-button class="reader-control" fill="outline" type="button"
                        :disabled="readerLoading || currentPage >= pageCount" :aria-label="isEpub ? 'Próximo capítulo' : 'Próxima página'"
                        @click="changePage(1)">
                        <ion-icon slot="icon-only" :icon="arrowForwardOutline" />
                    </ion-button>
                    <template v-if="isPdf">
                        <span class="reader-toolbar-spacer" />
                        <ion-button class="reader-control reader-fit-control" fill="outline" type="button" aria-label="Ajustar à largura"
                            @click="setPdfFitMode('width')">
                            Largura
                        </ion-button>
                        <ion-button class="reader-control reader-fit-control" fill="outline" type="button" aria-label="Ajustar à página"
                            @click="setPdfFitMode('page')">
                            Página
                        </ion-button>
                        <ion-button class="reader-control reader-zoom-control" fill="outline" type="button"
                            :disabled="readerLoading || zoom <= 0.7" aria-label="Diminuir zoom"
                            @click="changeZoom(-0.2)">
                            <ion-icon slot="icon-only" :icon="removeOutline" />
                        </ion-button>
                        <span class="reader-zoom">{{ Math.round(zoom * 100) }}%</span>
                        <ion-button class="reader-control reader-zoom-control" fill="outline" type="button"
                            :disabled="readerLoading || zoom >= 2.4" aria-label="Aumentar zoom"
                            @click="changeZoom(0.2)">
                            <ion-icon slot="icon-only" :icon="addOutline" />
                        </ion-button>
                    </template>
                </div>

                <div
                    class="reader-body"
                    @click="onReaderBodyClick"
                    @touchstart="onReaderTouchStart"
                    @touchmove="onReaderTouchMove"
                    @touchend="onReaderTouchEnd"
                    @touchcancel="onReaderTouchCancel"
                >
                    <div v-if="readerLoading" class="reader-feedback" role="status">
                        <ion-spinner name="crescent" />
                        <span>Preparando documento...</span>
                    </div>
                    <p v-else-if="readerError" class="reader-feedback reader-error" role="alert">
                        {{ readerError }}
                        <a v-if="isEpub && item" :href="item.download_url" target="_blank" rel="noopener noreferrer">
                            Abrir o EPUB em uma nova aba
                        </a>
                    </p>
                    <div v-else-if="isPdf && readerContinuous" ref="continuousPdfStage"
                        class="pdf-stage continuous-pdf-stage" aria-label="Documento em leitura contínua"
                        @scroll="onContinuousPdfScroll">
                        <section v-for="pageNumber in pageCount" :key="pageNumber"
                            :ref="(element) => setContinuousPageElement(element, pageNumber - 1)"
                            class="continuous-pdf-page" :data-page="pageNumber"
                            :style="{ aspectRatio: `${pdfPageRatios[pageNumber - 1] || 0.72}` }"
                            :aria-label="`Página ${pageNumber}`">
                            <canvas :ref="(element) => setContinuousCanvas(element, pageNumber - 1)" />
                        </section>
                    </div>
                    <div v-else-if="isPdf" class="pdf-stage" aria-label="Página do documento">
                        <canvas ref="pdfCanvas" />
                    </div>
                    <div v-else-if="isEpub && readerContinuous" ref="textReader"
                        class="text-reader epub-reader continuous-epub-reader"
                        :style="{ fontSize: `${readerTextZoom}rem` }"
                        aria-label="Livro em leitura contínua" @scroll="onContinuousEpubScroll">
                        <section v-for="(chapter, index) in readerChapters" :key="index"
                            class="continuous-epub-chapter" :data-page="index + 1">
                            <h3>{{ chapter.title }}</h3>
                            <p v-html="highlightText(chapter.text)" />
                        </section>
                    </div>
                    <article v-else-if="isEpub" ref="textReader" class="text-reader epub-reader"
                        :style="{ fontSize: `${readerTextZoom}rem` }"
                        aria-label="Conteúdo do capítulo" @scroll="onTextReaderScroll">
                        <h3 v-if="readerChapters[currentPage - 1]?.title">{{ readerChapters[currentPage - 1].title }}</h3>
                        <p v-html="highlightedReaderText" />
                    </article>
                    <pre v-else ref="textReader" class="text-reader" :style="{ fontSize: `${readerTextZoom}rem` }"
                        @scroll="onTextReaderScroll" v-html="highlightedReaderText" />
                </div>
            </section>
        </IonModal>
        <IonModal class="report-modal" :is-open="isReportModalOpen" @didDismiss="closeReportModal">
            <form class="report-form" @submit.prevent="submitReport">
                <header class="report-form-header">
                    <div>
                        <p class="nv-eyebrow nv-badge">AJUDE A MANTER O ACERVO SEGURO</p>
                        <h2 class="section-title">Denunciar documento</h2>
                    </div>
                    <ion-button fill="clear" type="button" aria-label="Fechar denúncia" @click="closeReportModal">
                        Fechar
                    </ion-button>
                </header>
                <p v-if="item" class="report-document-title">{{ item.title }}</p>

                <label class="report-field">
                    <span>Motivo da denúncia</span>
                    <select v-model="reportReason" required>
                        <option disabled value="">Selecione um motivo</option>
                        <option value="copyright">Violação de direitos autorais</option>
                        <option value="inappropriate">Conteúdo impróprio ou ofensivo</option>
                        <option value="spam">Spam ou conteúdo enganoso</option>
                        <option value="malware">Arquivo suspeito ou malicioso</option>
                        <option value="misinformation">Informação potencialmente prejudicial</option>
                        <option value="other">Outro motivo</option>
                    </select>
                </label>

                <label class="report-field">
                    <span>Detalhes <span class="report-optional">(opcional)</span></span>
                    <textarea
                        v-model="reportDetails"
                        maxlength="2000"
                        rows="5"
                        placeholder="Explique o problema para ajudar nossa equipe a analisar a denúncia."
                    />
                    <small>{{ reportDetails.length }}/2000</small>
                </label>

                <p class="report-privacy">
                    Sua denúncia será enviada à equipe de moderação. Seus dados serão usados apenas para análise.
                </p>
                <ion-button class="report-submit" type="submit" expand="block" :disabled="isSubmittingReport || !reportReason">
                    <ion-spinner v-if="isSubmittingReport" slot="start" name="crescent" />
                    {{ isSubmittingReport ? 'Enviando denúncia...' : 'Enviar denúncia' }}
                </ion-button>
            </form>
        </IonModal>
        <AddBookToCollectionModal
            :is-open="isCollectionPickerOpen"
            :book="item ?? emptyBook"
            @close="isCollectionPickerOpen = false"
            @saved="isSavedInCollection = $event"
        />
    </IonPage>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { IonButton, IonContent, IonIcon, IonModal, IonPage, IonSpinner, toastController } from '@ionic/vue';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import {
    addOutline,
    arrowForwardOutline,
    arrowBackOutline,
    bookmark,
    bookmarkOutline,
    bookOutline,
    calendarOutline,
    closeOutline,
    contractOutline,
    documentOutline,
    documentTextOutline,
    downloadOutline,
    ellipsisHorizontalOutline,
    eyeOffOutline,
    eyeOutline,
    expandOutline,
    flagOutline,
    languageOutline,
    listOutline,
    moonOutline,
    personCircleOutline,
    printOutline,
    removeOutline,
    searchOutline,
    sunnyOutline
} from 'ionicons/icons';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import AddBookToCollectionModal from '@/components/AddBookToCollectionModal.vue';
import { getCurrentSession, getPublicProfile } from '@/services/authService';
import {
    getMyReadingProgressPosition,
    saveReadingProgressAutomatically
} from '@/services/readingProgressService';
import type { ReadingProgressPosition } from '@/services/readingProgressService';
import {
    downloadLibraryDocument,
    getPublicLibraryItem,
    listRelatedPublicLibraryItems,
    recordLibraryItemMetric
} from '@/services/libraryService';
import { useLibraryItemsSync } from '@/composables/useLibraryItemsSync';
import { listPublicDocumentReviews } from '@/services/publicReviewService';
import { createReview, getMyReviewForDocument, updateReview } from '@/services/reviewService';
import type { MyDocumentReview } from '@/services/reviewService';
import { submitDocumentReport, type DocumentReportReason } from '@/services/documentReportService';
import type { PublicDocumentReview } from '@/services/publicReviewService';
import type { PublicLibraryItem, PublicLibraryItemDetails } from '@/types/library';
import { getFileExtension } from '@/utils/getFileExtension';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const route = useRoute();
const router = useRouter();
const item = ref<PublicLibraryItemDetails | null>(null);
const reviews = ref<PublicDocumentReview[]>([]);
const myReview = ref<MyDocumentReview | null>(null);
const relatedItems = ref<PublicLibraryItem[]>([]);
const reviewsError = ref('');
const reviewLoadError = ref('');
const reviewSubmitError = ref('');
const reviewUserId = ref('');
const reviewRating = ref(5);
const reviewComment = ref('');
const reviewLoading = ref(true);
const savingReview = ref(false);
const relatedError = ref('');
const uploaderName = ref('');
const loading = ref(true);
const errorMessage = ref('');
const isDownloading = ref(false);
const isCollectionPickerOpen = ref(false);
const isSavedInCollection = ref(false);
const emptyBook = { id: '', title: '' };
const isDescriptionExpanded = ref(false);
const isDescriptionLong = computed(() => (item.value?.description?.length ?? 0) > 240);
const isReportModalOpen = ref(false);
const isSubmittingReport = ref(false);
const reportReason = ref<DocumentReportReason | ''>('');
const reportDetails = ref('');
const isReaderOpen = ref(false);
const readerControlsVisible = ref(true);
const readerLoading = ref(false);
const readerError = ref('');
const readerText = ref('');
const textReader = ref<HTMLElement | null>(null);
const readingProgressError = ref('');
const readerChapters = ref<{ title: string; text: string }[]>([]);
const currentPage = ref(1);
const pageCount = ref(0);
const zoom = ref(1);
const readerTextZoom = ref(1);
const readerContinuous = ref(false);
const savedReaderPercent = ref(0);
const readerTheme = ref<'light' | 'sepia' | 'dark'>('light');
const pdfFitMode = ref<'width' | 'page' | 'manual'>('width');
const activeReaderPanel = ref<'actions' | 'search' | 'contents' | 'settings' | null>(null);
const readerSearchQuery = ref('');
const readerSearchResults = ref<{ page: number; title: string }[]>([]);
const readerSearchMessage = ref('');
const readerSearching = ref(false);
const readerContents = ref<{ title: string; page: number; level: number }[]>([]);
const bookmarkedPage = ref(0);
const isFullscreen = ref(false);
const pdfCanvas = ref<HTMLCanvasElement | null>(null);
const continuousPdfStage = ref<HTMLElement | null>(null);
const continuousPdfPageElements: (HTMLElement | null)[] = [];
const continuousPdfCanvases: (HTMLCanvasElement | null)[] = [];
const pdfPageRatios = ref<number[]>([]);
const pdfDocument = shallowRef<pdfjsLib.PDFDocumentProxy | null>(null);
const pdfLoadingTask = shallowRef<pdfjsLib.PDFDocumentLoadingTask | null>(null);
const readerPdfBlob = shallowRef<Blob | null>(null);
const activeRenderTask = shallowRef<pdfjsLib.RenderTask | null>(null);
let readerRequestId = 0;
let pageRenderId = 0;
let readingProgressQueue = Promise.resolve();
let textProgressTimer: number | undefined;
let readerControlsTimer: number | undefined;
let touchStartX = 0;
let touchStartY = 0;
let touchStartDistance = 0;
let touchStartZoom = 1;
let touchGesture: 'swipe' | 'pinch' | null = null;
let suppressReaderClick = false;
let continuousPdfObserver: IntersectionObserver | undefined;
const visibleContinuousPdfPages = new Set<number>();
const renderingContinuousPdfPages = new Set<number>();
type ReaderPanel = 'actions' | 'search' | 'contents' | 'settings';
type ReaderContentsEntry = { title: string; page: number; level: number };
const averageRating = computed(() => reviews.value.reduce((total, review) => total + review.rating, 0) / reviews.value.length);
const fileExtension = computed(() => getFileExtension(item.value?.file_name ?? '').toLowerCase());
const isPdf = computed(() => fileExtension.value === 'pdf');
const isEpub = computed(() => fileExtension.value === 'epub');
const highlightedReaderText = computed(() => {
    return highlightText(readerText.value);
});

const highlightText = (value: string) => {
    const escapeHtml = (text: string) => text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const source = escapeHtml(value);
    const query = readerSearchQuery.value.trim();
    if (!query) return source;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return source.replace(new RegExp(`(${escapedQuery})`, 'gi'), '<mark>$1</mark>');
};

const getEpubFilePath = (href: string, basePath: string): string => {
    const resolvedPath = new URL(href, `https://epub-reader.invalid/${basePath}`);
    if (resolvedPath.origin !== 'https://epub-reader.invalid') {
        throw new Error('O EPUB referencia um arquivo fora do pacote.');
    }

    return decodeURIComponent(resolvedPath.pathname.slice(1));
};

const getEpubText = (source: string): { title: string; text: string } => {
    const chapterDocument = new DOMParser().parseFromString(source, 'text/html');
    const title = chapterDocument.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim() ?? '';
    const blockTags = new Set(['ADDRESS', 'ARTICLE', 'BLOCKQUOTE', 'DD', 'DIV', 'DL', 'DT', 'FIGCAPTION', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'OL', 'P', 'SECTION', 'TABLE', 'TR', 'UL']);
    const ignoredTags = new Set(['HEAD', 'NAV', 'SCRIPT', 'STYLE', 'SVG']);
    let text = '';

    const visit = (node: Node): void => {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent ?? '';
            return;
        }

        if (!(node instanceof Element) || ignoredTags.has(node.tagName)) return;
        if (node.tagName === 'BR') {
            text += '\n';
            return;
        }
        const isBlock = blockTags.has(node.tagName);
        if (isBlock) text += '\n';
        node.childNodes.forEach(visit);
        if (isBlock) text += '\n';
    };

    visit(chapterDocument.body);
    return {
        title,
        text: text
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n[ \t]+/g, '\n')
            .replace(/[ \t]{2,}/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
    };
};

const loadEpubChapters = async (file: Blob): Promise<{ title: string; text: string }[]> => {
    const archive = await JSZip.loadAsync(file);
    const containerFile = archive.file('META-INF/container.xml');
    if (!containerFile) throw new Error('O EPUB não contém o arquivo de navegação obrigatório.');

    const containerDocument = new DOMParser().parseFromString(await containerFile.async('text'), 'application/xml');
    if (containerDocument.querySelector('parsererror')) throw new Error('O índice do EPUB é inválido.');
    const packagePath = containerDocument.getElementsByTagNameNS('*', 'rootfile')[0]?.getAttribute('full-path');
    if (!packagePath) throw new Error('Não foi possível localizar o conteúdo do EPUB.');

    const packageFile = archive.file(packagePath);
    if (!packageFile) throw new Error('O pacote de conteúdo do EPUB não foi encontrado.');
    const packageDocument = new DOMParser().parseFromString(await packageFile.async('text'), 'application/xml');
    if (packageDocument.querySelector('parsererror')) throw new Error('O pacote de conteúdo do EPUB é inválido.');

    const manifest = new Map<string, string>();
    Array.from(packageDocument.getElementsByTagNameNS('*', 'item')).forEach((entry) => {
        const id = entry.getAttribute('id');
        const href = entry.getAttribute('href');
        const mediaType = entry.getAttribute('media-type');
        if (id && href && (!mediaType || /application\/xhtml\+xml|text\/html/.test(mediaType))) {
            manifest.set(id, href);
        }
    });

    const packageDirectory = packagePath.slice(0, packagePath.lastIndexOf('/') + 1);
    const spineEntries = Array.from(packageDocument.getElementsByTagNameNS('*', 'itemref'))
        .filter((entry) => entry.getAttribute('linear') !== 'no')
        .map((entry) => manifest.get(entry.getAttribute('idref') ?? ''))
        .filter((href): href is string => Boolean(href));

    const chapters = await Promise.all(spineEntries.map(async (href, index) => {
        const chapterPath = getEpubFilePath(href, `${packageDirectory}content.opf`);
        const chapterFile = archive.file(chapterPath);
        if (!chapterFile) throw new Error(`O capítulo ${index + 1} não foi encontrado no EPUB.`);
        const chapter = getEpubText(await chapterFile.async('text'));
        return {
            title: chapter.title || `Capítulo ${index + 1}`,
            text: chapter.text
        };
    }));

    const readableChapters = chapters.filter((chapter) => chapter.text);
    if (!readableChapters.length) throw new Error('Este EPUB não possui capítulos com texto legível.');
    return readableChapters;
};

const clearReaderDocument = () => {
    pageRenderId += 1;
    activeRenderTask.value?.cancel();
    activeRenderTask.value = null;
    void pdfLoadingTask.value?.destroy();
    pdfLoadingTask.value = null;
    pdfDocument.value = null;
};

const renderPdfPage = async () => {
    const document = pdfDocument.value;
    const canvas = pdfCanvas.value;
    if (!document || !canvas) return;

    activeRenderTask.value?.cancel();
    activeRenderTask.value = null;
    const renderId = ++pageRenderId;
    try {
        const page = await document.getPage(currentPage.value);
        if (renderId !== pageRenderId || document !== pdfDocument.value || !pdfCanvas.value) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const stage = pdfCanvas.value.parentElement;
        const availableWidth = Math.max((stage?.clientWidth ?? 320) - 32, 240);
        const availableHeight = Math.max((stage?.clientHeight ?? 480) - 32, 240);
        const widthScale = availableWidth / baseViewport.width;
        const pageScale = Math.min(widthScale, availableHeight / baseViewport.height);
        const scale = pdfFitMode.value === 'page'
            ? pageScale * zoom.value
            : pdfFitMode.value === 'width'
                ? widthScale * zoom.value
                : Math.min(widthScale, 1.4) * zoom.value;
        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const context = canvas.getContext('2d');
        if (!context) throw new Error('Não foi possível preparar a visualização da página.');

        const task = page.render({
            canvas,
            canvasContext: context,
            viewport,
            transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0]
        });
        activeRenderTask.value = task;
        await task.promise;
        if (activeRenderTask.value === task) activeRenderTask.value = null;
        if (renderId === pageRenderId) saveCurrentPageProgress();
    } catch (error) {
        if (error instanceof Error && error.name === 'RenderingCancelledException') return;
        if (renderId === pageRenderId) {
            readerError.value = error instanceof Error
                ? `Não foi possível exibir esta página: ${error.message}`
                : 'Não foi possível exibir esta página.';
        }
    }
};

const setContinuousPageElement = (element: unknown, index: number) => {
    continuousPdfPageElements[index] = element instanceof HTMLElement ? element : null;
};

const setContinuousCanvas = (element: unknown, index: number) => {
    continuousPdfCanvases[index] = element instanceof HTMLCanvasElement ? element : null;
};

const renderContinuousPdfPage = async (pageNumber: number) => {
    const document = pdfDocument.value;
    const canvas = continuousPdfCanvases[pageNumber - 1];
    const stage = continuousPdfStage.value;
    if (!document || !canvas || !stage || renderingContinuousPdfPages.has(pageNumber)) return;

    renderingContinuousPdfPages.add(pageNumber);
    try {
        const page = await document.getPage(pageNumber);
        if (document !== pdfDocument.value || !readerContinuous.value) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(stage.clientWidth - 32, 240);
        const widthScale = Math.min(availableWidth / baseViewport.width, 1.4);
        const availableHeight = Math.max(stage.clientHeight - 32, 240);
        const scale = (pdfFitMode.value === 'page'
            ? Math.min(widthScale, availableHeight / baseViewport.height)
            : widthScale) * zoom.value;
        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Não foi possível preparar a visualização da página.');
        await page.render({
            canvas,
            canvasContext: context,
            viewport,
            transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0]
        }).promise;
        if (document === pdfDocument.value && !visibleContinuousPdfPages.has(pageNumber)) {
            canvas.width = 0;
            canvas.height = 0;
        }
    } catch (error) {
        if (document === pdfDocument.value) {
            readerError.value = error instanceof Error
                ? `Não foi possível exibir a página ${pageNumber}: ${error.message}`
                : `Não foi possível exibir a página ${pageNumber}.`;
        }
    } finally {
        renderingContinuousPdfPages.delete(pageNumber);
    }
};

const observeContinuousPdfPages = () => {
    continuousPdfObserver?.disconnect();
    const stage = continuousPdfStage.value;
    if (!stage) return;
    continuousPdfObserver = new IntersectionObserver((entries) => {
        const visibleEntries = entries
            .filter((entry) => entry.isIntersecting)
            .sort((first, second) => second.intersectionRatio - first.intersectionRatio);
        const current = visibleEntries[0]?.target;
        if (current instanceof HTMLElement) {
            const pageNumber = Number(current.dataset.page);
            if (Number.isInteger(pageNumber) && pageNumber !== currentPage.value) {
                currentPage.value = pageNumber;
                saveCurrentPageProgress();
            }
        }

        entries.forEach((entry) => {
            if (!(entry.target instanceof HTMLElement)) return;
            const pageNumber = Number(entry.target.dataset.page);
            const canvas = continuousPdfCanvases[pageNumber - 1];
            if (!Number.isInteger(pageNumber) || !canvas) return;
            if (entry.isIntersecting) {
                visibleContinuousPdfPages.add(pageNumber);
                void renderContinuousPdfPage(pageNumber);
            } else {
                visibleContinuousPdfPages.delete(pageNumber);
                if (!renderingContinuousPdfPages.has(pageNumber)) {
                    canvas.width = 0;
                    canvas.height = 0;
                }
            }
        });
    }, { root: stage, rootMargin: '120% 0px', threshold: 0.01 });
    continuousPdfPageElements.forEach((element) => {
        if (element) continuousPdfObserver?.observe(element);
    });
};

const scrollToContinuousPage = (pageNumber: number) => {
    const container = isPdf.value ? continuousPdfStage.value : textReader.value;
    const page = isPdf.value
        ? continuousPdfPageElements[pageNumber - 1]
        : textReader.value?.querySelector<HTMLElement>(`[data-page="${pageNumber}"]`);
    if (container && page) {
        const top = container.scrollTop + page.getBoundingClientRect().top - container.getBoundingClientRect().top;
        container.scrollTo({ top, behavior: 'smooth' });
    }
};

const toggleContinuousReading = async () => {
    readerContinuous.value = !readerContinuous.value;
    activeReaderPanel.value = null;
    if (isPdf.value) {
        continuousPdfObserver?.disconnect();
        continuousPdfObserver = undefined;
        visibleContinuousPdfPages.clear();
        if (readerContinuous.value && pdfDocument.value) {
            const pdf = pdfDocument.value;
            pdfPageRatios.value = [];
            for (let pageNumber = 1; pageNumber <= pageCount.value; pageNumber += 1) {
                if (!readerContinuous.value || pdf !== pdfDocument.value) return;
                const page = await pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale: 1 });
                pdfPageRatios.value.push(viewport.width / viewport.height);
            }
            await nextTick();
            observeContinuousPdfPages();
            scrollToContinuousPage(currentPage.value);
        } else {
            pdfPageRatios.value = [];
            continuousPdfCanvases.forEach((canvas) => {
                if (canvas) {
                    canvas.width = 0;
                    canvas.height = 0;
                }
            });
            await nextTick();
            await renderPdfPage();
        }
    } else if (isEpub.value && readerContinuous.value) {
        await nextTick();
        const container = textReader.value;
        if (container) {
            const maxScroll = container.scrollHeight - container.clientHeight;
            container.scrollTop = maxScroll * Math.min(100, Math.max(0, savedReaderPercent.value)) / 100;
        }
    }
};

const openReader = async () => {
    if (!item.value) return;
    isReaderOpen.value = true;
    showReaderControls();
    readerLoading.value = true;
    readerError.value = '';
    readingProgressError.value = '';
    readerText.value = '';
    readerChapters.value = [];
    currentPage.value = 1;
    pageCount.value = 0;
    zoom.value = 1;
    pdfFitMode.value = 'width';
    readerContinuous.value = false;
    readerTextZoom.value = 1;
    activeReaderPanel.value = null;
    savedReaderPercent.value = 0;
    readerSearchResults.value = [];
    readerSearchMessage.value = '';
    readerContents.value = [];
    readerPdfBlob.value = null;
    bookmarkedPage.value = 0;
    try {
        const savedBookmark = localStorage.getItem(`nexusvault:reader-bookmark:${item.value.id}`);
        const parsedBookmark = savedBookmark ? Number(savedBookmark) : 0;
        bookmarkedPage.value = Number.isSafeInteger(parsedBookmark) && parsedBookmark > 0
            ? parsedBookmark
            : 0;
    } catch (error) {
        console.warn('Não foi possível carregar o marcador de leitura.', error);
    }
    clearReaderDocument();
    const requestId = ++readerRequestId;
    let savedPosition: ReadingProgressPosition | null = null;

    try {
        try {
            savedPosition = await getMyReadingProgressPosition(item.value.id);
            savedReaderPercent.value = savedPosition?.percent ?? 0;
        } catch (error) {
            console.error('Não foi possível carregar o progresso de leitura.', error);
            readingProgressError.value = 'Não foi possível recuperar seu progresso salvo.';
        }
        if (requestId !== readerRequestId) return;

        const file = await downloadLibraryDocument(item.value.file_path);
        if (requestId !== readerRequestId) return;
        readerPdfBlob.value = file;

        if (isEpub.value) {
            readerChapters.value = await loadEpubChapters(file);
            if (requestId !== readerRequestId) return;
            pageCount.value = readerChapters.value.length;
            readerContents.value = readerChapters.value.map((chapter, index) => ({
                title: chapter.title,
                page: index + 1,
                level: 0
            }));
            currentPage.value = savedPosition
                ? Math.min(pageCount.value, Math.max(1, savedPosition.page))
                : 1;
            readerText.value = readerChapters.value[currentPage.value - 1]?.text ?? '';
        } else if (isPdf.value) {
            const loadingTask = pdfjsLib.getDocument({ data: await file.arrayBuffer() });
            pdfLoadingTask.value = loadingTask;
            const document = await loadingTask.promise;
            if (requestId !== readerRequestId) {
                await loadingTask.destroy();
                return;
            }
            pdfDocument.value = document;
            pageCount.value = document.numPages;
            readerContents.value = await getPdfContents(document);
            if (requestId !== readerRequestId) return;
            currentPage.value = savedPosition
                ? Math.min(pageCount.value, Math.max(1, savedPosition.page))
                : 1;
        } else if (fileExtension.value === 'txt' || fileExtension.value === 'md') {
            readerText.value = await file.text();
        } else {
            readerError.value = 'Este formato não pode ser exibido no leitor integrado. Baixe o arquivo para abri-lo no seu dispositivo.';
        }
        if (pageCount.value && bookmarkedPage.value > pageCount.value) {
            bookmarkedPage.value = 0;
        }
    } catch (error) {
        if (requestId !== readerRequestId) return;
        readerError.value = error instanceof Error
            ? `Não foi possível carregar o documento: ${error.message}`
            : 'Não foi possível carregar o documento.';
    } finally {
        if (requestId === readerRequestId) {
            readerLoading.value = false;
            await nextTick();
            if (requestId === readerRequestId && !readerError.value) {
                if (isPdf.value) {
                    await renderPdfPage();
                } else if (isEpub.value) {
                    const chapterPercent = savedPosition
                        ? Math.min(100, Math.max(0, (savedPosition.percent / 100 * pageCount.value - (currentPage.value - 1)) * 100))
                        : 0;
                    restoreTextPosition(chapterPercent);
                    saveCurrentPageProgress();
                    if (savedPosition) savedReaderPercent.value = savedPosition.percent;
                } else if (fileExtension.value === 'txt' || fileExtension.value === 'md') {
                    restoreTextPosition(savedPosition?.percent ?? 0);
                    saveTextProgress();
                }
            }
        }
    }
};

const closeReader = () => {
    if (readerControlsTimer !== undefined) {
        window.clearTimeout(readerControlsTimer);
        readerControlsTimer = undefined;
    }
    if (textProgressTimer !== undefined) {
        window.clearTimeout(textProgressTimer);
        textProgressTimer = undefined;
        if (readerContinuous.value && isEpub.value) {
            saveContinuousEpubProgress();
        } else {
            saveTextProgress();
        }
    }
    isReaderOpen.value = false;
    if (document.fullscreenElement) {
        void document.exitFullscreen().catch((error: unknown) => {
            console.warn('Não foi possível sair da tela cheia ao fechar o leitor.', error);
        });
    }
    readerRequestId += 1;
    readerLoading.value = false;
    readerChapters.value = [];
    continuousPdfObserver?.disconnect();
    continuousPdfObserver = undefined;
    visibleContinuousPdfPages.clear();
    renderingContinuousPdfPages.clear();
    continuousPdfPageElements.length = 0;
    continuousPdfCanvases.length = 0;
    pdfPageRatios.value = [];
    readerContinuous.value = false;
    readerPdfBlob.value = null;
    activeReaderPanel.value = null;
    readerControlsVisible.value = true;
    clearReaderDocument();
};

onMounted(() => document.addEventListener('fullscreenchange', onFullscreenChange));
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onFullscreenChange));

const isMobileReader = () => window.matchMedia('(max-width: 700px)').matches;

const showReaderControls = () => {
    readerControlsVisible.value = true;
    if (readerControlsTimer !== undefined) {
        window.clearTimeout(readerControlsTimer);
        readerControlsTimer = undefined;
    }
};

const toggleReaderControls = () => {
    readerControlsVisible.value = !readerControlsVisible.value;
    if (!readerControlsVisible.value) activeReaderPanel.value = null;
    if (readerControlsTimer !== undefined) {
        window.clearTimeout(readerControlsTimer);
        readerControlsTimer = undefined;
    }
};

const onReaderBodyClick = () => {
    if (!isMobileReader()) return;
    if (suppressReaderClick) {
        suppressReaderClick = false;
        return;
    }
    if (readerControlsVisible.value) {
        readerControlsVisible.value = false;
        if (readerControlsTimer !== undefined) {
            window.clearTimeout(readerControlsTimer);
            readerControlsTimer = undefined;
        }
        return;
    }
    showReaderControls();
};

const preventReaderClickAfterGesture = () => {
    suppressReaderClick = true;
    window.setTimeout(() => {
        suppressReaderClick = false;
    }, 500);
};

const getTouchDistance = (touches: TouchList) => {
    const [first, second] = [touches[0], touches[1]];
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
};

const onReaderTouchStart = (event: TouchEvent) => {
    if (!isMobileReader()) return;
    if (event.touches.length >= 2) {
        touchGesture = 'pinch';
        touchStartDistance = getTouchDistance(event.touches);
        touchStartZoom = isPdf.value ? zoom.value : readerTextZoom.value;
        return;
    }
    if (event.touches.length === 1) {
        touchGesture = 'swipe';
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
};

const onReaderTouchMove = (event: TouchEvent) => {
    if (touchGesture !== 'pinch' || event.touches.length < 2 || touchStartDistance === 0) return;
    event.preventDefault();
    const nextZoom = Math.min(2.4, Math.max(0.7, touchStartZoom * getTouchDistance(event.touches) / touchStartDistance));
    const currentZoom = isPdf.value ? zoom.value : readerTextZoom.value;
    if (Math.abs(nextZoom - currentZoom) >= 0.1) {
        const roundedZoom = Math.round(nextZoom * 10) / 10;
        if (isPdf.value) {
            zoom.value = roundedZoom;
            void renderPdfPage();
        } else {
            readerTextZoom.value = roundedZoom;
        }
    }
};

const onReaderTouchEnd = (event: TouchEvent) => {
    if (!isMobileReader()) return;
    if (touchGesture === 'pinch') {
        if (event.touches.length === 0) {
            touchGesture = null;
            preventReaderClickAfterGesture();
            showReaderControls();
        }
        return;
    }
    if (touchGesture !== 'swipe' || event.changedTouches.length === 0) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    touchGesture = null;
    if (
        (!isPdf.value && !isEpub.value) ||
        readerContinuous.value ||
        Math.abs(deltaX) < 55 ||
        Math.abs(deltaX) < Math.abs(deltaY) * 1.2
    ) return;

    preventReaderClickAfterGesture();
    changePage(deltaX < 0 ? 1 : -1);
    showReaderControls();
};

const onReaderTouchCancel = () => {
    touchGesture = null;
};

const toggleReaderPanel = (panel: ReaderPanel) => {
    activeReaderPanel.value = activeReaderPanel.value === panel ? null : panel;
    showReaderControls();
};

const setPdfFitMode = (mode: 'width' | 'page') => {
    pdfFitMode.value = mode;
    zoom.value = 1;
    activeReaderPanel.value = null;
    if (readerContinuous.value) {
        continuousPdfCanvases.forEach((canvas) => {
            if (canvas) {
                canvas.width = 0;
                canvas.height = 0;
            }
        });
        observeContinuousPdfPages();
    } else {
        void renderPdfPage();
    }
};

const getPdfContents = async (document: pdfjsLib.PDFDocumentProxy): Promise<ReaderContentsEntry[]> => {
    let outline: Awaited<ReturnType<pdfjsLib.PDFDocumentProxy['getOutline']>>;
    try {
        outline = await document.getOutline();
    } catch (error) {
        console.warn('Não foi possível carregar o sumário do PDF.', error);
        return [];
    }
    if (!outline?.length) return [];

    const contents: ReaderContentsEntry[] = [];
    const visit = async (
        entries: NonNullable<Awaited<ReturnType<pdfjsLib.PDFDocumentProxy['getOutline']>>>,
        level: number
    ): Promise<void> => {
        for (const entry of entries) {
            if (entry.title && entry.dest) {
                const destination = typeof entry.dest === 'string'
                    ? await document.getDestination(entry.dest)
                    : entry.dest;
                const pageReference = destination?.[0];
                if (pageReference) {
                    try {
                        const pageIndex = await document.getPageIndex(pageReference);
                        contents.push({ title: entry.title, page: pageIndex + 1, level });
                    } catch (error) {
                        console.warn('Não foi possível resolver um item do sumário do PDF.', error);
                    }
                }
            }
            if (entry.items.length) await visit(entry.items, level + 1);
        }
    };

    await visit(outline, 0);
    return contents;
};

const goToPageNumber = (page: number, keepPanelOpen = false) => {
    if (!keepPanelOpen) activeReaderPanel.value = null;
    if (readerContinuous.value) {
        const targetPage = Math.min(pageCount.value, Math.max(1, page));
        currentPage.value = targetPage;
        scrollToContinuousPage(targetPage);
        showReaderControls();
        return;
    }
    changePage(page - currentPage.value);
    showReaderControls();
};

const searchDocument = async () => {
    const query = readerSearchQuery.value.trim().toLocaleLowerCase();
    if (!query || readerSearching.value) return;

    readerSearching.value = true;
    readerSearchResults.value = [];
    readerSearchMessage.value = '';
    const requestId = readerRequestId;
    try {
        if (isPdf.value && pdfDocument.value) {
            for (let pageNumber = 1; pageNumber <= pageCount.value; pageNumber += 1) {
                if (requestId !== readerRequestId) return;
                const page = await pdfDocument.value.getPage(pageNumber);
                const content = await page.getTextContent();
                const text = content.items
                    .filter((entry): entry is typeof entry & { str: string } =>
                        'str' in entry && typeof entry.str === 'string'
                    )
                    .map((entry) => entry.str)
                    .join(' ')
                    .toLocaleLowerCase();
                if (text.includes(query)) {
                    readerSearchResults.value.push({ page: pageNumber, title: `Página ${pageNumber}` });
                }
            }
        } else if (isEpub.value) {
            readerChapters.value.forEach((chapter, index) => {
                if (chapter.text.toLocaleLowerCase().includes(query)) {
                    readerSearchResults.value.push({
                        page: index + 1,
                        title: chapter.title || `Capítulo ${index + 1}`
                    });
                }
            });
        } else if (readerText.value.toLocaleLowerCase().includes(query)) {
            readerSearchResults.value.push({ page: 1, title: 'Documento' });
        }

        readerSearchMessage.value = readerSearchResults.value.length
            ? `${readerSearchResults.value.length} ${readerSearchResults.value.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}.`
            : 'Nenhum resultado encontrado.';
        if (readerSearchResults.value[0] && (isPdf.value || isEpub.value)) {
            goToPageNumber(readerSearchResults.value[0].page, true);
        }
        if (!isPdf.value) {
            await nextTick();
            textReader.value?.querySelector('mark')?.scrollIntoView({ block: 'center' });
        }
    } catch (error) {
        console.error('Não foi possível pesquisar no documento.', error);
        readerSearchMessage.value = error instanceof Error
            ? `Não foi possível pesquisar: ${error.message}`
            : 'Não foi possível pesquisar no documento.';
    } finally {
        readerSearching.value = false;
    }
};

const toggleBookmark = async () => {
    if (!item.value) return;
    const key = `nexusvault:reader-bookmark:${item.value.id}`;
    try {
        if (bookmarkedPage.value === currentPage.value) {
            localStorage.removeItem(key);
            bookmarkedPage.value = 0;
            return;
        }
        localStorage.setItem(key, String(currentPage.value));
        bookmarkedPage.value = currentPage.value;
    } catch (error) {
        console.error('Não foi possível salvar o marcador de leitura.', error);
        const toast = await toastController.create({
            message: 'Não foi possível salvar o marcador neste dispositivo.',
            duration: 3000,
            color: 'warning',
            position: 'bottom'
        });
        await toast.present();
    }
};

const toggleFullscreen = async () => {
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await document.documentElement.requestFullscreen();
        }
    } catch (error) {
        console.error('Não foi possível alternar para tela cheia.', error);
        const toast = await toastController.create({
            message: 'Não foi possível ativar a tela cheia neste navegador.',
            duration: 3000,
            color: 'warning',
            position: 'bottom'
        });
        await toast.present();
    }
};

const onFullscreenChange = () => {
    isFullscreen.value = Boolean(document.fullscreenElement);
};

const openDocumentForPrint = () => {
    if (!item.value || !readerPdfBlob.value) return;
    const documentUrl = URL.createObjectURL(readerPdfBlob.value);
    const link = document.createElement('a');
    link.href = documentUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(documentUrl), 60_000);
};

const changePage = (amount: number) => {
    const nextPage = Math.min(pageCount.value, Math.max(1, currentPage.value + amount));
    if (nextPage === currentPage.value) return;
    currentPage.value = nextPage;
    if (isMobileReader()) showReaderControls();
    if (readerContinuous.value) {
        scrollToContinuousPage(nextPage);
        saveCurrentPageProgress();
        return;
    }
    if (isPdf.value) void renderPdfPage();
    if (isEpub.value) {
        readerText.value = readerChapters.value[currentPage.value - 1]?.text ?? '';
        void nextTick(() => {
            if (textReader.value) textReader.value.scrollTop = 0;
            saveCurrentPageProgress();
        });
    }
};

const goToPage = (event: Event) => {
    if (!(event.target instanceof HTMLInputElement)) return;

    const requestedPage = Number(event.target.value);
    if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > pageCount.value) {
        event.target.value = String(currentPage.value);
        return;
    }

    changePage(requestedPage - currentPage.value);
};

const queueReadingProgress = (page: number, percent: number) => {
    const documentId = item.value?.id;
    if (!documentId) return;

    readingProgressError.value = '';
    readingProgressQueue = readingProgressQueue
        .then(() => saveReadingProgressAutomatically(documentId, page, percent))
        .then(() => undefined)
        .catch((error: unknown) => {
            console.error('Não foi possível salvar o progresso de leitura.', error);
            const errorRecord = error && typeof error === 'object'
                ? error as { code?: unknown; message?: unknown }
                : {};
            const errorCode = typeof errorRecord.code === 'string' ? errorRecord.code : '';
            const errMsg = typeof errorRecord.message === 'string' ? errorRecord.message : '';

            if (item.value?.id !== documentId) return;

            if (
                errorCode === '42P01' ||
                errorCode === 'PGRST205'
            ) {
                readingProgressError.value = 'O progresso de leitura não está configurado no banco. Aplique as migrations do Supabase.';
                return;
            }

            if (errorCode === '23503') {
                readingProgressError.value = 'A referência do livro no banco está desatualizada. Aplique as migrations mais recentes do Supabase.';
                return;
            }

            if (
                errorCode === '42501' ||
                errMsg.toLowerCase().includes('permission denied') ||
                errMsg.toLowerCase().includes('row-level security') ||
                errMsg.toLowerCase().includes('row level security') ||
                errMsg.toLowerCase().includes('new row violates') ||
                errMsg.toLowerCase().includes('rls')
            ) {
                readingProgressError.value = 'Permissão de leitura não configurada. Contate o administrador.';
                return;
            }

            readingProgressError.value = 'Não foi possível salvar seu progresso de leitura.';
        });
};

const saveCurrentPageProgress = () => {
    if (!pageCount.value || (!isPdf.value && !isEpub.value)) return;
    const percent = Math.round((currentPage.value / pageCount.value) * 10000) / 100;
    savedReaderPercent.value = percent;
    queueReadingProgress(currentPage.value, percent);
};

const getTextProgressPercent = () => {
    const element = textReader.value;
    if (!element) return 0;
    const maxScroll = element.scrollHeight - element.clientHeight;
    if (maxScroll <= 0) return 100;
    return Math.round((element.scrollTop / maxScroll) * 10000) / 100;
};

const saveTextProgress = () => {
    if (isEpub.value && pageCount.value > 0) {
        const percent = ((currentPage.value - 1 + getTextProgressPercent() / 100) / pageCount.value) * 100;
        queueReadingProgress(currentPage.value, percent);
        return;
    }
    queueReadingProgress(0, getTextProgressPercent());
};

const restoreTextPosition = (percent: number) => {
    if (!textReader.value) return;
    const maxScroll = textReader.value.scrollHeight - textReader.value.clientHeight;
    textReader.value.scrollTop = maxScroll > 0
        ? maxScroll * Math.min(100, Math.max(0, percent)) / 100
        : 0;
};

const onTextReaderScroll = () => {
    if (textProgressTimer !== undefined) window.clearTimeout(textProgressTimer);
    textProgressTimer = window.setTimeout(() => {
        textProgressTimer = undefined;
        saveTextProgress();
    }, 500);
};

const onContinuousEpubScroll = () => {
    const container = textReader.value;
    if (!container || !pageCount.value) return;
    const marker = container.getBoundingClientRect().top + container.clientHeight * 0.3;
    const containerTop = container.getBoundingClientRect().top;
    const chapters = Array.from(container.querySelectorAll<HTMLElement>('.continuous-epub-chapter'));
    let visiblePage = 1;
    chapters.forEach((chapter, index) => {
        if (chapter.getBoundingClientRect().top <= marker && chapter.getBoundingClientRect().bottom > containerTop) {
            visiblePage = index + 1;
        }
    });
    if (visiblePage !== currentPage.value) currentPage.value = visiblePage;
    if (textProgressTimer !== undefined) window.clearTimeout(textProgressTimer);
    textProgressTimer = window.setTimeout(() => {
        textProgressTimer = undefined;
        saveContinuousEpubProgress();
    }, 500);
};

const saveContinuousEpubProgress = () => {
    const container = textReader.value;
    if (!container) return;
    const maxScroll = container.scrollHeight - container.clientHeight;
    savedReaderPercent.value = maxScroll > 0
        ? Math.min(100, Math.max(0, (container.scrollTop / maxScroll) * 100))
        : 100;
    queueReadingProgress(currentPage.value, savedReaderPercent.value);
};

const onContinuousPdfScroll = () => {
    const stage = continuousPdfStage.value;
    if (!stage) return;
    const markerY = stage.getBoundingClientRect().top + stage.clientHeight * 0.3;
    const page = document.elementFromPoint(
        stage.getBoundingClientRect().left + stage.clientWidth / 2,
        markerY
    )?.closest<HTMLElement>('.continuous-pdf-page');
    const pageNumber = Number(page?.dataset.page);
    if (Number.isInteger(pageNumber) && pageNumber > 0 && pageNumber !== currentPage.value) {
        currentPage.value = pageNumber;
        saveCurrentPageProgress();
    }
};

const changeZoom = (amount: number) => {
    pdfFitMode.value = 'manual';
    zoom.value = Math.min(2.4, Math.max(0.7, Math.round((zoom.value + amount) * 10) / 10));
    if (isMobileReader()) showReaderControls();
    if (readerContinuous.value && isPdf.value) {
        continuousPdfCanvases.forEach((canvas) => {
            if (canvas) {
                canvas.width = 0;
                canvas.height = 0;
            }
        });
        observeContinuousPdfPages();
    } else {
        void renderPdfPage();
    }
};

watch(
    () => route.params.id,
    () => {
        closeReader();
        isDescriptionExpanded.value = false;
    }
);

onBeforeUnmount(closeReader);

const starRating = (rating: number): string =>
    `${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}`;

const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) {
        return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(size / 1024)} KB`;
    }
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(size / (1024 * 1024))} MB`;
};

const formatDate = (date: string): string =>
    new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(date));

const downloadDocument = async () => {
    if (!item.value || isDownloading.value) return;

    const itemToDownload = item.value;
    isDownloading.value = true;
    try {
        const file = await downloadLibraryDocument(itemToDownload.file_path);
        const fileUrl = URL.createObjectURL(file);
        const downloadLink = document.createElement('a');
        downloadLink.href = fileUrl;
        downloadLink.download = itemToDownload.file_name;
        document.body.append(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
        void recordLibraryItemMetric(itemToDownload.id, 'downloads').catch((metricError: unknown) => {
            console.error('Não foi possível registrar o download do documento.', metricError);
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido.';
        const toast = await toastController.create({
            message: `Não foi possível baixar o documento: ${message}`,
            duration: 3500,
            color: 'danger',
            position: 'bottom'
        });
        await toast.present();
    } finally {
        isDownloading.value = false;
    }
};

const openReportModal = async () => {
    const { data: { session }, error } = await getCurrentSession();
    if (error) {
        await showToast(`Não foi possível verificar sua sessão: ${error.message}`, 'danger');
        return;
    }
    if (!session?.user) {
        await router.push({ name: 'Auth', query: { redirect: route.fullPath } });
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

const showToast = async (message: string, color: 'success' | 'danger' | 'warning') => {
    const toast = await toastController.create({
        message,
        duration: 3500,
        color,
        position: 'bottom'
    });
    await toast.present();
};

const submitReport = async () => {
    if (!item.value || !reportReason.value || isSubmittingReport.value) return;

    isSubmittingReport.value = true;
    try {
        await submitDocumentReport({
            documentId: item.value.id,
            reason: reportReason.value,
            details: reportDetails.value
        });
        isReportModalOpen.value = false;
        await showToast('Denúncia enviada. Obrigado por ajudar a comunidade.', 'success');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível enviar a denúncia.';
        await showToast(message, 'danger');
    } finally {
        isSubmittingReport.value = false;
    }
};

const submitReview = async () => {
    if (!item.value || savingReview.value) return;
    if (!reviewUserId.value) {
        await router.push({ name: 'Auth', query: { redirect: route.fullPath } });
        return;
    }

    savingReview.value = true;
    reviewSubmitError.value = '';
    try {
        const draft = {
            rating: reviewRating.value,
            comment: reviewComment.value
        };
        const reviewerProfile = await getPublicProfile(reviewUserId.value);
        const savedReview = myReview.value
            ? await updateReview(myReview.value.id, draft)
            : await createReview({ ...draft, documentId: item.value.id });

        myReview.value = savedReview;
        reviewComment.value = savedReview.comment;
        reviewRating.value = savedReview.rating;
        reviews.value = [
            {
                ...savedReview,
                username: reviewerProfile?.username || 'Leitor',
                avatar_url: reviewerProfile?.avatar_url ?? null
            },
            ...reviews.value.filter((review) => review.id !== savedReview.id)
        ]
            .sort((left, right) => right.created_at.localeCompare(left.created_at))
            .slice(0, 6);
        await showToast('Sua avaliação foi salva com sucesso.', 'success');
    } catch (error) {
        reviewSubmitError.value = error instanceof Error
            ? `Não foi possível salvar sua avaliação: ${error.message}`
            : 'Não foi possível salvar sua avaliação.';
    } finally {
        savingReview.value = false;
    }
};

watch(
    () => route.params.id,
    async (id) => {
        item.value = null;
        reviews.value = [];
        myReview.value = null;
        relatedItems.value = [];
        errorMessage.value = '';
        reviewsError.value = '';
        reviewLoadError.value = '';
        reviewSubmitError.value = '';
        reviewUserId.value = '';
        reviewRating.value = 5;
        reviewComment.value = '';
        reviewLoading.value = true;
        relatedError.value = '';
        uploaderName.value = '';
        loading.value = true;

        if (typeof id !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) {
            errorMessage.value = 'Identificador do documento inválido.';
            loading.value = false;
            reviewLoading.value = false;
            return;
        }

        try {
            item.value = await getPublicLibraryItem(id);
            if (!item.value) errorMessage.value = 'O documento solicitado não foi encontrado.';
            if (item.value) {
                const currentItem = item.value;
                void recordLibraryItemMetric(id, 'accesses').catch((metricError: unknown) => {
                    console.error('Não foi possível registrar o acesso ao documento.', metricError);
                });
                const [reviewResult, relatedResult, uploaderResult, sessionResult] = await Promise.allSettled([
                    listPublicDocumentReviews(id),
                    listRelatedPublicLibraryItems(currentItem),
                    getPublicProfile(currentItem.uploaded_by),
                    getCurrentSession()
                ]);

                if (reviewResult.status === 'fulfilled') {
                    reviews.value = reviewResult.value;
                } else {
                    reviewsError.value = reviewResult.reason instanceof Error
                        ? `Não foi possível carregar as avaliações: ${reviewResult.reason.message}`
                        : 'Não foi possível carregar as avaliações.';
                }

                if (sessionResult.status === 'fulfilled') {
                    const { data, error } = sessionResult.value;
                    if (error) {
                        reviewLoadError.value = `Não foi possível verificar sua sessão: ${error.message}`;
                    } else if (data.session?.user) {
                        reviewUserId.value = data.session.user.id;
                        try {
                            myReview.value = await getMyReviewForDocument(id);
                            if (myReview.value) {
                                reviewRating.value = myReview.value.rating;
                                reviewComment.value = myReview.value.comment;
                            }
                        } catch (error) {
                            reviewLoadError.value = error instanceof Error
                                ? `Não foi possível carregar sua avaliação: ${error.message}`
                                : 'Não foi possível carregar sua avaliação.';
                        }
                    }
                } else {
                    reviewLoadError.value = 'Não foi possível verificar sua sessão para avaliar.';
                }

                if (relatedResult.status === 'fulfilled') {
                    relatedItems.value = relatedResult.value;
                } else {
                    relatedError.value = relatedResult.reason instanceof Error
                        ? `Não foi possível carregar recomendações: ${relatedResult.reason.message}`
                        : 'Não foi possível carregar recomendações.';
                }

                if (uploaderResult.status === 'fulfilled') {
                    uploaderName.value = uploaderResult.value?.username || '';
                }
            }
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : typeof error === 'object' && error !== null && 'message' in error
                    && typeof error.message === 'string'
                    ? error.message
                    : '';
            errorMessage.value = message
                ? `Não foi possível carregar o documento: ${message}`
                : 'Não foi possível carregar o documento.';
        } finally {
            loading.value = false;
            reviewLoading.value = false;
            if (route.query.openReader === 'true' && item.value) void openReader();
        }
    },
    { immediate: true }
);

const refreshDocument = async () => {
    const id = route.params.id;
    if (typeof id !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) return;

    try {
        const updatedItem = await getPublicLibraryItem(id);
        if (!updatedItem) {
            item.value = null;
            errorMessage.value = 'O documento solicitado não foi encontrado.';
            return;
        }

        item.value = updatedItem;
        relatedItems.value = await listRelatedPublicLibraryItems(updatedItem);
    } catch (error) {
        console.error('Não foi possível atualizar os detalhes do documento.', error);
    }
};

useLibraryItemsSync(refreshDocument);
</script>

<style scoped>
.details-content {
    --background: var(--color-page-background);
}

.details-page {
    --content-width: 1120px;
    min-height: 60vh;
}

.back-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    margin: 0 0 var(--space-md);
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    text-decoration: none;
}

.back-link span {
    display: inline;
}

.back-link:hover {
    color: var(--color-text-primary);
    --reader-page-background: var(--color-surface);
    --reader-page-color: var(--color-text-primary);
    text-decoration: underline;
}

.back-link:focus-visible,
.uploader a:focus-visible,
.related-card:focus-visible {
    outline: 3px solid var(--color-brand-primary);
    outline-offset: 3px;
}

.back-link ion-icon {
    font-size: 1.2rem;
}

.document-summary {
    display: grid;
    grid-template-columns: minmax(160px, 0.34fr) minmax(0, 1fr);
    align-items: stretch;
    gap: var(--space-lg);
    margin-bottom: var(--space-md);
    padding: var(--surface-padding);
}

.cover-panel {
    display: grid;
    min-height: 260px;
    padding: var(--space-sm);
    place-items: center;
    color: var(--color-text-muted);
    font-size: 3rem;
}

.cover-panel img {
    width: 100%;
    height: 100%;
    min-height: 240px;
    max-height: 320px;
    border-radius: var(--radius-md);
    object-fit: contain;
}

.summary-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.summary-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
}

.summary-info .nv-eyebrow {
    margin: 0;
}

.summary-info .nv-page-title {
    margin-top: var(--space-sm);
}

.author {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-body);
}

.uploader {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-caption);
}

.uploader a {
    color: var(--color-brand-primary);
    font-weight: 700;
    text-decoration: none;
}

.summary-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    margin: var(--space-md) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    padding: 0;
    list-style: none;
}

.summary-meta li {
    display: inline-flex;
    min-height: 34px;
    align-items: center;
    gap: 6px;
    padding: 0 10px;
    border: 1px solid var(--color-border-soft);
    border-radius: 999px;
    background: var(--reader-overlay-background, var(--color-surface));
    white-space: nowrap;
}

.summary-meta ion-icon {
    font-size: 1rem;
}

.summary-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    margin-top: var(--space-lg);
}

.actions-hint {
    margin: var(--space-sm) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--typography-caption-default-font-size);
    line-height: var(--typography-caption-default-line-height);
}

.download-button {
    --background: var(--color-surface);
    --background-hover: var(--color-surface-alt);
    --color: var(--color-text-primary);
    --border-color: var(--color-border-soft);
    --border-style: solid;
    --border-width: 1px;
    --border-radius: var(--radius-control);
    --box-shadow: none;
    --padding-start: var(--space-md);
    --padding-end: var(--space-md);
    height: var(--control-height);
    margin: 0;
    font-size: var(--font-size-caption);
    font-weight: 700;
    text-transform: none;
    flex: 1 1 220px;
}

.read-button {
    --background: var(--color-brand-primary);
    --background-hover: var(--color-accent);
    --color: var(--color-white);
    --border-color: var(--color-brand-primary);
    --border-style: solid;
    --border-width: 1px;
    --border-radius: var(--radius-control);
    --box-shadow: none;
    --padding-start: var(--space-md);
    --padding-end: var(--space-md);
    flex: 1 1 220px;
    height: var(--control-height);
    margin: 0;
    font-size: var(--font-size-caption);
    font-weight: 700;
    text-transform: none;
}

.read-button::part(native),
.download-button::part(native) {
    transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.read-button:hover::part(native),
.download-button:hover:not([disabled])::part(native) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-soft);
}

.read-button:active::part(native),
.download-button:active:not([disabled])::part(native) {
    transform: translateY(0) scale(0.98);
}

.read-button:focus-visible,
.download-button:focus-visible,
.report-button:focus-visible {
    outline: 3px solid var(--color-brand-primary);
    outline-offset: 3px;
    border-radius: var(--radius-control);
}

.report-button {
    --color: var(--color-text-primary);
    --padding-start: var(--space-xs);
    --padding-end: var(--space-xs);
    height: 34px;
    margin: 0;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: none;
    white-space: nowrap;
    align-self: flex-end;
    margin-top: var(--space-xs);
}

.report-button:hover {
    --color: var(--color-danger);
}

.detail-section {
    margin-bottom: var(--space-md);
    padding: var(--surface-padding);
}

.reader-section {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    padding: clamp(var(--space-md), 3vw, var(--space-xl));
    overflow: hidden;
    background: var(--color-surface);
    color: var(--color-text-primary);
    --reader-page-background: var(--color-surface);
    --reader-page-color: var(--color-text-primary);
}

.reader-heading {
    display: grid;
    flex: 0 0 auto;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr);
    align-items: center;
    gap: var(--space-md);
}

.reader-title-wrap {
    min-width: 0;
    text-align: center;
}

.reader-kicker {
    margin: 0 0 var(--space-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.reader-book-title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: clamp(1.15rem, 2.4vw, 1.75rem);
    font-weight: 700;
    line-height: 1.25;
    overflow-wrap: anywhere;
}

.reader-progress-error {
    margin: var(--space-sm) 0 0;
    color: var(--color-danger);
    font-size: var(--font-size-caption);
}

.reader-close {
    --color: var(--color-text-primary);
    justify-self: end;
    margin: 0;
    font-size: var(--font-size-caption);
    font-weight: 700;
    text-transform: none;
}

.reader-controls-toggle {
    display: none;
}

.reader-tools {
    position: relative;
    z-index: 3;
    display: flex;
    flex: 0 0 auto;
    justify-content: flex-end;
    margin-top: var(--space-sm);
    transition: opacity 0.2s ease;
}

.reader-tools.reader-controls-hidden {
    opacity: 0;
    pointer-events: none;
}

.reader-tool-trigger {
    --border-radius: var(--radius-control);
    --color: var(--color-text-secondary);
    min-height: 36px;
    margin: 0;
    text-transform: none;
}

.reader-tools-panel {
    position: absolute;
    top: calc(100% + var(--space-xs));
    right: 0;
    display: grid;
    width: min(560px, calc(100vw - 32px));
    max-height: min(70vh, 620px);
    gap: var(--space-sm);
    padding: var(--space-sm);
    overflow: auto;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-soft);
}

.reader-tools-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
}

.reader-tools-actions ion-button {
    --color: var(--color-text-primary);
    margin: 0;
    font-size: var(--font-size-caption);
    text-transform: none;
}

.reader-search,
.reader-contents,
.reader-settings {
    display: grid;
    gap: var(--space-sm);
    padding-top: var(--space-sm);
    border-top: 1px solid var(--color-border-soft);
    color: var(--color-text-primary);
    font-size: var(--font-size-caption);
}

.reader-search > div {
    display: flex;
    gap: var(--space-xs);
}

.reader-search input {
    min-width: 0;
    min-height: var(--control-height);
    flex: 1;
    padding: 0 var(--space-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-control);
    background: var(--reader-page-background, var(--color-surface));
    color: var(--reader-page-color, var(--color-text-primary));
    font: inherit;
}

.reader-search > p,
.reader-contents > p {
    margin: 0;
    color: var(--reader-page-color, var(--color-text-secondary));
}

.reader-result-list,
.reader-contents ul {
    display: grid;
    max-height: 220px;
    gap: 2px;
    margin: 0;
    padding: 0;
    overflow: auto;
    list-style: none;
}

.reader-result-list button,
.reader-contents button {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: 8px 12px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--reader-page-color, var(--color-text-primary));
    font: inherit;
    text-align: left;
    cursor: pointer;
}

.reader-result-list button:hover,
.reader-contents button:hover {
    background: var(--reader-page-background, var(--color-surface-alt));
}

.reader-settings fieldset {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    margin: 0;
    padding: var(--space-xs);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-sm);
}

.reader-settings legend {
    padding: 0 var(--space-xs);
    color: var(--reader-page-color, var(--color-text-secondary));
}

.reader-settings ion-button {
    --color: var(--reader-page-color, var(--color-text-primary));
    margin: 0;
    text-transform: none;
}

.reader-settings ion-button.selected {
    --background: var(--color-brand-primary);
    --color: var(--color-white);
}

.reader-tools,
.reader-heading,
.reader-toolbar {
    --reader-page-background: var(--color-surface);
    --reader-page-color: var(--color-text-primary);
}

.reader-theme-sepia {
    --reader-page-background: #f1e4c8;
    --reader-page-color: #493b2b;
    --color-surface: #f6ecd7;
    --color-surface-alt: #eadbbd;
    --color-text-primary: #493b2b;
    --color-text-secondary: #6d5b42;
    --color-border-soft: #d8c8a7;
    --reader-overlay-background: rgb(246 236 215 / 94%);
    color: var(--reader-page-color);
}

.reader-theme-dark {
    --reader-page-background: #24242b;
    --reader-page-color: #f1eee9;
    --color-surface: #2e2e37;
    --color-surface-alt: #383842;
    --color-text-primary: #f1eee9;
    --color-text-secondary: #c4c3cc;
    --color-border-soft: #555561;
    --reader-overlay-background: rgb(46 46 55 / 94%);
    color: var(--reader-page-color);
}

.reader-theme-dark .reader-body,
.reader-theme-sepia .reader-body {
    background: var(--reader-page-background);
}

.reader-toolbar {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: var(--space-sm);
    margin-top: var(--space-md);
    padding: var(--space-xs);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--color-surface);
}

.reader-control {
    --color: var(--color-text-primary);
    --border-color: var(--color-border-soft);
    --border-radius: var(--radius-control);
    --padding-start: 8px;
    --padding-end: 8px;
    width: 38px;
    height: 38px;
    margin: 0;
}

.reader-fit-control {
    width: auto;
    min-width: 76px;
    padding-inline: 6px;
    font-size: 0.72rem;
}

.reader-page,
.reader-zoom {
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    white-space: nowrap;
}

.reader-page {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
}

.reader-page input {
    width: 5.25rem;
    min-height: 38px;
    padding: 0 var(--space-xs);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text-primary);
    font: inherit;
    text-align: center;
    margin-inline: var(--space-xs);
}

.reader-page input:focus-visible {
    border-color: var(--color-brand-primary);
    outline: 3px solid rgb(83 83 143 / 20%);
    outline-offset: 1px;
}

.reader-page input:disabled {
    opacity: 0.65;
}

.reader-controls-hidden {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.reader-toolbar-spacer {
    flex: 1;
}

.reader-body {
    display: flex;
    min-height: 0;
    flex: 1 1 auto;
    flex-direction: column;
    margin-top: var(--space-md);
    overflow: hidden;
}

.reader-feedback {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    text-align: center;
}

.reader-error {
    color: var(--color-danger);
}

.reader-error a {
    color: var(--color-brand-primary);
}

.pdf-stage {
    display: flex;
    min-height: 0;
    flex: 1;
    align-items: flex-start;
    justify-content: flex-start;
    margin-top: 0;
    padding: var(--space-md);
    overflow: auto;
    border-radius: var(--radius-md);
    background: var(--reader-page-background, var(--color-surface-alt));
}

.continuous-pdf-stage {
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: var(--space-md);
    scroll-behavior: smooth;
}

.continuous-pdf-page {
    display: grid;
    width: min(100%, 900px);
    flex: 0 0 auto;
    place-items: center;
    overflow: hidden;
    background: white;
    box-shadow: var(--shadow-soft);
}

.continuous-pdf-page canvas {
    display: block;
    max-width: 100%;
    height: auto;
}

.continuous-epub-reader {
    scroll-behavior: smooth;
}

.continuous-epub-chapter {
    min-height: 50vh;
    padding-bottom: var(--space-xl);
    border-bottom: 1px solid var(--color-border-soft);
}

.continuous-epub-chapter + .continuous-epub-chapter {
    padding-top: var(--space-xl);
}

.continuous-epub-chapter:last-child {
    border-bottom: 0;
}

.pdf-stage canvas {
    display: block;
    height: auto;
    margin: auto;
    background: white;
    box-shadow: var(--shadow-soft);
}

.reader-theme-sepia .pdf-stage canvas {
    filter: sepia(0.28);
}

.reader-theme-dark .pdf-stage canvas {
    filter: invert(0.88) hue-rotate(180deg);
}

.pdf-stage,
.text-reader {
    scrollbar-width: thin;
    scrollbar-color: rgb(74 78 105 / 32%) transparent;
}

.pdf-stage::-webkit-scrollbar,
.text-reader::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.pdf-stage::-webkit-scrollbar-thumb,
.text-reader::-webkit-scrollbar-thumb {
    border: 1px solid transparent;
    border-radius: 999px;
    background: rgb(74 78 105 / 32%);
    background-clip: padding-box;
}

.pdf-stage::-webkit-scrollbar-thumb:hover,
.text-reader::-webkit-scrollbar-thumb:hover {
    background: rgb(74 78 105 / 52%);
    background-clip: padding-box;
}

.pdf-stage::-webkit-scrollbar-track,
.text-reader::-webkit-scrollbar-track {
    background: transparent;
}

.text-reader {
    width: 100%;
    height: 100%;
    min-height: 0;
    flex: 1;
    margin: 0;
    padding: var(--space-lg);
    overflow: auto;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--reader-page-background, var(--color-surface-alt));
    color: var(--reader-page-color, var(--color-text-primary));
    font: inherit;
    line-height: 1.75;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
}

:global(ion-modal.reader-modal) {
    --width: 100%;
    --height: 100%;
    --max-width: 100%;
    --max-height: 100%;
    --border-radius: 0;
    --background: var(--color-surface);
    --ion-background-color: var(--color-surface);
    --ion-text-color: var(--color-text-primary);
    --color: var(--color-text-primary);
}

.section-title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1.15rem;
    font-weight: 700;
}

.section-copy {
    margin: var(--space-sm) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    line-height: 1.65;
    white-space: pre-line;
}

.description-copy-collapsed {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
}

.description-toggle {
    margin-top: var(--space-xs);
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-brand-primary);
    font: inherit;
    font-size: var(--font-size-caption);
    font-weight: 700;
    cursor: pointer;
}

.description-toggle:hover {
    color: var(--color-accent);
    text-decoration: underline;
}

.description-toggle:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 3px;
    border-radius: var(--radius-sm);
}

.report-action {
    display: flex;
    justify-content: center;
    margin: calc(-1 * var(--space-md)) 0 var(--space-md);
}

.muted {
    color: var(--color-text-muted);
}

.section-heading,
.review-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
}

.rating-summary {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-shrink: 0;
    color: var(--color-text-primary);
}

.rating-stars {
    color: #c58b1b;
    letter-spacing: 0.08em;
    white-space: nowrap;
}

.review-editor {
    display: grid;
    gap: var(--space-sm);
    margin-top: var(--space-lg);
    padding: var(--space-lg);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--color-page-background);
}

.review-editor h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1rem;
}

.review-rating-picker {
    display: flex;
    align-items: center;
    gap: 2px;
}

.rating-choice {
    min-width: 38px;
    min-height: 42px;
    padding: 0 4px;
    border: 0;
    background: transparent;
    color: var(--color-border);
    font-size: 1.75rem;
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
}

.rating-choice.is-selected {
    color: #c58b1b;
}

.rating-choice:disabled {
    cursor: default;
    opacity: 0.7;
}

.rating-choice:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: -2px;
    border-radius: var(--radius-sm);
}

.rating-choice-label {
    margin-left: var(--space-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.review-comment-field {
    display: grid;
    gap: var(--space-xs);
    color: var(--color-text-primary);
    font-size: var(--font-size-caption);
    font-weight: 600;
}

.review-comment-field textarea {
    width: 100%;
    min-height: 6rem;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text-primary);
    font: inherit;
    font-weight: 400;
    line-height: 1.5;
    resize: none;
}

.review-comment-field textarea:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 2px;
}

.review-submit {
    width: 100%;
    min-height: var(--control-height);
    margin: 0;
    --background: var(--color-brand-primary);
    --background-hover: var(--color-accent);
    --color: var(--color-white);
    --border-radius: var(--radius-control);
    font-weight: 700;
    text-transform: none;
}

.review-sign-in,
.review-loading,
.review-empty {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    margin: var(--space-md) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.review-sign-in a {
    color: var(--color-brand-primary);
    font-weight: 700;
}

.review-list {
    display: grid;
    gap: var(--space-md);
    margin: var(--space-lg) 0 0;
    padding: 0;
    list-style: none;
}

.review-item {
    display: flex;
    gap: var(--space-sm);
    padding-top: var(--space-md);
    border-top: 1px solid var(--color-border-soft);
}

.review-avatar,
.author-avatar {
    display: grid;
    flex: 0 0 36px;
    width: 36px;
    height: 36px;
    place-items: center;
    border-radius: 50%;
    background: var(--color-surface-alt);
    color: var(--color-text-secondary);
    font-size: 1.7rem;
}

.review-avatar img {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    object-fit: cover;
}

.review-body {
    flex: 1;
    min-width: 0;
}

.review-heading strong {
    color: var(--color-text-primary);
    font-size: var(--font-size-caption);
}

.review-body p {
    margin: var(--space-xs) 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    line-height: 1.5;
    overflow-wrap: anywhere;
}

.review-body time {
    color: var(--color-text-muted);
    font-size: 0.75rem;
}

.reviews-error {
    margin: var(--space-md) 0 0;
    color: var(--color-danger);
    font-size: var(--font-size-caption);
}

.author-section {
    display: flex;
    align-items: center;
    gap: var(--space-md);
}

.author-avatar {
    flex-basis: 48px;
    width: 48px;
    height: 48px;
    font-size: 2.2rem;
}

.related-section {
    margin-top: var(--space-xl);
}

.related-section > .section-title {
    margin-bottom: var(--space-md);
}

.related-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-md);
}

.related-card {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-sm);
    color: inherit;
    text-decoration: none;
}

.related-card:hover {
    border-color: var(--color-brand-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-soft);
}

.related-card {
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.related-card img,
.related-cover-fallback {
    display: grid;
    width: 100%;
    height: 120px;
    margin-bottom: var(--space-xs);
    place-items: center;
    border-radius: var(--radius-sm);
    background: var(--color-surface-alt);
    color: var(--color-text-muted);
    object-fit: contain;
}

.related-cover-fallback {
    font-size: 2rem;
}

.related-card strong,
.related-card span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.related-card strong {
    color: var(--color-text-primary);
    font-size: var(--font-size-caption);
}

.related-card span {
    color: var(--color-text-secondary);
    font-size: 0.75rem;
}

.feedback {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    min-height: 180px;
    color: var(--color-text-secondary);
    text-align: center;
}

.error-message {
    color: var(--color-danger);
}

:global(ion-modal.report-modal) {
    --width: min(calc(100% - 32px), 560px);
    --height: auto;
    --max-height: min(90vh, 720px);
    --background: var(--color-surface);
    --ion-background-color: var(--color-surface);
    --ion-text-color: var(--color-text-primary);
    --color: var(--color-text-primary);
    --border-radius: var(--radius-xl);
    --box-shadow: var(--shadow-soft);
}

.report-form {
    display: grid;
    gap: var(--space-md);
    padding: clamp(var(--space-md), 5vw, var(--space-xl));
    overflow-y: auto;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-xl);
    background: var(--color-surface);
    color: var(--color-text-primary);
    color-scheme: light;
}

.report-form-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-sm);
}

.report-form-header ion-button {
    --color: var(--color-brand-primary);
    flex: 0 0 auto;
    margin: -4px -8px 0 0;
    font-weight: 700;
    text-transform: none;
}

.report-form-header .nv-eyebrow {
    margin: 0 0 var(--space-xs);
}

.report-form-header .section-title {
    font-size: 1.35rem;
}

.report-document-title {
    margin: 0;
    color: var(--color-text-secondary);
    font-weight: 600;
}

.report-field {
    display: grid;
    gap: var(--space-xs);
    color: var(--color-text-primary);
    font-size: var(--font-size-caption);
    font-weight: 700;
}

.report-field select,
.report-field textarea {
    width: 100%;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-control, var(--radius-sm));
    background: var(--color-surface);
    color: var(--color-text-primary);
    font: inherit;
    font-weight: 400;
    color-scheme: light;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.report-field select:focus-visible,
.report-field textarea:focus-visible {
    border-color: var(--color-brand-primary);
    outline: 0;
    box-shadow: 0 0 0 3px rgb(83 83 143 / 16%);
}

.report-field select {
    min-height: var(--control-height);
    padding: 0 var(--space-sm);
}

.report-field textarea {
    min-height: 120px;
    padding: var(--space-sm);
    resize: vertical;
}

.report-field small {
    color: var(--color-text-muted);
    font-weight: 400;
    text-align: right;
}

.report-optional {
    color: var(--color-text-muted);
    font-weight: 400;
}

.report-privacy {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-caption);
    line-height: 1.5;
}

.report-submit {
    --background: var(--color-brand-primary);
    --background-hover: #444477;
    --background-activated: #393966;
    --color: var(--color-white);
    --border-radius: var(--radius-control);
    --box-shadow: none;
    margin: 0;
    font-weight: 700;
    text-transform: none;
}

.report-submit::part(native) {
    min-height: var(--control-height);
}

.report-submit[disabled] {
    --background: #77779f;
    --color: var(--color-white);
    opacity: 1;
}

@media (max-width: 700px) {
    .reviews-section .section-heading {
        gap: var(--space-sm);
    }

    .reviews-section .section-title {
        font-size: 1rem;
    }

    .reader-section {
        position: relative;
        padding:
            calc(env(safe-area-inset-top, 0px) + 8px)
            8px
            calc(env(safe-area-inset-bottom, 0px) + 8px);
    }

    .reader-heading {
        position: absolute;
        z-index: 2;
        top: calc(env(safe-area-inset-top, 0px) + 8px);
        right: 8px;
        left: 8px;
        display: flex;
        justify-content: space-between;
        padding: 4px 8px;
        border-radius: var(--radius-md);
        background: var(--reader-overlay-background, rgb(251 248 245 / 92%));
        box-shadow: var(--shadow-soft);
        transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .reader-controls-toggle {
        position: absolute;
        z-index: 5;
        right: 12px;
        bottom: calc(env(safe-area-inset-bottom, 0px) + 14px);
        display: inline-flex;
        width: 42px;
        height: 42px;
        margin: 0;
        --background: var(--reader-overlay-background, rgb(251 248 245 / 96%));
        --border-color: var(--color-border-soft);
        --border-radius: 50%;
        --color: var(--reader-page-color, var(--color-text-primary));
        --box-shadow: var(--shadow-soft);
        backdrop-filter: blur(12px);
    }

    .reader-heading.reader-controls-hidden {
        transform: translateY(-8px);
    }

    .reader-heading-spacer {
        display: none;
    }

    .reader-title-wrap {
        flex: 1;
        overflow: hidden;
        text-align: left;
    }

    .reader-book-title {
        overflow: hidden;
        font-size: 1rem;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .reader-close {
        flex: 0 0 auto;
        min-height: 36px;
        margin-left: var(--space-xs);
    }

    .reader-tools {
        position: absolute;
        z-index: 3;
        top: calc(env(safe-area-inset-top, 0px) + 52px);
        right: 8px;
        margin: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .reader-tool-trigger {
        --background: var(--reader-overlay-background, rgb(251 248 245 / 94%));
        --border-color: var(--color-border-soft);
        --color: var(--reader-page-color, var(--color-text-primary));
        min-height: 32px;
        padding-inline: 4px;
        font-size: 0.72rem;
        box-shadow: var(--shadow-soft);
    }

    .reader-tools-panel {
        top: calc(100% + 6px);
        right: 0;
        width: min(340px, calc(100vw - 16px));
        max-height: min(66dvh, 520px);
        background: var(--reader-overlay-background, var(--color-surface));
        backdrop-filter: blur(12px);
    }

    .reader-tools-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .reader-tools-actions ion-button {
        --padding-start: 6px;
        --padding-end: 6px;
        justify-content: flex-start;
        font-size: 0.75rem;
    }

    .reader-settings fieldset {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .reader-toolbar {
        position: absolute;
        z-index: 2;
        bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
        left: 50%;
        width: max-content;
        max-width: calc(100% - 16px);
        flex-wrap: nowrap;
        justify-content: center;
        gap: 2px;
        margin: 0;
        padding: 4px;
        border-radius: 999px;
        background: var(--reader-overlay-background, rgb(251 248 245 / 94%));
        box-shadow: var(--shadow-soft);
        backdrop-filter: blur(12px);
        transform: translateX(-50%);
        transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .reader-toolbar.reader-controls-hidden {
        transform: translate(-50%, 8px);
    }

    .reader-control {
        --background: var(--color-surface);
        --background-hover: var(--color-surface-alt);
        --background-activated: var(--color-surface-alt);
        --border-color: var(--color-border-soft);
        --border-width: 1px;
        --color: var(--color-text-primary);
        --box-shadow: none;
        width: 30px;
        height: 30px;
        flex: 0 0 30px;
    }

    .reader-toolbar-spacer {
        display: none;
    }

    .reader-fit-control,
    .reader-zoom-control,
    .reader-zoom {
        display: none;
    }

    .reader-page,
    .reader-zoom {
        gap: 4px;
        font-size: 0.72rem;
    }

    .reader-page-label {
        display: none;
    }

    .reader-page input {
        width: 2.75rem;
        min-height: 30px;
        margin-inline: 2px;
    }

    .reader-body {
        position: absolute;
        inset: 0;
        margin: 0;
        overflow: hidden;
    }

    .reader-progress-error {
        position: absolute;
        z-index: 3;
        top: calc(env(safe-area-inset-top, 0px) + 56px);
        right: 12px;
        left: 12px;
        width: fit-content;
        max-width: calc(100% - 24px);
        margin: 0 auto;
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        background: rgb(251 248 245 / 94%);
        text-align: center;
    }

    .document-summary {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--space-md);
        padding: var(--space-md);
    }

    .cover-panel {
        min-height: 0;
        align-self: center;
        padding: 0;
    }

    .cover-panel img {
        width: min(100%, 220px);
        height: 260px;
        min-height: 0;
        max-height: 300px;
    }

    .summary-info .nv-page-title {
        width: 100%;
    }

    .summary-info .nv-eyebrow {
        padding: 4px 8px;
        font-size: 0.65rem;
    }

    .summary-topline {
        flex-wrap: wrap;
        align-items: flex-start;
        gap: var(--space-xs);
    }

    .summary-meta {
        gap: 6px;
        margin-bottom: var(--space-xs);
        font-size: 0.75rem;
    }

    .summary-actions {
        gap: var(--space-xs);
        margin-top: var(--space-md);
    }

    .read-button,
    .download-button {
        flex-basis: 100%;
    }

    .report-button {
        --padding-start: 0;
        --padding-end: 0;
    }

    .back-link {
        width: 42px;
        height: 42px;
        justify-content: center;
        margin-bottom: var(--space-sm);
        border: 1px solid var(--color-border-soft);
        border-radius: 50%;
        background: var(--color-surface);
    }

    .back-link span {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
    }

    .report-action {
        margin-top: calc(-1 * var(--space-sm));
    }

    :global(ion-modal.report-modal) {
        --width: min(calc(100% - 20px), 560px);
        --max-height: 92vh;
    }

    .pdf-stage {
        padding: var(--space-xs);
    }

    .text-reader {
        padding: var(--space-md);
    }

    .related-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .related-card img,
    .related-cover-fallback {
        height: 150px;
    }
}

@media (max-width: 380px) {
    .cover-panel {
        width: 100%;
    }

    .cover-panel img {
        width: min(100%, 200px);
        height: 240px;
    }
}
</style>
