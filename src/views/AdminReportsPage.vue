<template>
    <IonPage>
        <IonContent :fullscreen="true" class="admin-content">
            <SiteHeader />
            <main class="admin-page nv-page-shell">
                <header class="page-heading nv-page-heading">
                    <p class="nv-eyebrow nv-badge">MODERAÇÃO DO ACERVO</p>
                    <div class="heading-row">
                        <div>
                            <h1 class="nv-page-title">Denúncias de documentos</h1>
                            <p class="nv-page-description">
                                Rejeite denúncias sem alterar o acervo ou aprove a remoção do documento e dos arquivos.
                            </p>
                        </div>
                        <ion-button class="refresh-button" fill="outline" :disabled="loading" @click="loadReports">
                            <ion-icon slot="start" :icon="refreshOutline" />
                            Atualizar
                        </ion-button>
                    </div>
                </header>

                <section class="summary-grid" aria-label="Resumo das denúncias">
                    <article v-for="stat in stats" :key="stat.status" class="summary-card nv-surface">
                        <span>{{ stat.label }}</span>
                        <strong>{{ stat.count }}</strong>
                    </article>
                </section>

                <section class="reports-section" aria-labelledby="reports-title">
                    <div class="reports-toolbar">
                        <div>
                            <h2 id="reports-title" class="section-title">Fila de análise</h2>
                            <p class="section-description">Exibindo até 300 denúncias mais recentes.</p>
                        </div>
                        <label class="filter-field">
                            <span>Filtrar por situação</span>
                            <select v-model="selectedStatus">
                                <option value="all">Todas</option>
                                <option value="pending">Pendentes</option>
                                <option value="reviewing">Em análise</option>
                                <option value="removing">Removendo</option>
                                <option value="resolved">Removidos</option>
                                <option value="dismissed">Rejeitadas</option>
                            </select>
                        </label>
                    </div>

                    <div v-if="loading" class="feedback nv-surface" role="status">
                        <ion-spinner name="crescent" />
                        <span>Carregando denúncias...</span>
                    </div>
                    <div v-else-if="errorMessage" class="feedback error-feedback nv-surface" role="alert">
                        <ion-icon :icon="alertCircleOutline" aria-hidden="true" />
                        <p>{{ errorMessage }}</p>
                        <ion-button fill="outline" @click="loadReports">Tentar novamente</ion-button>
                    </div>
                    <div v-else-if="filteredReports.length === 0" class="feedback empty-feedback nv-surface">
                        <ion-icon :icon="checkmarkDoneOutline" aria-hidden="true" />
                        <p>Nenhuma denúncia nesta situação.</p>
                    </div>

                    <div v-else class="report-list">
                        <article v-for="report in filteredReports" :key="report.id" class="report-card nv-surface">
                            <div class="report-heading">
                                <div class="report-title-group">
                                    <span class="status-badge nv-badge nv-badge--status" :class="`status-${report.status}`">
                                        {{ statusLabels[report.status] }}
                                    </span>
                                    <time :datetime="report.created_at">{{ formatDate(report.created_at) }}</time>
                                </div>
                                <span class="report-reference">Denúncia #{{ report.id.slice(0, 8) }}</span>
                            </div>

                            <div class="report-body">
                                <div class="report-main">
                                    <h3>{{ reasonLabels[report.reason] }}</h3>
                                    <p v-if="report.details" class="report-details">{{ report.details }}</p>
                                    <p v-else class="report-no-details">A pessoa denunciante não adicionou detalhes.</p>
                                    <div class="report-meta">
                                        <span>Denunciante: <code>{{ report.reporter_id }}</code></span>
                                        <span v-if="report.document">Enviado por: <code>{{ report.document.uploaded_by }}</code></span>
                                    </div>
                                </div>

                                <aside class="document-panel">
                                    <span class="document-label">Documento denunciado</span>
                                    <template v-if="report.document">
                                        <RouterLink
                                            class="document-link"
                                            :to="{ name: 'DocumentDetails', params: { id: report.reported_document_id } }"
                                        >
                                            {{ report.document.title }}
                                        </RouterLink>
                                        <span class="document-author">{{ report.document.author }}</span>
                                    </template>
                                    <p v-else class="deleted-document">
                                        Documento removido ou indisponível.
                                        <code>{{ report.reported_document_id }}</code>
                                    </p>
                                </aside>
                            </div>

                            <footer class="report-actions">
                                <span v-if="report.reviewed_by" class="reviewed-by">
                                    Analisada por <code>{{ report.reviewed_by }}</code>
                                </span>
                                <div v-if="isOpen(report)" class="action-buttons">
                                    <ion-button
                                        class="review-button"
                                        fill="outline"
                                        :disabled="updatingReportId === report.id || report.status === 'reviewing'"
                                        @click="updateStatus(report, 'reviewing')"
                                    >
                                        Marcar em análise
                                    </ion-button>
                                    <ion-button
                                        class="reject-button"
                                        fill="outline"
                                        :disabled="updatingReportId === report.id"
                                        @click="updateStatus(report, 'dismissed')"
                                    >
                                        <ion-icon slot="start" :icon="closeCircleOutline" />
                                        Rejeitar
                                    </ion-button>
                                    <ion-button
                                        class="resolve-button"
                                        :disabled="updatingReportId === report.id"
                                        @click="approveRemoval(report)"
                                    >
                                        <ion-spinner v-if="updatingReportId === report.id" slot="start" name="crescent" />
                                        <ion-icon v-else slot="start" :icon="checkmarkCircleOutline" />
                                        Aprovar e remover
                                    </ion-button>
                                </div>
                                <div v-else-if="isRemovalStale(report)" class="action-buttons">
                                    <ion-button
                                        class="resolve-button"
                                        :disabled="updatingReportId === report.id"
                                        @click="approveRemoval(report)"
                                    >
                                        <ion-icon slot="start" :icon="refreshOutline" />
                                        Retomar remoção
                                    </ion-button>
                                </div>
                                <p v-else class="decision-note">
                                    {{ report.status === 'resolved' ? 'Documento removido' : report.status === 'removing' ? 'Remoção em andamento' : 'Denúncia rejeitada' }}
                                    <span v-if="report.reviewed_at"> em {{ formatDate(report.reviewed_at) }}</span>
                                </p>
                            </footer>
                        </article>
                    </div>
                </section>

                <p class="moderation-note">
                    Aprovar remove o documento, a capa e os arquivos associados. Rejeitar mantém o conteúdo no acervo.
                    As decisões ficam registradas no histórico, mesmo após a remoção.
                </p>
            </main>
            <SiteFooter />
        </IonContent>
    </IonPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
    IonButton,
    IonContent,
    IonIcon,
    IonPage,
    IonSpinner,
    alertController,
    toastController
} from '@ionic/vue';
import {
    alertCircleOutline,
    checkmarkCircleOutline,
    checkmarkDoneOutline,
    closeCircleOutline,
    refreshOutline
} from 'ionicons/icons';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import {
    approveAdminDocumentReport,
    listAdminDocumentReports,
    updateAdminDocumentReportStatus,
    type AdminDocumentReport,
    type DocumentReportStatus
} from '@/services/adminReportService';

const reports = ref<AdminDocumentReport[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const selectedStatus = ref<'all' | DocumentReportStatus>('all');
const updatingReportId = ref('');

const reasonLabels = {
    copyright: 'Violação de direitos autorais',
    inappropriate: 'Conteúdo impróprio ou ofensivo',
    spam: 'Spam ou conteúdo enganoso',
    malware: 'Arquivo suspeito ou malicioso',
    misinformation: 'Informação potencialmente prejudicial',
    other: 'Outro motivo'
} satisfies Record<AdminDocumentReport['reason'], string>;

const statusLabels: Record<DocumentReportStatus, string> = {
    pending: 'Pendente',
    reviewing: 'Em análise',
    removing: 'Removendo',
    resolved: 'Documento removido',
    dismissed: 'Rejeitada'
};

const filteredReports = computed(() => selectedStatus.value === 'all'
    ? reports.value
    : reports.value.filter((report) => report.status === selectedStatus.value));

const stats = computed(() => [
    { status: 'pending', label: 'Pendentes', count: reports.value.filter((report) => report.status === 'pending').length },
    { status: 'reviewing', label: 'Em análise', count: reports.value.filter((report) => report.status === 'reviewing').length },
    { status: 'removing', label: 'Removendo', count: reports.value.filter((report) => report.status === 'removing').length },
    { status: 'resolved', label: 'Removidos', count: reports.value.filter((report) => report.status === 'resolved').length },
    { status: 'dismissed', label: 'Rejeitadas', count: reports.value.filter((report) => report.status === 'dismissed').length }
]);

const formatDate = (date: string): string => new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
}).format(new Date(date));

const isOpen = (report: AdminDocumentReport): boolean =>
    report.status === 'pending' || report.status === 'reviewing';

const isRemovalStale = (report: AdminDocumentReport): boolean => {
    if (report.status !== 'removing' || !report.removal_started_at) return false;
    return Date.now() - Date.parse(report.removal_started_at) >= 120_000;
};

const showToast = async (message: string, color: 'success' | 'danger') => {
    const toast = await toastController.create({ message, duration: 3500, color, position: 'bottom' });
    await toast.present();
};

const loadReports = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
        reports.value = await listAdminDocumentReports();
    } catch (error) {
        errorMessage.value = error instanceof Error
            ? error.message
            : 'Não foi possível carregar as denúncias.';
    } finally {
        loading.value = false;
    }
};

const updateStatus = async (report: AdminDocumentReport, status: 'reviewing' | 'dismissed') => {
    if (updatingReportId.value) return;
    updatingReportId.value = report.id;
    try {
        const reviewerId = await updateAdminDocumentReportStatus(report.id, status);
        reports.value = reports.value.map((entry) => entry.id === report.id
            ? {
                ...entry,
                status,
                reviewed_at: new Date().toISOString(),
                reviewed_by: reviewerId,
                removal_started_at: null
            }
            : entry);
        await showToast(`Situação atualizada: ${statusLabels[status].toLowerCase()}.`, 'success');
    } catch (error) {
        await showToast(
            error instanceof Error ? error.message : 'Não foi possível atualizar a denúncia.',
            'danger'
        );
    } finally {
        updatingReportId.value = '';
    }
};

const approveRemoval = async (report: AdminDocumentReport) => {
    if (updatingReportId.value) return;
    const alert = await alertController.create({
        header: 'Aprovar remoção do documento?',
        message: `O documento “${report.document?.title ?? 'indisponível'}” e os arquivos associados serão removidos permanentemente. Esta ação não pode ser desfeita.`,
        buttons: [
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Aprovar e remover', role: 'destructive' }
        ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;

    updatingReportId.value = report.id;
    try {
        const { reviewerId, documentDeleted } = await approveAdminDocumentReport(report.id);
        reports.value = reports.value.map((entry) => entry.id === report.id
            ? {
                ...entry,
                document_id: null,
                document: null,
                status: 'resolved',
                reviewed_at: new Date().toISOString(),
                reviewed_by: reviewerId,
                removal_started_at: null
            }
            : entry);
        await showToast(
            documentDeleted
                ? 'Denúncia aprovada. Documento e arquivos removidos.'
                : 'Denúncia aprovada. O documento já não estava disponível.',
            'success'
        );
    } catch (error) {
        await showToast(
            error instanceof Error ? error.message : 'Não foi possível concluir a remoção do documento.',
            'danger'
        );
    } finally {
        updatingReportId.value = '';
    }
};

onMounted(loadReports);
</script>

<style scoped>
.admin-content {
    --background: var(--color-page-background);
}

.admin-page {
    --content-width: 1120px;
    min-height: 70vh;
}

.page-heading .nv-eyebrow {
    margin-bottom: var(--space-sm);
}

.heading-row,
.reports-toolbar,
.report-heading,
.report-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
}

.heading-row {
    align-items: flex-end;
}

.refresh-button {
    --color: var(--color-text-primary);
    --border-color: var(--color-border);
    --border-radius: var(--radius-control);
    flex: 0 0 auto;
    margin: 0;
    text-transform: none;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--space-md);
    margin-bottom: var(--space-2xl);
}

.summary-card {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-md);
}

.summary-card span {
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.summary-card strong {
    color: var(--color-text-primary);
    font-family: var(--primitive-font-family-display);
    font-size: 1.75rem;
    line-height: 1;
}

.reports-section {
    display: grid;
    gap: var(--space-md);
}

.reports-toolbar {
    align-items: flex-end;
    margin-bottom: var(--space-xs);
}

.section-title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1.25rem;
    font-weight: 700;
}

.section-description {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-caption);
}

.filter-field {
    display: grid;
    min-width: 190px;
    gap: var(--space-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    font-weight: 600;
}

.filter-field select {
    min-height: 42px;
    padding: 0 var(--space-sm);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text-primary);
}

.report-list {
    display: grid;
    gap: var(--space-md);
}

.report-card {
    padding: clamp(var(--space-md), 3vw, var(--space-lg));
}

.report-heading {
    align-items: flex-start;
    padding-bottom: var(--space-md);
    border-bottom: 1px solid var(--color-border-soft);
}

.report-title-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-sm);
}

.report-title-group time,
.report-reference {
    color: var(--color-text-muted);
    font-size: var(--font-size-caption);
}

.report-reference {
    flex: 0 0 auto;
    font-family: monospace;
}

.status-badge {
    flex: 0 0 auto;
}

.status-pending {
    background: #fff1d6;
    color: #7a4b00;
}

.status-reviewing {
    background: #e8ecff;
    color: #3b4380;
}

.status-removing {
    background: #fff1d6;
    color: #7a4b00;
}

.status-resolved {
    background: #e1f4e9;
    color: #1d633b;
}

.status-dismissed {
    background: #f5e7e5;
    color: #8c3029;
}

.report-body {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(220px, 0.8fr);
    gap: var(--space-lg);
    padding-block: var(--space-md);
}

.report-main {
    min-width: 0;
}

.report-main h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1rem;
}

.report-details,
.report-no-details {
    margin: var(--space-sm) 0 0;
    color: var(--color-text-secondary);
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.report-no-details {
    color: var(--color-text-muted);
    font-style: italic;
}

.report-meta {
    display: grid;
    gap: var(--space-xs);
    margin-top: var(--space-md);
    color: var(--color-text-muted);
    font-size: 0.75rem;
}

.report-meta code,
.reviewed-by code {
    overflow-wrap: anywhere;
    color: var(--color-text-secondary);
}

.document-panel {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
    align-self: start;
    padding: var(--space-md);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    background: var(--color-background);
}

.document-label {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.document-link {
    color: var(--color-brand-primary);
    font-weight: 700;
    text-decoration: none;
}

.document-link:hover {
    text-decoration: underline;
}

.document-author,
.deleted-document {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
}

.report-actions {
    flex-wrap: wrap;
    padding-top: var(--space-md);
    border-top: 1px solid var(--color-border-soft);
}

.reviewed-by {
    color: var(--color-text-muted);
    font-size: 0.75rem;
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-xs);
    margin-left: auto;
}

.action-buttons ion-button {
    --border-radius: var(--radius-control);
    margin: 0;
    font-size: var(--font-size-caption);
    font-weight: 700;
    text-transform: none;
}

.review-button {
    --color: var(--color-brand-primary);
    --border-color: var(--color-brand-primary);
}

.reject-button {
    --color: var(--color-danger);
    --border-color: var(--color-danger);
}

.resolve-button {
    --background: var(--color-brand-primary);
    --color: var(--color-white);
}

.decision-note {
    margin: 0 0 0 auto;
    color: var(--color-text-secondary);
    font-size: var(--font-size-caption);
    font-weight: 700;
}

.feedback {
    display: flex;
    min-height: 180px;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    padding: var(--space-lg);
    color: var(--color-text-secondary);
    text-align: center;
}

.feedback p {
    margin: 0;
}

.error-feedback {
    flex-wrap: wrap;
    color: var(--color-danger);
}

.error-feedback ion-button {
    --color: var(--color-danger);
    --border-color: var(--color-danger);
    text-transform: none;
}

.empty-feedback {
    flex-direction: column;
}

.empty-feedback ion-icon {
    color: var(--color-brand-primary);
    font-size: 2rem;
}

.moderation-note {
    margin: var(--space-lg) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-caption);
    line-height: 1.6;
    text-align: center;
}

@media (max-width: 700px) {
    .heading-row,
    .reports-toolbar {
        align-items: stretch;
        flex-direction: column;
    }

    .refresh-button {
        align-self: flex-start;
    }

    .summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-sm);
        margin-bottom: var(--space-xl);
    }

    .reports-toolbar {
        gap: var(--space-sm);
    }

    .report-body {
        grid-template-columns: 1fr;
        gap: var(--space-md);
    }

    .report-actions {
        align-items: flex-start;
        flex-direction: column;
    }

    .action-buttons {
        width: 100%;
        justify-content: flex-start;
        margin-left: 0;
    }

    .action-buttons ion-button {
        flex: 1 1 auto;
    }

    .decision-note {
        margin-left: 0;
    }
}

@media (max-width: 380px) {
    .report-heading {
        flex-direction: column;
    }

    .report-reference {
        align-self: flex-end;
    }
}
</style>
