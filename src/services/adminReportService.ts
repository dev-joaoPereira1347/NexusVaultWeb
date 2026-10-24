import { supabase } from '@/services/supabase';
import type { DocumentReportReason } from '@/services/documentReportService';

export type DocumentReportStatus = 'pending' | 'reviewing' | 'removing' | 'resolved' | 'dismissed';

export interface AdminDocumentReport {
    id: string;
    document_id: string | null;
    reported_document_id: string;
    reporter_id: string;
    reason: DocumentReportReason;
    details: string | null;
    status: DocumentReportStatus;
    created_at: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
    removal_started_at: string | null;
    document: {
        title: string;
        author: string;
        uploaded_by: string;
    } | null;
}

const ensureAdmin = async (): Promise<string> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user || user.app_metadata.role !== 'admin') {
        throw new Error('Acesso restrito à equipe administrativa.');
    }
    return user.id;
};

export const listAdminDocumentReports = async (): Promise<AdminDocumentReport[]> => {
    await ensureAdmin();

    const { data: reports, error } = await supabase
        .from('document_reports')
        .select('id, document_id, reported_document_id, reporter_id, reason, details, status, created_at, reviewed_at, reviewed_by, removal_started_at')
        .order('created_at', { ascending: false })
        .limit(300);

    if (error) throw error;
    if (!reports?.length) return [];

    const documentIds = [...new Set(reports.map((report) => report.reported_document_id))];
    const { data: documents, error: documentsError } = await supabase
        .from('library_items')
        .select('id, title, author, uploaded_by')
        .in('id', documentIds);

    if (documentsError) throw documentsError;

    const documentsById = new Map((documents ?? []).map((document) => [document.id, document]));
    return reports.map((report) => {
        const document = documentsById.get(report.reported_document_id);
        return {
            ...report,
            reason: report.reason as DocumentReportReason,
            status: report.status as DocumentReportStatus,
            document: document
                ? {
                    title: document.title,
                    author: document.author,
                    uploaded_by: document.uploaded_by
                }
                : null
        };
    });
};

export const updateAdminDocumentReportStatus = async (
    reportId: string,
    status: 'reviewing' | 'dismissed'
): Promise<string> => {
    const reviewerId = await ensureAdmin();
    const { data, error } = await supabase
        .from('document_reports')
        .update({
            status,
            reviewed_at: new Date().toISOString(),
            reviewed_by: reviewerId,
            removal_started_at: null
        })
        .eq('id', reportId)
        .in('status', ['pending', 'reviewing'])
        .select('id')
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('A denúncia não foi encontrada ou você não tem permissão para analisá-la.');
    return reviewerId;
};

export const approveAdminDocumentReport = async (
    reportId: string
): Promise<{ reviewerId: string; documentDeleted: boolean }> => {
    const reviewerId = await ensureAdmin();
    const { data, error } = await supabase.functions.invoke('moderate-document-report', {
        body: { reportId, action: 'approve_removal' }
    });

    if (error) {
        const response = 'context' in error && error.context instanceof Response
            ? await error.context.clone().json().catch(() => null)
            : null;
        throw new Error(
            typeof response?.error === 'string' ? response.error : error.message
        );
    }
    if (data?.status !== 'resolved') {
        throw new Error('A denúncia não foi confirmada. O documento não foi removido.');
    }
    if (typeof data.documentDeleted !== 'boolean') {
        throw new Error('A resposta da moderação não informou o resultado da remoção.');
    }

    return { reviewerId, documentDeleted: data.documentDeleted };
};
