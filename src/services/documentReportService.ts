import { supabase } from '@/services/supabase';

export type DocumentReportReason =
    | 'copyright'
    | 'inappropriate'
    | 'spam'
    | 'malware'
    | 'misinformation'
    | 'harassment'
    | 'impersonation'
    | 'fake_profile'
    | 'other';

interface SubmitReportInput {
    reason: DocumentReportReason;
    details: string;
}

const allowedDocumentReasons: DocumentReportReason[] = [
    'copyright',
    'inappropriate',
    'spam',
    'malware',
    'misinformation',
    'other'
];

const allowedUserReasons: DocumentReportReason[] = [
    'harassment',
    'impersonation',
    'fake_profile',
    'spam',
    'inappropriate',
    'other'
];

const getReporterId = async (target: 'documento' | 'perfil') => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error(`Entre na sua conta para denunciar ${target === 'documento' ? 'um documento' : 'um perfil'}.`);
    return user.id;
};

const validateReport = (reason: DocumentReportReason, details: string, allowedReasons: DocumentReportReason[]) => {
    const normalizedDetails = details.trim();
    if (!allowedReasons.includes(reason)) throw new Error('Selecione um motivo válido para a denúncia.');
    if (normalizedDetails.length > 2000) throw new Error('Os detalhes devem ter no máximo 2000 caracteres.');
    return normalizedDetails;
};

export const submitDocumentReport = async ({
    documentId,
    reason,
    details
}: SubmitReportInput & { documentId: string }): Promise<void> => {
    const normalizedDetails = validateReport(reason, details, allowedDocumentReasons);
    const reporterId = await getReporterId('documento');

    const { error } = await supabase.from('document_reports').insert({
        document_id: documentId,
        reporter_id: reporterId,
        reason,
        details: normalizedDetails || null
    });

    if (error?.code === '23505') {
        throw new Error('Você já enviou uma denúncia para este documento.');
    }
    if (error) throw error;
};

export const submitUserReport = async ({
    userId,
    reason,
    details
}: SubmitReportInput & { userId: string }): Promise<void> => {
    const normalizedDetails = validateReport(reason, details, allowedUserReasons);
    const reporterId = await getReporterId('perfil');
    if (reporterId === userId) throw new Error('Você não pode denunciar o próprio perfil.');

    const { error } = await supabase.from('document_reports').insert({
        document_id: null,
        reported_user_id: userId,
        reporter_id: reporterId,
        reason,
        details: normalizedDetails || null
    });

    if (error?.code === '23505') {
        throw new Error('Você já enviou uma denúncia para este perfil.');
    }
    if (error) throw error;
};
