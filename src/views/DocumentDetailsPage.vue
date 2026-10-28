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
                            <div class="cover-art">
                                <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`" />
                                <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                                <ion-button
                                    v-if="item.content_type === 'livro'"
                                    class="collection-save-button"
                                    fill="solid"
                                    type="button"
                                    :aria-label="`${isSavedInCollection ? 'Gerenciar coleções de' : 'Salvar'} ${item.title}`"
                                    :aria-pressed="isSavedInCollection"
                                    :title="isSavedInCollection ? 'Gerenciar coleções' : 'Salvar em coleção'"
                                    @click="isCollectionPickerOpen = true"
                                >
                                    <ion-icon
                                        slot="icon-only"
                                        :icon="isSavedInCollection ? bookmark : bookmarkOutline"
                                        aria-hidden="true"
                                    />
                                </ion-button>
                            </div>
                        </div>

                        <div class="summary-info">
                            <div class="summary-topline">
                                <span class="summary-category nv-badge">{{ item.category }}</span>
                                <span class="summary-content-type nv-badge">{{ item.content_type }}</span>
                            </div>
                            <h1 id="document-title" class="nv-page-title">
                                <span class="document-title-main">{{ documentTitleParts.main }}</span>
                                <span v-if="documentTitleParts.subtitle" class="document-title-subtitle">
                                    {{ documentTitleParts.subtitle }}
                                </span>
                            </h1>
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
                            <div v-if="!reviewsError && !reviews.length && !reviewLoading"
                                class="review-empty" aria-label="Sem avaliações">
                                <span class="rating-stars rating-stars-empty" aria-hidden="true">{{ starRating(0) }}</span>
                                <span>Sem avaliações</span>
                            </div>
                            <div class="summary-actions" aria-label="Ações do documento">
                                <ion-button class="read-button" :aria-label="`Ler ${item.title} online`"
                                    @click="openReader">
                                    <ion-icon slot="start" :icon="bookOutline" />
                                    Ler online
                                </ion-button>
                                <ion-button class="download-button" fill="outline" :disabled="isDownloading" :aria-busy="isDownloading"
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
                                    {{ reviewsError ? 'As avaliações estão indisponíveis no momento.' : reviewLoading ? 'Carregando avaliações...' : reviews.length ? `${reviews.length} ${reviews.length === 1 ? 'avaliação recente' : 'avaliações recentes'}` : 'Sem avaliações' }}
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
            <section
                class="reader-section"
                :class="[
                    `reader-theme-${readerTheme}`,
                    `reader-margin-${readerMargin}`,
                    { 'reader-fullscreen': isFullscreen }
                ]"
                aria-labelledby="reader-title"
            >
                <div class="reader-heading" :class="{ 'reader-controls-hidden': !readerControlsVisible }">
                    <div class="reader-title-wrap">
                        <h2 id="reader-title" class="reader-book-title">{{ item?.title }}</h2>
                    </div>
                    <div class="reader-heading-actions">
                        <div class="reader-tools reader-heading-tool">
                            <ion-button
                                class="reader-icon-button"
                                fill="solid"
                                type="button"
                                :aria-expanded="activeReaderPanel === 'actions' || activeReaderPanel === 'search'"
                                aria-label="Ferramentas de leitura"
                                @click="toggleReaderPanel('actions')"
                            >
                                <ion-icon slot="icon-only" :icon="appsOutline" aria-hidden="true" />
                            </ion-button>
                        </div>
                        <ion-button
                            class="reader-icon-button reader-format-button"
                            fill="clear"
                            type="button"
                            aria-label="Formatação e visualização"
                            :aria-expanded="activeReaderPanel === 'settings'"
                            @click="toggleReaderPanel('settings')"
                        >
                            Aa
                        </ion-button>
                        <ion-button
                            class="reader-icon-button"
                            fill="clear"
                            type="button"
                            aria-label="Opções do documento"
                            :aria-expanded="activeReaderPanel === 'file-options' || activeReaderPanel === 'contents'"
                            @click="toggleReaderPanel('file-options')"
                        >
                            <ion-icon slot="icon-only" :icon="ellipsisHorizontalOutline" aria-hidden="true" />
                        </ion-button>
                        <ion-button class="reader-close" fill="clear" type="button" aria-label="Fechar leitor"
                            @click="closeReader">
                            <ion-icon slot="icon-only" :icon="closeOutline" aria-hidden="true" />
                        </ion-button>
                    </div>
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
                <div class="reader-tools reader-panel-anchor" :class="{ 'reader-controls-hidden': !readerControlsVisible }">
                    <div v-if="activeReaderPanel === 'actions'" class="reader-tools-panel reader-tools-actions" aria-label="Ferramentas de leitura">
                        <ion-button fill="clear" type="button" @click="toggleReaderPanel('search')">
                            <ion-icon slot="start" :icon="searchOutline" /> Buscar
                        </ion-button>
                        <ion-button fill="clear" type="button" @click="activeReaderPanel = null; toggleFullscreen()">
                            <ion-icon slot="start" :icon="isFullscreen ? contractOutline : expandOutline" />
                            {{ isFullscreen ? 'Sair da tela cheia' : 'Tela cheia' }}
                        </ion-button>
                        <ion-button v-if="pageCount" fill="clear" type="button"
                            @click="activeReaderPanel = null; toggleBookmark()">
                            <ion-icon slot="start" :icon="bookmarkOutline" />
                            {{ bookmarkedPage === currentPage ? 'Remover marcador' : 'Marcar esta página' }}
                        </ion-button>
                        <ion-button v-if="bookmarkedPage && pageCount" fill="clear" type="button"
                            @click="activeReaderPanel = null; goToPageNumber(bookmarkedPage)">
                            <ion-icon slot="start" :icon="bookmarkOutline" /> Ir ao marcador ({{ bookmarkedPage }})
                        </ion-button>
                    </div>
                    <form v-else-if="activeReaderPanel === 'search'" class="reader-tools-panel reader-search"
                        @submit.prevent="searchDocument">
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
                    <div v-else-if="activeReaderPanel === 'settings'" class="reader-tools-panel reader-settings">
                        <fieldset v-if="isPdf">
                            <legend>Ajustar página PDF</legend>
                            <ion-button fill="outline" :class="{ selected: pdfFitMode === 'width' }"
                                :disabled="readerLoading" aria-label="Ajustar à largura"
                                @click="setPdfFitMode('width')">
                                <ion-icon slot="start" :icon="expandOutline" /> Largura
                            </ion-button>
                            <ion-button fill="outline" :class="{ selected: pdfFitMode === 'page' }"
                                :disabled="readerLoading" aria-label="Ajustar à página"
                                @click="setPdfFitMode('page')">
                                <ion-icon slot="start" :icon="documentOutline" /> Página
                            </ion-button>
                        </fieldset>
                        <fieldset v-if="isPdf">
                            <legend>Zoom · {{ Math.round(zoom * 100) }}%</legend>
                            <div class="reader-zoom-slider">
                                <ion-button fill="clear" type="button" :disabled="readerLoading || zoom <= 0.7"
                                    aria-label="Diminuir zoom" @click="changeZoom(-0.2)">
                                    <ion-icon slot="icon-only" :icon="removeOutline" />
                                </ion-button>
                                <IonRange
                                    class="reader-range"
                                    :value="zoom"
                                    :min="0.7"
                                    :max="2.4"
                                    :step="0.1"
                                    :pin="true"
                                    :disabled="readerLoading"
                                    aria-label="Nível de zoom"
                                    @ionInput="setZoomFromRange"
                                />
                                <ion-button fill="clear" type="button" :disabled="readerLoading || zoom >= 2.4"
                                    aria-label="Aumentar zoom" @click="changeZoom(0.2)">
                                    <ion-icon slot="icon-only" :icon="addOutline" />
                                </ion-button>
                            </div>
                        </fieldset>
                        <fieldset v-if="isPdf">
                            <legend>Modo de rolagem</legend>
                            <IonSegment class="reader-settings-segment"
                                :value="readerContinuous ? 'continuous' : 'single'" :disabled="readerLoading"
                                aria-label="Modo de rolagem" @ionChange="setReaderMode">
                                <IonSegmentButton value="single"><IonLabel>Página única</IonLabel></IonSegmentButton>
                                <IonSegmentButton value="continuous"><IonLabel>Rolagem contínua</IonLabel></IonSegmentButton>
                            </IonSegment>
                        </fieldset>
                        <fieldset v-if="isPdf">
                            <legend>Orientação da página</legend>
                            <ion-button fill="outline" type="button" :disabled="readerLoading"
                                aria-label="Girar página 90 graus" @click="rotatePdfPage">
                                <ion-icon slot="start" :icon="refreshOutline" />
                                Girar 90° <span class="reader-rotation-value">{{ pdfRotation }}°</span>
                            </ion-button>
                        </fieldset>
                        <fieldset v-else>
                            <legend>Modo de rolagem</legend>
                            <IonSegment class="reader-settings-segment"
                                :value="readerContinuous ? 'continuous' : 'single'" :disabled="readerLoading"
                                aria-label="Modo de rolagem" @ionChange="setReaderMode">
                                <IonSegmentButton value="single"><IonLabel>Página única</IonLabel></IonSegmentButton>
                                <IonSegmentButton value="continuous"><IonLabel>Rolagem contínua</IonLabel></IonSegmentButton>
                            </IonSegment>
                        </fieldset>
                        <fieldset v-if="!isPdf">
                            <legend>Margens</legend>
                            <IonSegment class="reader-settings-segment" :value="readerMargin" aria-label="Margens do texto"
                                @ionChange="setReaderMargin">
                                <IonSegmentButton value="narrow"><IonLabel>Estreita</IonLabel></IonSegmentButton>
                                <IonSegmentButton value="medium"><IonLabel>Média</IonLabel></IonSegmentButton>
                                <IonSegmentButton value="wide"><IonLabel>Larga</IonLabel></IonSegmentButton>
                            </IonSegment>
                        </fieldset>
                        <fieldset class="reader-theme-options">
                            <legend>Tema de leitura</legend>
                            <ion-button
                                v-for="theme in readerThemes"
                                :key="theme.value"
                                class="reader-theme-swatch"
                                :class="[`reader-theme-swatch-${theme.value}`, { selected: readerTheme === theme.value }]"
                                fill="clear"
                                :aria-pressed="readerTheme === theme.value"
                                :aria-label="`Tema ${theme.label}`"
                                :title="theme.label"
                                type="button"
                                @click="setReaderTheme(theme.value, $event)"
                            >
                                <ion-icon slot="icon-only"
                                    :icon="theme.value === 'light' ? sunnyOutline : theme.value === 'dark' ? moonOutline : bookOutline"
                                    aria-hidden="true" />
                            </ion-button>
                        </fieldset>
                    </div>
                    <div v-else-if="activeReaderPanel === 'file-options'" class="reader-tools-panel reader-file-options">
                        <ion-button v-if="readerContents.length" fill="clear" type="button"
                            @click="toggleReaderPanel('contents')">
                            <ion-icon slot="start" :icon="listOutline" /> Sumário
                        </ion-button>
                        <ion-button fill="clear" type="button"
                            @click="activeReaderPanel = null; downloadDocument()">
                            <ion-icon slot="start" :icon="downloadOutline" /> Baixar documento
                        </ion-button>
                        <ion-button fill="clear" type="button" :disabled="isPrinting"
                            @click="activeReaderPanel = null; openDocumentForPrint()">
                            <ion-spinner v-if="isPrinting" slot="start" name="crescent" />
                            <ion-icon v-else slot="start" :icon="printOutline" />
                            {{ isPrinting ? 'Preparando impressão...' : 'Imprimir' }}
                        </ion-button>
                    </div>
                    <div v-else-if="activeReaderPanel === 'contents'" class="reader-tools-panel reader-contents">
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
                        <span class="reader-page-label">Página</span>
                        <input
                            type="number"
                            min="1"
                            :max="pageCount || undefined"
                            :value="currentPage"
                            :disabled="readerLoading || !pageCount"
                            aria-label="Ir para página"
                            @change="goToPage"
                        />
                        <span class="reader-page-total">
                            {{ pageCount ? `de ${pageCount}` : 'de páginas...' }}
                        </span>
                    </span>
                    <ion-button class="reader-control" fill="outline" type="button"
                        :disabled="readerLoading || currentPage >= pageCount" aria-label="Próxima página"
                        @click="changePage(1)">
                        <ion-icon slot="icon-only" :icon="arrowForwardOutline" />
                    </ion-button>
                </div>

                <div
                    class="reader-body"
                    :class="{ 'reader-body-epub-continuous': isEpub && readerContinuous }"
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
                            <div
                                class="pdf-text-layer"
                                aria-hidden="true"
                                :ref="(element) => setContinuousTextLayer(element, pageNumber - 1)"
                            />
                        </section>
                    </div>
                    <div v-else-if="isPdf" class="pdf-stage" aria-label="Página do documento">
                        <div ref="pdfPageContainer" class="pdf-page-container">
                            <canvas ref="pdfCanvas" />
                            <div ref="pdfTextLayer" class="pdf-text-layer" aria-hidden="true" />
                        </div>
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
                    <div v-else-if="isEpub" ref="textReader" class="text-reader epub-reader epub-paged-reader"
                        :style="{ fontSize: `${readerTextZoom}rem` }"
                        aria-label="Página do livro" @scroll="onEpubPagedScroll" @wheel="onEpubPagedWheel">
                        <div ref="epubPagedContent" class="epub-paged-content">
                            <section v-for="(chapter, index) in readerChapters" :key="index"
                                class="epub-paged-chapter" :data-chapter="index">
                                <h3 v-if="chapter.title">{{ chapter.title }}</h3>
                                <p v-html="highlightText(chapter.text)" />
                            </section>
                        </div>
                    </div>
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
import {
    IonButton,
    IonContent,
    IonIcon,
    IonLabel,
    IonModal,
    IonPage,
    IonRange,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    toastController
} from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { FileTransfer } from '@capacitor/file-transfer';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { StatusBar } from '@capacitor/status-bar';
import { Printer } from '@capgo/capacitor-printer';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import {
    addOutline,
    appsOutline,
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
    refreshOutline,
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
import { pdfWasmUrl } from '@/services/pdfjsConfig';

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
const isPrinting = ref(false);
const isCollectionPickerOpen = ref(false);
const isSavedInCollection = ref(false);
const emptyBook = { id: '', title: '' };
const isDescriptionExpanded = ref(false);
const isDescriptionLong = computed(() => (item.value?.description?.length ?? 0) > 240);
const documentTitleParts = computed(() => {
    const title = item.value?.title ?? '';
    const subtitleStart = title.indexOf(' (');
    if (subtitleStart < 0 || !title.endsWith(')')) return { main: title, subtitle: '' };
    return {
        main: title.slice(0, subtitleStart),
        subtitle: title.slice(subtitleStart + 1)
    };
});
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
const epubPagedContent = ref<HTMLElement | null>(null);
const epubChapterPageStarts = ref<number[]>([]);
const zoom = ref(1);
const pdfRotation = ref(0);
const readerTextZoom = ref(1);
const readerContinuous = ref(false);
const readerMargin = ref<'narrow' | 'medium' | 'wide'>('medium');
const savedReaderPercent = ref(0);
const readerTheme = ref<'light' | 'sepia' | 'dark'>('light');
const readerThemes = [
    { value: 'light', label: 'Claro' },
    { value: 'sepia', label: 'Sépia' },
    { value: 'dark', label: 'Escuro' }
] as const;
const pdfFitMode = ref<'width' | 'page' | 'manual'>('width');
const activeReaderPanel = ref<ReaderPanel | null>(null);
const readerSearchQuery = ref('');
const readerSearchResults = ref<{ page: number; title: string }[]>([]);
const readerSearchMessage = ref('');
const readerSearching = ref(false);
const readerContents = ref<{ title: string; page: number; level: number }[]>([]);
const bookmarkedPage = ref(0);
const isFullscreen = ref(false);
const pdfCanvas = ref<HTMLCanvasElement | null>(null);
const pdfPageContainer = ref<HTMLElement | null>(null);
const pdfTextLayer = ref<HTMLElement | null>(null);
const continuousPdfStage = ref<HTMLElement | null>(null);
const continuousPdfPageElements: (HTMLElement | null)[] = [];
const continuousPdfCanvases: (HTMLCanvasElement | null)[] = [];
const continuousPdfTextLayers: (HTMLElement | null)[] = [];
const pdfTextLayerInstances = new Map<number, pdfjsLib.TextLayer>();
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
let pdfZoomTimer: number | undefined;
let epubLayoutTimer: number | undefined;
let touchStartX = 0;
let touchStartY = 0;
let touchStartDistance = 0;
let touchStartZoom = 1;
let pinchPreviewScale = 1;
let touchGesture: 'swipe' | 'pinch' | null = null;
let suppressReaderClick = false;
let continuousPdfObserver: IntersectionObserver | undefined;
const visibleContinuousPdfPages = new Set<number>();
const renderingContinuousPdfPages = new Set<number>();
type ReaderPanel = 'actions' | 'search' | 'contents' | 'settings' | 'file-options';
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

const queueEpubLayoutUpdate = () => {
    if (!isReaderOpen.value || !isEpub.value) return;
    if (epubLayoutTimer !== undefined) window.clearTimeout(epubLayoutTimer);
    epubLayoutTimer = window.setTimeout(() => {
        epubLayoutTimer = undefined;
        const progressPercent = getEpubProgressPercent();
        void measureEpubPages().then(() => {
            restoreEpubProgress(progressPercent);
            saveContinuousEpubProgress();
        });
    }, 120);
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
    pdfTextLayerInstances.forEach((textLayer) => textLayer.cancel());
    pdfTextLayerInstances.clear();
    void pdfLoadingTask.value?.destroy();
    pdfLoadingTask.value = null;
    pdfDocument.value = null;
};

const applyPdfTextHighlights = (textLayer: pdfjsLib.TextLayer) => {
    const query = readerSearchQuery.value.trim();
    const queryPattern = query
        ? new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu')
        : null;
    const pageText = textLayer.textContentItemsStr.join(' ');
    const itemOffsets: Array<{ start: number; end: number }> = [];
    let offset = 0;
    for (const text of textLayer.textContentItemsStr) {
        itemOffsets.push({ start: offset, end: offset + text.length });
        offset += text.length + 1;
    }

    const matchesByItem = itemOffsets.map((): Array<{ start: number; end: number }> => []);
    if (queryPattern) {
        for (const match of pageText.matchAll(queryPattern)) {
            if (match.index === undefined) continue;
            const matchStart = match.index;
            const matchEnd = matchStart + match[0].length;
            itemOffsets.forEach(({ start, end }, index) => {
                const overlapStart = Math.max(start, matchStart);
                const overlapEnd = Math.min(end, matchEnd);
                if (overlapStart < overlapEnd) {
                    matchesByItem[index].push({
                        start: overlapStart - start,
                        end: overlapEnd - start
                    });
                }
            });
        }
    }

    textLayer.textDivs.forEach((textDiv, index) => {
        const text = textLayer.textContentItemsStr[index] ?? '';
        const matches = matchesByItem[index];
        if (!matches.length) {
            textDiv.textContent = text;
            return;
        }

        const fragment = document.createDocumentFragment();
        let textOffset = 0;
        for (const match of matches) {
            if (match.start > textOffset) {
                fragment.append(document.createTextNode(text.slice(textOffset, match.start)));
            }
            const mark = document.createElement('mark');
            mark.className = 'pdf-search-highlight';
            mark.textContent = text.slice(match.start, match.end);
            fragment.append(mark);
            textOffset = match.end;
        }
        if (textOffset < text.length) {
            fragment.append(document.createTextNode(text.slice(textOffset)));
        }
        textDiv.replaceChildren(fragment);
    });
};

const renderPdfTextLayer = async (
    page: pdfjsLib.PDFPageProxy,
    viewport: pdfjsLib.PageViewport,
    container: HTMLElement,
    pageNumber: number,
    isCurrentRender: () => boolean
) => {
    pdfTextLayerInstances.get(pageNumber)?.cancel();
    pdfTextLayerInstances.delete(pageNumber);
    container.replaceChildren();

    const textContent = await page.getTextContent();
    if (!isCurrentRender()) return;

    const textLayer = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container,
        viewport
    });
    container.style.width = `${Math.floor(viewport.width)}px`;
    container.style.height = `${Math.floor(viewport.height)}px`;
    container.style.setProperty('--total-scale-factor', String(viewport.scale));
    pdfTextLayerInstances.set(pageNumber, textLayer);
    try {
        await textLayer.render();
    } catch (error) {
        if (error instanceof pdfjsLib.AbortException) return;
        throw error;
    }

    if (!isCurrentRender() || pdfTextLayerInstances.get(pageNumber) !== textLayer) return;
    applyPdfTextHighlights(textLayer);
};

const clearPdfTextLayer = (pageNumber: number, container: HTMLElement) => {
    pdfTextLayerInstances.get(pageNumber)?.cancel();
    pdfTextLayerInstances.delete(pageNumber);
    container.replaceChildren();
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

        const baseViewport = page.getViewport({ scale: 1, rotation: pdfRotation.value });
        const stage = pdfCanvas.value.closest('.pdf-stage');
        const availableWidth = Math.max((stage?.clientWidth ?? 320) - 32, 240);
        const availableHeight = Math.max((stage?.clientHeight ?? 480) - 32, 240);
        const widthScale = availableWidth / baseViewport.width;
        const pageScale = Math.min(widthScale, availableHeight / baseViewport.height);
        const scale = pdfFitMode.value === 'page'
            ? pageScale * zoom.value
            : pdfFitMode.value === 'width'
                ? widthScale * zoom.value
                : Math.min(widthScale, 1.4) * zoom.value;
        const viewport = page.getViewport({ scale, rotation: pdfRotation.value });
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
        if (renderId === pageRenderId && pdfTextLayer.value && pdfPageContainer.value) {
            await renderPdfTextLayer(
                page,
                viewport,
                pdfTextLayer.value,
                currentPage.value,
                () => renderId === pageRenderId && document === pdfDocument.value
            );
            pdfPageContainer.value.style.width = `${Math.floor(viewport.width)}px`;
            pdfPageContainer.value.style.height = `${Math.floor(viewport.height)}px`;
            saveCurrentPageProgress();
        }
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

const setContinuousTextLayer = (element: unknown, index: number) => {
    continuousPdfTextLayers[index] = element instanceof HTMLElement ? element : null;
};

const renderContinuousPdfPage = async (pageNumber: number) => {
    const document = pdfDocument.value;
    const rotation = pdfRotation.value;
    const canvas = continuousPdfCanvases[pageNumber - 1];
    const textLayerContainer = continuousPdfTextLayers[pageNumber - 1];
    const stage = continuousPdfStage.value;
    if (!document || !canvas || !textLayerContainer || !stage || renderingContinuousPdfPages.has(pageNumber)) return;

    renderingContinuousPdfPages.add(pageNumber);
    try {
        const page = await document.getPage(pageNumber);
        if (document !== pdfDocument.value || !readerContinuous.value || rotation !== pdfRotation.value) return;
        const baseViewport = page.getViewport({ scale: 1, rotation });
        const availableWidth = Math.max(stage.clientWidth - 32, 240);
        const widthScale = Math.min(availableWidth / baseViewport.width, 1.4);
        const availableHeight = Math.max(stage.clientHeight - 32, 240);
        const scale = (pdfFitMode.value === 'page'
            ? Math.min(widthScale, availableHeight / baseViewport.height)
            : widthScale) * zoom.value;
        const viewport = page.getViewport({ scale, rotation });
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
        if (document !== pdfDocument.value || rotation !== pdfRotation.value) {
            canvas.width = 0;
            canvas.height = 0;
            return;
        }
        await renderPdfTextLayer(
            page,
            viewport,
            textLayerContainer,
            pageNumber,
            () => document === pdfDocument.value
                && readerContinuous.value
                && rotation === pdfRotation.value
                && visibleContinuousPdfPages.has(pageNumber)
        );
        const displayedWidth = canvas.clientWidth;
        const displayedHeight = canvas.clientHeight;
        textLayerContainer.style.width = `${displayedWidth}px`;
        textLayerContainer.style.height = `${displayedHeight}px`;
        textLayerContainer.style.setProperty(
            '--total-scale-factor',
            String(viewport.scale * displayedWidth / viewport.width)
        );
        if (document === pdfDocument.value && !visibleContinuousPdfPages.has(pageNumber)) {
            canvas.width = 0;
            canvas.height = 0;
            clearPdfTextLayer(pageNumber, textLayerContainer);
        }
    } catch (error) {
        if (document === pdfDocument.value) {
            readerError.value = error instanceof Error
                ? `Não foi possível exibir a página ${pageNumber}: ${error.message}`
                : `Não foi possível exibir a página ${pageNumber}.`;
        }
    } finally {
        renderingContinuousPdfPages.delete(pageNumber);
        if (rotation !== pdfRotation.value && visibleContinuousPdfPages.has(pageNumber)) {
            void renderContinuousPdfPage(pageNumber);
        }
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
                    const textLayerContainer = continuousPdfTextLayers[pageNumber - 1];
                    if (textLayerContainer) clearPdfTextLayer(pageNumber, textLayerContainer);
                }
            }
        });
    }, { root: stage, rootMargin: '120% 0px', threshold: 0.01 });
    continuousPdfPageElements.forEach((element) => {
        if (element) continuousPdfObserver?.observe(element);
    });
};

const scrollToContinuousPage = (pageNumber: number) => {
    if (isEpub.value) {
        const container = textReader.value;
        if (!container) return;
        const pageExtent = readerContinuous.value ? container.clientHeight : getEpubPageWidth(container);
        if (pageExtent <= 0) return;
        container.scrollTo({
            left: readerContinuous.value ? container.scrollLeft : (pageNumber - 1) * pageExtent,
            top: readerContinuous.value ? (pageNumber - 1) * pageExtent : container.scrollTop,
            behavior: 'smooth'
        });
        return;
    }

    const container = continuousPdfStage.value;
    const page = continuousPdfPageElements[pageNumber - 1];
    if (!container || !page) return;
    const top = container.scrollTop + page.getBoundingClientRect().top - container.getBoundingClientRect().top;
    container.scrollTo({ top, behavior: 'smooth' });
};

const getEpubPageWidth = (container: HTMLElement) => {
    const styles = window.getComputedStyle(container);
    const horizontalPadding = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);
    return Math.max(1, container.clientWidth - horizontalPadding);
};

const updateEpubChapterPageStarts = () => {
    const container = textReader.value;
    if (!container || !isEpub.value) return;
    const pageExtent = readerContinuous.value ? container.clientHeight : getEpubPageWidth(container);
    if (pageExtent <= 0) return;
    epubChapterPageStarts.value = Array.from(
        container.querySelectorAll<HTMLElement>('.epub-paged-chapter, .continuous-epub-chapter'),
        (chapter) => {
            const rect = chapter.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const offset = readerContinuous.value
                ? container.scrollTop + rect.top - containerRect.top
                : container.scrollLeft + rect.left - containerRect.left;
            return Math.max(1, Math.floor(Math.max(0, offset) / pageExtent) + 1);
        }
    );
    readerContents.value = readerChapters.value.map((chapter, index) => ({
        title: chapter.title || `Capítulo ${index + 1}`,
        page: epubChapterPageStarts.value[index] ?? 1,
        level: 0
    }));
};

const measureEpubPages = async () => {
    const container = textReader.value;
    const content = epubPagedContent.value;
    if (!container || !isEpub.value || !readerChapters.value.length) return;
    await nextTick();
    if (!readerContinuous.value && content) {
        content.style.setProperty('--epub-page-width', `${getEpubPageWidth(container)}px`);
    }
    await nextTick();
    const extent = readerContinuous.value ? container.clientHeight : getEpubPageWidth(container);
    const contentExtent = readerContinuous.value ? container.scrollHeight : container.scrollWidth;
    if (extent <= 0) return;
    pageCount.value = Math.max(1, Math.ceil(contentExtent / extent));
    currentPage.value = Math.min(pageCount.value, Math.max(1, currentPage.value));
    updateEpubChapterPageStarts();
};

const syncEpubPageFromScroll = () => {
    const container = textReader.value;
    if (!container || !pageCount.value) return;
    const extent = readerContinuous.value ? container.clientHeight : getEpubPageWidth(container);
    const offset = readerContinuous.value ? container.scrollTop : container.scrollLeft;
    if (extent <= 0) return;
    currentPage.value = Math.min(pageCount.value, Math.max(1, Math.floor(offset / extent) + 1));
    updateEpubChapterPageStarts();
};

const getEpubProgressPercent = () => {
    const container = textReader.value;
    if (!container) return 0;
    const maxOffset = readerContinuous.value
        ? container.scrollHeight - container.clientHeight
        : container.scrollWidth - getEpubPageWidth(container);
    const offset = readerContinuous.value ? container.scrollTop : container.scrollLeft;
    return maxOffset > 0 ? Math.min(100, Math.max(0, (offset / maxOffset) * 100)) : 0;
};

const restoreEpubProgress = (percent: number) => {
    const container = textReader.value;
    if (!container) return;
    const boundedPercent = Math.min(100, Math.max(0, percent));
    const maxOffset = readerContinuous.value
        ? container.scrollHeight - container.clientHeight
        : container.scrollWidth - getEpubPageWidth(container);
    const offset = maxOffset * boundedPercent / 100;
    container.scrollTo({
        left: readerContinuous.value ? container.scrollLeft : offset,
        top: readerContinuous.value ? offset : container.scrollTop,
        behavior: 'auto'
    });
    syncEpubPageFromScroll();
    savedReaderPercent.value = boundedPercent;
};

const loadPdfPageRatios = async (pdf: pdfjsLib.PDFDocumentProxy, rotation = pdfRotation.value) => {
    const pageNumbers = Array.from({ length: pageCount.value }, (_, index) => index + 1)
        .sort((left, right) => Math.abs(left - currentPage.value) - Math.abs(right - currentPage.value));
    const ratios = Array.from({ length: pageCount.value }, () => 0);
    for (let start = 0; start < pageNumbers.length; start += 8) {
        const batchPages = pageNumbers.slice(start, start + 8);
        const batch = await Promise.all(
            batchPages.map(async (pageNumber) => {
                const page = await pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale: 1, rotation });
                return { pageNumber, ratio: viewport.width / viewport.height };
            })
        );
        if (pdf !== pdfDocument.value || !readerContinuous.value || rotation !== pdfRotation.value) return;
        batch.forEach(({ pageNumber, ratio }) => {
            ratios[pageNumber - 1] = ratio;
        });
        pdfPageRatios.value = [...ratios];
    }
};

const toggleContinuousReading = async () => {
    if (isPdf.value) {
        const pdf = pdfDocument.value;
        const enableContinuous = !readerContinuous.value;
        continuousPdfObserver?.disconnect();
        continuousPdfObserver = undefined;
        visibleContinuousPdfPages.clear();
        pdfTextLayerInstances.forEach((textLayer) => textLayer.cancel());
        pdfTextLayerInstances.clear();
        readerContinuous.value = enableContinuous;
        if (enableContinuous && pdf) {
            if (pdfPageRatios.value.length !== pageCount.value) {
                pdfPageRatios.value = Array.from({ length: pageCount.value }, () => 0);
            }
            await nextTick();
            observeContinuousPdfPages();
            scrollToContinuousPage(currentPage.value);
            if (pdfPageRatios.value.some((ratio) => ratio === 0)) {
                void loadPdfPageRatios(pdf).catch((error: unknown) => {
                    console.error('Não foi possível carregar as proporções das páginas do PDF.', error);
                });
            }
        } else {
            continuousPdfCanvases.forEach((canvas) => {
                if (canvas) {
                    canvas.width = 0;
                    canvas.height = 0;
                }
            });
            continuousPdfTextLayers.forEach((container, index) => {
                if (container) clearPdfTextLayer(index + 1, container);
            });
            await nextTick();
            await renderPdfPage();
        }
        return;
    }

    if (isEpub.value) {
        const container = textReader.value;
        if (!container) return;
        const progressPercent = getEpubProgressPercent();
        if (!readerContinuous.value) {
            readerContinuous.value = true;
            await nextTick();
        } else {
            readerContinuous.value = false;
            await nextTick();
        }
        await measureEpubPages();
        restoreEpubProgress(progressPercent);
        saveContinuousEpubProgress();
    } else {
        readerContinuous.value = !readerContinuous.value;
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
    epubChapterPageStarts.value = [];
    currentPage.value = 1;
    pageCount.value = 0;
    zoom.value = 1;
    pdfRotation.value = 0;
    pdfFitMode.value = 'width';
    readerContinuous.value = false;
    readerMargin.value = 'medium';
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
            pageCount.value = 0;
            readerContents.value = readerChapters.value.map((chapter, index) => ({
                title: chapter.title || `Capítulo ${index + 1}`,
                page: 1,
                level: 0
            }));
            currentPage.value = 1;
        } else if (isPdf.value) {
            const loadingTask = pdfjsLib.getDocument({
                data: await file.arrayBuffer(),
                wasmUrl: pdfWasmUrl
            });
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
                    await measureEpubPages();
                    restoreEpubProgress(savedPosition?.percent ?? 0);
                    saveContinuousEpubProgress();
                } else if (fileExtension.value === 'txt' || fileExtension.value === 'md') {
                    restoreTextPosition(savedPosition?.percent ?? 0);
                    saveTextProgress();
                }
            }
        }
    }
};

const closeReader = () => {
    if (pdfZoomTimer !== undefined) {
        window.clearTimeout(pdfZoomTimer);
        pdfZoomTimer = undefined;
    }
    if (readerControlsTimer !== undefined) {
        window.clearTimeout(readerControlsTimer);
        readerControlsTimer = undefined;
    }
    if (epubLayoutTimer !== undefined) {
        window.clearTimeout(epubLayoutTimer);
        epubLayoutTimer = undefined;
    }
    if (textProgressTimer !== undefined) {
        window.clearTimeout(textProgressTimer);
        textProgressTimer = undefined;
        if (isEpub.value) {
            saveContinuousEpubProgress();
        } else {
            saveTextProgress();
        }
    }
    isReaderOpen.value = false;
    if (Capacitor.isNativePlatform() && isFullscreen.value) {
        isFullscreen.value = false;
        void StatusBar.show().catch((error: unknown) => {
            console.error('Não foi possível restaurar a barra de status ao fechar o leitor.', error);
        });
    }
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
onMounted(() => window.addEventListener('resize', queueEpubLayoutUpdate));
onBeforeUnmount(() => window.removeEventListener('resize', queueEpubLayoutUpdate));

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

const setPdfPinchPreview = (scale: number) => {
    const previewScale = String(scale);
    if (readerContinuous.value) {
        continuousPdfPageElements.forEach((page) => {
            if (page) page.style.setProperty('--pinch-preview-scale', previewScale);
        });
        return;
    }

    pdfPageContainer.value?.style.setProperty('--pinch-preview-scale', previewScale);
};

const clearPdfPinchPreview = () => {
    continuousPdfPageElements.forEach((page) => {
        page?.style.removeProperty('--pinch-preview-scale');
    });
    pdfPageContainer.value?.style.removeProperty('--pinch-preview-scale');
};

const finishPinchGesture = () => {
    if (touchGesture !== 'pinch') return;

    if (isPdf.value) {
        const nextZoom = Math.min(2.4, Math.max(0.7, touchStartZoom * pinchPreviewScale));
        clearPdfPinchPreview();
        if (nextZoom !== zoom.value) {
            zoom.value = nextZoom;
            pdfFitMode.value = 'manual';
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
        }
    }

    touchGesture = null;
    touchStartDistance = 0;
    pinchPreviewScale = 1;
    preventReaderClickAfterGesture();
    showReaderControls();
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
        pinchPreviewScale = 1;
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
    if (isPdf.value) {
        pinchPreviewScale = nextZoom / touchStartZoom;
        setPdfPinchPreview(pinchPreviewScale);
    } else if (isEpub.value) {
        readerTextZoom.value = nextZoom;
        queueEpubLayoutUpdate();
    }
};

const onReaderTouchEnd = (event: TouchEvent) => {
    if (!isMobileReader()) return;
    if (touchGesture === 'pinch') {
        if (event.touches.length < 2) finishPinchGesture();
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
    if (touchGesture === 'pinch') {
        clearPdfPinchPreview();
        pinchPreviewScale = 1;
    }
    touchGesture = null;
};

const toggleReaderPanel = (panel: ReaderPanel) => {
    activeReaderPanel.value = activeReaderPanel.value === panel ? null : panel;
    showReaderControls();
};

const getIonicControlValue = (event: Event): unknown => {
    if (!(event instanceof CustomEvent)
        || typeof event.detail !== 'object'
        || event.detail === null
        || !('value' in event.detail)
    ) return undefined;
    return event.detail.value;
};

const setReaderMode = (event: Event) => {
    const mode = getIonicControlValue(event);
    if (mode !== 'continuous' && mode !== 'single') return;
    if ((mode === 'continuous') !== readerContinuous.value) void toggleContinuousReading();
};

const setReaderMargin = (event: Event) => {
    const margin = getIonicControlValue(event);
    if (margin === 'narrow' || margin === 'medium' || margin === 'wide') {
        readerMargin.value = margin;
        queueEpubLayoutUpdate();
    }
};

const setReaderTheme = (theme: typeof readerThemes[number]['value'], event: MouseEvent) => {
    readerTheme.value = theme;
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    requestAnimationFrame(() => {
        button.blur();
        button.shadowRoot?.querySelector<HTMLElement>('button')?.blur();
    });
};

const setPdfFitMode = (mode: 'width' | 'page') => {
    if (pdfZoomTimer !== undefined) {
        window.clearTimeout(pdfZoomTimer);
        pdfZoomTimer = undefined;
    }
    pdfFitMode.value = mode;
    zoom.value = 1;
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
    if (isEpub.value) {
        const targetPage = Math.min(pageCount.value, Math.max(1, page));
        currentPage.value = targetPage;
        scrollToContinuousPage(targetPage);
        showReaderControls();
        return;
    }
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
                        page: epubChapterPageStarts.value[index] ?? 1,
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
        if (Capacitor.isNativePlatform()) {
            if (isFullscreen.value) {
                await StatusBar.show();
                isFullscreen.value = false;
            } else {
                await StatusBar.hide();
                isFullscreen.value = true;
            }
        } else if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await document.documentElement.requestFullscreen();
        }
    } catch (error) {
        console.error('Não foi possível alternar para tela cheia.', error);
        const toast = await toastController.create({
            message: 'Não foi possível alterar a tela cheia neste dispositivo.',
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

const escapePrintHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const openDocumentForPrint = async () => {
    if (!item.value || !readerPdfBlob.value || isPrinting.value) return;

    const itemToPrint = item.value;
    isPrinting.value = true;
    let temporaryPrintFile: string | null = null;
    try {
        if (isPdf.value) {
            if (Capacitor.isNativePlatform()) {
                const path = `nexusvault-print-${itemToPrint.id}-${Date.now()}.pdf`;
                const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path });
                temporaryPrintFile = path;
                await FileTransfer.downloadFile({ url: itemToPrint.download_url, path: uri });
                await Printer.printPdf({ name: itemToPrint.title, path: uri });
            } else {
                const documentUrl = URL.createObjectURL(readerPdfBlob.value);
                try {
                    await Printer.printPdf({ name: itemToPrint.title, path: documentUrl });
                } finally {
                    URL.revokeObjectURL(documentUrl);
                }
            }
        } else {
            const printContent = isEpub.value
                    ? readerChapters.value.map((chapter) =>
                        `<section><h2>${escapePrintHtml(chapter.title)}</h2><pre>${escapePrintHtml(chapter.text)}</pre></section>`
                    ).join('')
                    : `<pre>${escapePrintHtml(readerText.value)}</pre>`;
            await Printer.printHtml({
                name: itemToPrint.title,
                html: `<!doctype html><html><head><meta charset="utf-8"><title>${escapePrintHtml(itemToPrint.title)}</title><style>body{font-family:serif;font-size:12pt;line-height:1.6;color:#111}h1{font-size:20pt}h2{font-size:16pt;break-before:page}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}section{break-after:page}@media print{body{margin:18mm}}</style></head><body><h1>${escapePrintHtml(itemToPrint.title)}</h1>${printContent}</body></html>`
            });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido.';
        const toast = await toastController.create({
            message: `Não foi possível imprimir o documento: ${message}`,
            duration: 3500,
            color: 'danger',
            position: 'bottom'
        });
        await toast.present();
    } finally {
        if (temporaryPrintFile) {
            await Filesystem.deleteFile({ directory: Directory.Cache, path: temporaryPrintFile }).catch((error: unknown) => {
                console.error('Não foi possível remover o arquivo temporário de impressão.', error);
            });
        }
        isPrinting.value = false;
    }
};

const getDownloadFileName = (title: string, sourceFileName: string) => {
    const extension = getFileExtension(sourceFileName).toLocaleLowerCase('en-US');
    const titleWithExtension = extension && title.toLocaleLowerCase('en-US').endsWith(`.${extension}`)
        ? title.slice(0, -(extension.length + 1))
        : title;
    const safeTitle = titleWithExtension
        .replace(/[<>:"/\\|?*]/g, '_')
        .trim()
        .replace(/[. ]+$/g, '') || 'documento';
    return extension ? `${safeTitle}.${extension}` : safeTitle;
};

const changePage = (amount: number) => {
    const nextPage = Math.min(pageCount.value, Math.max(1, currentPage.value + amount));
    if (nextPage === currentPage.value) return;
    currentPage.value = nextPage;
    if (isMobileReader()) showReaderControls();
    if (readerContinuous.value) {
        scrollToContinuousPage(nextPage);
        if (isEpub.value) saveContinuousEpubProgress();
        else saveCurrentPageProgress();
        return;
    }
    if (isPdf.value) void renderPdfPage();
    if (isEpub.value) {
        scrollToContinuousPage(nextPage);
        saveContinuousEpubProgress();
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
    if (!container) return;
    const updatedPageCount = Math.max(1, Math.ceil(container.scrollHeight / container.clientHeight));
    if (pageCount.value !== updatedPageCount) pageCount.value = updatedPageCount;
    syncEpubPageFromScroll();
    if (textProgressTimer !== undefined) window.clearTimeout(textProgressTimer);
    textProgressTimer = window.setTimeout(() => {
        textProgressTimer = undefined;
        saveContinuousEpubProgress();
    }, 500);
};

const onEpubPagedScroll = () => {
    const container = textReader.value;
    if (!container) return;
    const updatedPageCount = Math.max(1, Math.ceil(container.scrollWidth / getEpubPageWidth(container)));
    if (pageCount.value !== updatedPageCount) pageCount.value = updatedPageCount;
    syncEpubPageFromScroll();
    if (textProgressTimer !== undefined) window.clearTimeout(textProgressTimer);
    textProgressTimer = window.setTimeout(() => {
        textProgressTimer = undefined;
        saveContinuousEpubProgress();
    }, 500);
};

const onEpubPagedWheel = (event: WheelEvent) => {
    const container = textReader.value;
    if (!container) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (delta === 0) return;
    event.preventDefault();
    container.scrollBy({ left: delta, behavior: 'auto' });
};

const saveContinuousEpubProgress = () => {
    const container = textReader.value;
    if (!container) return;
    if (readerContinuous.value) {
        const updatedPageCount = Math.max(1, Math.ceil(container.scrollHeight / container.clientHeight));
        if (pageCount.value !== updatedPageCount) pageCount.value = updatedPageCount;
    } else {
        const pageWidth = getEpubPageWidth(container);
        const updatedPageCount = Math.max(1, Math.ceil(container.scrollWidth / pageWidth));
        if (pageCount.value !== updatedPageCount) pageCount.value = updatedPageCount;
    }
    syncEpubPageFromScroll();
    savedReaderPercent.value = getEpubProgressPercent();
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
    if (pdfZoomTimer !== undefined) {
        window.clearTimeout(pdfZoomTimer);
        pdfZoomTimer = undefined;
    }
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

const setZoomFromRange = (event: Event) => {
    const value = getIonicControlValue(event);
    if (typeof value !== 'number' || !Number.isFinite(value)) return;
    pdfFitMode.value = 'manual';
    zoom.value = Math.min(2.4, Math.max(0.7, Math.round(value * 10) / 10));
    if (pdfZoomTimer !== undefined) window.clearTimeout(pdfZoomTimer);
    pdfZoomTimer = window.setTimeout(() => {
        pdfZoomTimer = undefined;
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
    }, 100);
};

const rotatePdfPage = () => {
    if (!isPdf.value || readerLoading.value) return;
    pdfRotation.value = (pdfRotation.value + 90) % 360;
    activeRenderTask.value?.cancel();
    pdfTextLayerInstances.forEach((textLayer) => textLayer.cancel());
    pdfTextLayerInstances.clear();
    if (!readerContinuous.value) {
        void renderPdfPage();
        return;
    }

    continuousPdfObserver?.disconnect();
    visibleContinuousPdfPages.clear();
    continuousPdfCanvases.forEach((canvas) => {
        if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
        }
    });
    continuousPdfTextLayers.forEach((container, index) => {
        if (container) clearPdfTextLayer(index + 1, container);
    });
    pdfPageRatios.value = Array.from({ length: pageCount.value }, () => 0);
    const pdf = pdfDocument.value;
    if (!pdf) return;
    void nextTick().then(() => {
        observeContinuousPdfPages();
        scrollToContinuousPage(currentPage.value);
        void loadPdfPageRatios(pdf, pdfRotation.value).catch((error: unknown) => {
            console.error('Não foi possível carregar as proporções das páginas após girar o PDF.', error);
        });
    });
};

watch(
    readerSearchQuery,
    () => {
        pdfTextLayerInstances.forEach(applyPdfTextHighlights);
    }
);

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
        const fileName = getDownloadFileName(itemToDownload.title, itemToDownload.file_name);
        if (Capacitor.isNativePlatform()) {
            await Filesystem.mkdir({
                directory: Directory.Documents,
                path: 'NexusVault',
                recursive: true
            });
            const { uri } = await Filesystem.getUri({
                directory: Directory.Documents,
                path: `NexusVault/${fileName}`
            });
            await FileTransfer.downloadFile({
                url: itemToDownload.download_url,
                path: uri
            });
        } else {
            const file = await downloadLibraryDocument(itemToDownload.file_path);
            const fileUrl = URL.createObjectURL(file);
            const downloadLink = document.createElement('a');
            downloadLink.href = fileUrl;
            downloadLink.download = fileName;
            document.body.append(downloadLink);
            downloadLink.click();
            downloadLink.remove();
            window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
        }

        void recordLibraryItemMetric(itemToDownload.id, 'downloads').catch((metricError: unknown) => {
            console.error('Não foi possível registrar o download do documento.', metricError);
        });
        if (Capacitor.isNativePlatform()) {
            const toast = await toastController.create({
                message: 'Download concluído. Arquivo salvo em Documentos/NexusVault.',
                duration: 3500,
                position: 'bottom'
            });
            await toast.present();
        }
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
    grid-template-columns: minmax(0, 0.34fr) minmax(0, 1fr);
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

.cover-art {
    position: relative;
    display: grid;
    width: 100%;
    min-height: 240px;
    place-items: center;
}

.collection-save-button {
    position: absolute;
    z-index: 1;
    top: var(--space-sm);
    right: var(--space-sm);
    width: 42px;
    height: 42px;
    margin: 0;
    --background: var(--color-surface);
    --background-hover: var(--color-surface-alt);
    --background-activated: var(--color-surface-alt);
    --color: var(--color-brand-primary);
    --border-radius: 50%;
    --box-shadow: var(--shadow-soft);
}

.collection-save-button::part(native) {
    width: 42px;
    height: 42px;
    padding: 0;
    border: 1px solid var(--color-border-soft);
    border-radius: 50%;
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
    min-width: 0;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    gap: var(--space-md);
}

.summary-info .summary-category,
.summary-info .summary-content-type {
    min-width: 0;
    max-width: 100%;
    margin: 0;
    overflow-wrap: anywhere;
    white-space: normal;
}

.summary-info .summary-category {
    flex: 0 1 auto;
}

.summary-info .summary-content-type {
    flex: 0 0 auto;
}

.summary-info .nv-page-title {
    margin-top: var(--space-sm);
}

.document-title-main,
.document-title-subtitle {
    display: block;
}

.document-title-main {
    font-weight: 700;
}

.document-title-subtitle {
    margin-top: 0.15em;
    font-size: 0.72em;
    font-weight: 400;
    line-height: 1.35;
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
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
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
    width: auto;
    flex: 0 0 auto;
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
    width: 100%;
    grid-column: 1 / -1;
    flex: 0 0 auto;
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

.reader-section.reader-fullscreen {
    height: 100dvh;
}

.reader-heading {
    display: grid;
    flex: 0 0 auto;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-md);
}

.reader-heading-actions {
    display: flex;
    align-items: center;
    gap: 2px;
}

.reader-icon-button {
    --color: var(--color-text-primary);
    min-width: 40px;
    min-height: 40px;
    margin: 0;
}

.reader-format-button {
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: -0.08em;
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

.reader-heading-tool {
    position: relative;
    z-index: 4;
    display: flex;
    margin: 0;
}

.reader-panel-anchor {
    order: 0;
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

.reader-file-options {
    display: grid;
}

.reader-file-options ion-button {
    --color: var(--color-text-primary);
    justify-content: flex-start;
    margin: 0;
    text-transform: none;
}

.reader-settings-zoom {
    display: inline-flex;
    min-width: 4ch;
    align-items: center;
    justify-content: center;
    color: var(--reader-page-color, var(--color-text-primary));
    font-variant-numeric: tabular-nums;
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
    --background: transparent;
    --background-activated: transparent;
    --background-focused: transparent;
    --background-hover: transparent;
    margin: 0;
    text-transform: none;
}

.reader-settings ion-button.selected {
    --background: var(--color-brand-primary);
    --background-activated: var(--color-brand-primary);
    --background-focused: var(--color-brand-primary);
    --background-hover: var(--color-brand-primary);
    --color: var(--color-white);
}

.reader-settings ion-button.reader-theme-swatch {
    display: block;
    width: 40px;
    min-width: 40px;
    height: 40px;
    min-height: 40px;
    flex: 0 0 40px;
    align-self: center;
    box-sizing: border-box;
    border: 2px solid transparent;
    border-radius: 50%;
    aspect-ratio: 1;
    --border-radius: 50%;
    --border-width: 0;
    --padding-top: 0;
    --padding-bottom: 0;
    --padding-start: 0;
    --padding-end: 0;
}

.reader-settings ion-button.reader-theme-swatch::part(native) {
    width: 100%;
    min-width: 0;
    height: 100%;
    min-height: 0;
    padding: 0;
    border-radius: 50%;
    box-shadow: none;
}

.reader-settings ion-button.reader-theme-swatch:focus:not(:focus-visible)::part(native),
.reader-settings ion-button.reader-theme-swatch:focus-within::part(native) {
    outline: none;
    box-shadow: none;
}

.reader-settings ion-button.reader-theme-swatch:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 3px;
}

.reader-settings ion-button.reader-theme-swatch-light {
    --background: #fff;
    --background-activated: #f5f5f5;
    --background-focused: #f5f5f5;
    --background-hover: #f5f5f5;
    --color: #e0a400;
}

.reader-settings ion-button.reader-theme-swatch-sepia {
    --background: #eadbbd;
    --background-activated: #dfcda8;
    --background-focused: #dfcda8;
    --background-hover: #dfcda8;
    --color: #70552e;
}

.reader-settings ion-button.reader-theme-swatch-dark {
    --background: #2e2e37;
    --background-activated: #383842;
    --background-focused: #383842;
    --background-hover: #383842;
    --color: #f1eee9;
}

.reader-settings ion-button.reader-theme-swatch.selected {
    border-color: var(--color-brand-primary);
}

.reader-settings fieldset.reader-theme-options {
    display: grid;
    grid-template-columns: repeat(3, 40px);
    justify-content: start;
    gap: var(--space-sm);
}

.reader-settings .reader-settings-segment {
    width: 100%;
    min-width: 0;
    --background: var(--reader-page-background, var(--color-surface));
    --background-checked: transparent;
    --color: var(--reader-page-color, var(--color-text-primary));
    --color-checked: var(--color-brand-primary);
    --indicator-color: var(--color-brand-primary);
    --text-transform: none;
    --letter-spacing: normal;
}

.reader-settings .reader-settings-segment ion-segment-button {
    min-width: 0;
    min-height: 40px;
    --background-checked: transparent;
    --color: var(--reader-page-color, var(--color-text-primary));
    --color-checked: var(--color-brand-primary);
    --indicator-color: var(--color-brand-primary);
}

.reader-settings .reader-settings-segment ion-segment-button::part(native) {
    color: var(--reader-page-color, var(--color-text-primary));
    font-weight: 600;
    text-transform: none;
}

.reader-settings .reader-settings-segment ion-segment-button.segment-button-checked::part(native) {
    color: var(--color-brand-primary);
}

.reader-settings .reader-settings-segment ion-label {
    color: var(--reader-page-color, var(--color-text-primary)) !important;
    opacity: 1;
}

.reader-settings .reader-settings-segment ion-segment-button.segment-button-checked ion-label {
    color: var(--color-brand-primary) !important;
}

.reader-settings .reader-zoom-slider {
    display: flex;
    grid-column: 1 / -1;
    align-items: center;
    gap: var(--space-xs);
}

.reader-settings .reader-zoom-slider ion-button {
    flex: 0 0 auto;
}

.reader-settings .reader-range {
    min-width: 0;
    flex: 1;
    padding-inline: var(--space-xs);
    --bar-background: var(--color-border-soft);
    --bar-background-active: var(--color-brand-primary);
    --knob-background: var(--color-brand-primary);
    --pin-background: var(--color-brand-primary);
    --pin-color: var(--color-white);
}

.reader-rotation-value {
    margin-left: var(--space-xs);
    font-variant-numeric: tabular-nums;
}

.reader-section.reader-margin-narrow .text-reader {
    padding: 0.65rem;
}

.reader-section.reader-margin-medium .text-reader {
    padding: 1rem;
}

.reader-section.reader-margin-wide .text-reader {
    padding: clamp(1.25rem, 5vw, 2.5rem);
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
    order: 2;
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
    order: 1;
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
    position: relative;
    width: min(100%, 900px);
    flex: 0 0 auto;
    place-items: center;
    overflow: hidden;
    background: white;
    box-shadow: var(--shadow-soft);
    transform: scale(var(--pinch-preview-scale, 1));
    transform-origin: center;
    will-change: transform;
}

.continuous-pdf-page canvas {
    display: block;
    max-width: 100%;
    height: auto;
}

.pdf-page-container {
    position: relative;
    flex: 0 0 auto;
    margin: auto;
    transform: scale(var(--pinch-preview-scale, 1));
    transform-origin: center;
    will-change: transform;
}

.pdf-page-container canvas {
    display: block;
}

.pdf-text-layer {
    position: absolute;
    z-index: 1;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    color-scheme: only light;
    line-height: 1;
    text-align: initial;
    --min-font-size: 1;
    --min-font-size-inv: 1;
    --text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size));
}

.continuous-pdf-page .pdf-text-layer {
    inset: auto;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.pdf-text-layer .markedContent {
    display: contents;
}

.pdf-text-layer > span,
.pdf-text-layer .markedContent span {
    position: absolute;
    color: transparent;
    white-space: pre;
    transform-origin: 0 0;
    font-size: calc(var(--text-scale-factor) * var(--font-height));
    --scale-x: 1;
    --rotate: 0deg;
    transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
}

.pdf-search-highlight {
    border-radius: 2px;
    background: rgb(255 214 0 / 55%);
    color: transparent;
}

.continuous-epub-reader {
    min-width: 0;
    min-height: 0;
    flex: 1 1 0;
    scroll-behavior: smooth;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
}

.epub-paged-reader {
    min-width: 0;
    min-height: 0;
    flex: 1 1 0;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
}

.epub-paged-content {
    width: 100%;
    height: 100%;
    column-width: var(--epub-page-width, 100%);
    column-gap: 0;
    column-fill: auto;
    column-rule: 0;
}

.epub-paged-chapter {
    break-inside: auto;
    white-space: normal;
}

.epub-paged-chapter + .epub-paged-chapter {
    break-before: column;
}

.epub-paged-chapter h3 {
    margin: 0 0 var(--space-md);
    break-after: avoid;
}

.epub-paged-chapter p {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
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

.review-empty .rating-stars-empty {
    color: var(--color-text-muted);
    font-size: 1.05rem;
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

@media (max-width: 820px) {
    .document-summary {
        grid-template-columns: minmax(0, 1fr);
    }

    .cover-panel {
        min-height: 0;
        align-self: center;
        padding: 0;
    }

    .cover-art {
        width: min(100%, 220px);
        min-height: 0;
    }

    .cover-panel img {
        width: min(100%, 220px);
        height: 260px;
        min-height: 0;
        max-height: 300px;
    }
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
        bottom: calc(env(safe-area-inset-bottom, 0px) + 76px);
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

    .reader-heading-actions {
        gap: 0;
    }

    .reader-icon-button {
        min-width: 36px;
        min-height: 36px;
    }

    .reader-panel-anchor {
        position: absolute;
        z-index: 3;
        top: calc(env(safe-area-inset-top, 0px) + 52px);
        right: 8px;
        margin: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .reader-heading-tool {
        position: relative;
        top: auto;
        right: auto;
        z-index: 4;
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

    .reader-settings .reader-settings-segment {
        grid-column: 1 / -1;
        width: 100%;
    }

    .reader-settings .reader-settings-segment ion-segment-button {
        min-width: 0;
        font-size: 0.72rem;
    }

    .reader-settings .reader-zoom-slider {
        grid-column: 1 / -1;
    }

    .reader-toolbar {
        position: absolute;
        z-index: 4;
        right: 0;
        bottom: 0;
        left: 0;
        width: 100%;
        max-width: none;
        flex-wrap: nowrap;
        justify-content: center;
        gap: var(--space-sm);
        margin: 0;
        padding: 8px 56px calc(env(safe-area-inset-bottom, 0px) + 8px);
        border-top: 1px solid var(--color-border-soft);
        border-radius: 0;
        background: var(--reader-page-background, var(--color-surface));
        box-shadow: 0 -4px 16px rgb(0 0 0 / 8%);
        transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .reader-toolbar.reader-controls-hidden {
        transform: translateY(100%);
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
        bottom: calc(env(safe-area-inset-bottom, 0px) + 56px);
        margin: 0;
        overflow: hidden;
    }

    .reader-body-epub-continuous {
        touch-action: pan-y;
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

    .cover-art {
        width: min(100%, 220px);
        min-height: 0;
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

    .summary-info .summary-category,
    .summary-info .summary-content-type {
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
