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
                    <RouterLink class="back-link" :to="{ name: 'Search' }">
                        <ion-icon :icon="arrowBackOutline" aria-hidden="true" />
                        Voltar ao acervo
                    </RouterLink>

                    <section class="document-summary nv-surface" aria-labelledby="document-title">
                        <div class="cover-panel">
                            <img v-if="item.cover_url" :src="item.cover_url" :alt="`Capa de ${item.title}`" />
                            <ion-icon v-else :icon="documentTextOutline" aria-hidden="true" />
                        </div>

                        <div class="summary-info">
                            <div class="summary-topline">
                                <p class="nv-eyebrow">{{ item.category }} · {{ item.content_type }}</p>
                                <ion-button class="report-button" fill="clear" type="button" aria-label="Denunciar livro">
                                    <ion-icon slot="start" :icon="flagOutline" />
                                    Denunciar livro
                                </ion-button>
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
                            <div class="summary-actions" aria-label="Ações do documento">
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

                    <section v-if="isReaderOpen" class="reader-section nv-surface" aria-labelledby="reader-title">
                        <div class="reader-heading">
                            <div>
                                <h2 id="reader-title" class="section-title">Leitor de documentos</h2>
                                <p class="reader-caption">{{ item.title }}</p>
                            </div>
                            <ion-button class="reader-close" fill="clear" type="button" @click="closeReader">
                                Fechar leitor
                            </ion-button>
                        </div>

                        <div v-if="isPdf || isEpub" class="reader-toolbar" aria-label="Controles do leitor">
                            <ion-button class="reader-control" fill="outline" type="button"
                                :disabled="readerLoading || currentPage <= 1" aria-label="Página anterior"
                                @click="changePage(-1)">
                                <ion-icon slot="icon-only" :icon="arrowBackOutline" />
                            </ion-button>
                            <span class="reader-page" aria-live="polite">
                                {{ pageCount ? `${isEpub ? 'Capítulo' : 'Página'} ${currentPage} de ${pageCount}` : `Carregando ${isEpub ? 'capítulos' : 'páginas'}...` }}
                            </span>
                            <ion-button class="reader-control" fill="outline" type="button"
                                :disabled="readerLoading || currentPage >= pageCount" :aria-label="isEpub ? 'Próximo capítulo' : 'Próxima página'"
                                @click="changePage(1)">
                                <ion-icon slot="icon-only" :icon="arrowForwardOutline" />
                            </ion-button>
                            <template v-if="isPdf">
                                <span class="reader-toolbar-spacer" />
                                <ion-button class="reader-control" fill="outline" type="button"
                                    :disabled="readerLoading || zoom <= 0.7" aria-label="Diminuir zoom"
                                    @click="changeZoom(-0.2)">
                                    <ion-icon slot="icon-only" :icon="removeOutline" />
                                </ion-button>
                                <span class="reader-zoom">{{ Math.round(zoom * 100) }}%</span>
                                <ion-button class="reader-control" fill="outline" type="button"
                                    :disabled="readerLoading || zoom >= 2.4" aria-label="Aumentar zoom"
                                    @click="changeZoom(0.2)">
                                    <ion-icon slot="icon-only" :icon="addOutline" />
                                </ion-button>
                            </template>
                        </div>

                        <div v-if="readerLoading" class="reader-feedback" role="status">
                            <ion-spinner name="crescent" />
                            <span>Preparando documento...</span>
                        </div>
                        <p v-else-if="readerError" class="reader-feedback reader-error" role="alert">
                            {{ readerError }}
                            <a v-if="isEpub" :href="item.download_url" target="_blank" rel="noopener noreferrer">
                                Abrir o EPUB em uma nova aba
                            </a>
                        </p>
                        <div v-else-if="isPdf" class="pdf-stage" aria-label="Página do documento">
                            <canvas ref="pdfCanvas" />
                        </div>
                        <article v-else-if="isEpub" class="text-reader epub-reader" aria-label="Conteúdo do capítulo">
                            <h3 v-if="readerChapters[currentPage - 1]?.title">{{ readerChapters[currentPage - 1].title }}</h3>
                            <p>{{ readerText }}</p>
                        </article>
                        <pre v-else class="text-reader">{{ readerText }}</pre>
                    </section>

                    <section class="detail-section nv-surface" aria-labelledby="description-title">
                        <h2 id="description-title" class="section-title">Descrição</h2>
                        <p v-if="item.description" class="section-copy">{{ item.description }}</p>
                        <p v-else class="section-copy muted">Este documento ainda não possui uma descrição.</p>
                    </section>

                    <section class="detail-section reviews-section nv-surface" aria-labelledby="reviews-title">
                        <div class="section-heading">
                            <div>
                                <h2 id="reviews-title" class="section-title">Avaliações da comunidade</h2>
                                <p class="section-copy muted">
                                    {{ reviewsError ? 'As avaliações estão indisponíveis no momento.' : reviews.length ? `${reviews.length} ${reviews.length === 1 ? 'avaliação recente' : 'avaliações recentes'}` : 'Ainda não há avaliações para este documento.' }}
                                </p>
                            </div>
                            <div v-if="reviews.length" class="rating-summary" :aria-label="`Média ${averageRating} de 5`">
                                <span class="rating-stars" aria-hidden="true">{{ starRating(averageRating) }}</span>
                                <strong>{{ averageRating.toFixed(1) }}</strong>
                            </div>
                        </div>
                        <p v-if="reviewsError" class="reviews-error" role="alert">{{ reviewsError }}</p>
                        <ul v-else-if="reviews.length" class="review-list">
                            <li v-for="review in reviews" :key="review.id" class="review-item">
                                <div class="review-avatar" aria-hidden="true">
                                    <ion-icon :icon="personCircleOutline" />
                                </div>
                                <div class="review-body">
                                    <div class="review-heading">
                                        <strong>Leitor da comunidade</strong>
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
    </IonPage>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { IonButton, IonContent, IonIcon, IonPage, IonSpinner, toastController } from '@ionic/vue';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import {
    addOutline,
    arrowForwardOutline,
    arrowBackOutline,
    bookOutline,
    calendarOutline,
    documentOutline,
    documentTextOutline,
    downloadOutline,
    flagOutline,
    languageOutline,
    personCircleOutline,
    removeOutline
} from 'ionicons/icons';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import { getPublicProfile } from '@/services/authService';
import { downloadLibraryDocument, getPublicLibraryItem, listRelatedPublicLibraryItems } from '@/services/libraryService';
import { useLibraryItemsSync } from '@/composables/useLibraryItemsSync';
import { listPublicDocumentReviews } from '@/services/publicReviewService';
import type { PublicDocumentReview } from '@/services/publicReviewService';
import type { PublicLibraryItem, PublicLibraryItemDetails } from '@/types/library';
import { getFileExtension } from '@/utils/getFileExtension';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const route = useRoute();
const item = ref<PublicLibraryItemDetails | null>(null);
const reviews = ref<PublicDocumentReview[]>([]);
const relatedItems = ref<PublicLibraryItem[]>([]);
const reviewsError = ref('');
const relatedError = ref('');
const uploaderName = ref('');
const loading = ref(true);
const errorMessage = ref('');
const isDownloading = ref(false);
const isReaderOpen = ref(false);
const readerLoading = ref(false);
const readerError = ref('');
const readerText = ref('');
const readerChapters = ref<{ title: string; text: string }[]>([]);
const currentPage = ref(1);
const pageCount = ref(0);
const zoom = ref(1);
const pdfCanvas = ref<HTMLCanvasElement | null>(null);
const pdfDocument = shallowRef<pdfjsLib.PDFDocumentProxy | null>(null);
const pdfLoadingTask = shallowRef<pdfjsLib.PDFDocumentLoadingTask | null>(null);
const activeRenderTask = shallowRef<pdfjsLib.RenderTask | null>(null);
let readerRequestId = 0;
let pageRenderId = 0;
const averageRating = computed(() => reviews.value.reduce((total, review) => total + review.rating, 0) / reviews.value.length);
const fileExtension = computed(() => getFileExtension(item.value?.file_name ?? '').toLowerCase());
const isPdf = computed(() => fileExtension.value === 'pdf');
const isEpub = computed(() => fileExtension.value === 'epub');

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
        const availableWidth = Math.max(pdfCanvas.value.parentElement?.clientWidth ?? 0, 320);
        const scale = Math.min(availableWidth / baseViewport.width, 1.4) * zoom.value;
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
    } catch (error) {
        if (error instanceof Error && error.name === 'RenderingCancelledException') return;
        if (renderId === pageRenderId) {
            readerError.value = error instanceof Error
                ? `Não foi possível exibir esta página: ${error.message}`
                : 'Não foi possível exibir esta página.';
        }
    }
};

const openReader = async () => {
    if (!item.value) return;
    isReaderOpen.value = true;
    readerLoading.value = true;
    readerError.value = '';
    readerText.value = '';
    readerChapters.value = [];
    currentPage.value = 1;
    pageCount.value = 0;
    zoom.value = 1;
    clearReaderDocument();
    const requestId = ++readerRequestId;

    try {
        const file = await downloadLibraryDocument(item.value.file_path);
        if (requestId !== readerRequestId) return;

        if (isEpub.value) {
            readerChapters.value = await loadEpubChapters(file);
            if (requestId !== readerRequestId) return;
            pageCount.value = readerChapters.value.length;
            readerText.value = readerChapters.value[0].text;
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
            await nextTick();
            await renderPdfPage();
        } else if (fileExtension.value === 'txt' || fileExtension.value === 'md') {
            readerText.value = await file.text();
        } else {
            readerError.value = 'Este formato não pode ser exibido no leitor integrado. Baixe o arquivo para abri-lo no seu dispositivo.';
        }
    } catch (error) {
        if (requestId !== readerRequestId) return;
        readerError.value = error instanceof Error
            ? `Não foi possível carregar o documento: ${error.message}`
            : 'Não foi possível carregar o documento.';
    } finally {
        if (requestId === readerRequestId) readerLoading.value = false;
    }
};

const closeReader = () => {
    isReaderOpen.value = false;
    readerRequestId += 1;
    readerLoading.value = false;
    readerChapters.value = [];
    clearReaderDocument();
};

const changePage = (amount: number) => {
    currentPage.value = Math.min(pageCount.value, Math.max(1, currentPage.value + amount));
    if (isPdf.value) void renderPdfPage();
    if (isEpub.value) readerText.value = readerChapters.value[currentPage.value - 1]?.text ?? '';
};

const changeZoom = (amount: number) => {
    zoom.value = Math.min(2.4, Math.max(0.7, Math.round((zoom.value + amount) * 10) / 10));
    void renderPdfPage();
};

watch(
    () => route.params.id,
    () => closeReader()
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

    isDownloading.value = true;
    try {
        const file = await downloadLibraryDocument(item.value.file_path);
        const fileUrl = URL.createObjectURL(file);
        const downloadLink = document.createElement('a');
        downloadLink.href = fileUrl;
        downloadLink.download = item.value.file_name;
        document.body.append(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
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

watch(
    () => route.params.id,
    async (id) => {
        item.value = null;
        reviews.value = [];
        relatedItems.value = [];
        errorMessage.value = '';
        reviewsError.value = '';
        relatedError.value = '';
        uploaderName.value = '';
        loading.value = true;

        if (typeof id !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) {
            errorMessage.value = 'Identificador do documento inválido.';
            loading.value = false;
            return;
        }

        try {
            item.value = await getPublicLibraryItem(id);
            if (!item.value) errorMessage.value = 'O documento solicitado não foi encontrado.';
            if (item.value) {
                const [reviewResult, relatedResult, uploaderResult] = await Promise.allSettled([
                    listPublicDocumentReviews(id),
                    listRelatedPublicLibraryItems(item.value),
                    getPublicProfile(item.value.uploaded_by)
                ]);

                if (reviewResult.status === 'fulfilled') {
                    reviews.value = reviewResult.value;
                } else {
                    reviewsError.value = reviewResult.reason instanceof Error
                        ? `Não foi possível carregar as avaliações: ${reviewResult.reason.message}`
                        : 'Não foi possível carregar as avaliações.';
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

.back-link:hover {
    color: var(--color-text-primary);
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
    color: var(--color-text-secondary);
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
    background: var(--color-surface);
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
    color: var(--color-text-muted);
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
    --color: var(--color-text-secondary);
    --padding-start: var(--space-xs);
    --padding-end: var(--space-xs);
    height: 34px;
    margin: 0;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: none;
    white-space: nowrap;
}

.report-button:hover {
    --color: var(--color-danger);
}

.detail-section {
    margin-bottom: var(--space-md);
    padding: var(--surface-padding);
}

.reader-section {
    margin-bottom: var(--space-md);
    padding: var(--surface-padding);
}

.reader-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-md);
}

.reader-caption {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.reader-close {
    --color: var(--color-text-secondary);
    margin: -8px 0 0;
    font-size: var(--font-size-caption);
    text-transform: none;
}

.reader-toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
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

.reader-page,
.reader-zoom {
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    white-space: nowrap;
}

.reader-toolbar-spacer {
    flex: 1;
}

.reader-feedback {
    display: flex;
    min-height: 160px;
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
    min-height: 220px;
    justify-content: flex-start;
    margin-top: var(--space-md);
    padding: var(--space-md);
    overflow: auto;
    border-radius: var(--radius-md);
    background: var(--color-surface-alt);
}

.pdf-stage canvas {
    flex: 0 0 auto;
    background: white;
    box-shadow: var(--shadow-soft);
}

.text-reader {
    max-height: 75vh;
    margin: var(--space-md) 0 0;
    padding: var(--space-lg);
    overflow: auto;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--color-surface-alt);
    color: var(--color-text-primary);
    font: inherit;
    line-height: 1.75;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
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

@media (max-width: 700px) {
    .document-summary {
        grid-template-columns: 104px minmax(0, 1fr);
        gap: var(--space-md);
        padding: var(--space-md);
    }

    .cover-panel {
        min-height: 180px;
        align-self: start;
        padding: 0;
    }

    .cover-panel img {
        min-height: 180px;
        max-height: 240px;
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

    .reader-section {
        padding: var(--space-md);
    }

    .reader-toolbar {
        flex-wrap: wrap;
    }

    .reader-toolbar-spacer {
        flex-basis: 100%;
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
    .document-summary {
        grid-template-columns: 1fr;
    }

    .cover-panel {
        min-height: 180px;
    }

    .cover-panel img {
        min-height: 180px;
        max-height: 220px;
    }
}
</style>
