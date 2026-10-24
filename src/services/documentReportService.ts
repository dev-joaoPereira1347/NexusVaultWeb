import { supabase } from '@/services/supabase';

export type DocumentReportReason =
    | 'copyright'
    | 'inappropriate'
    | 'spam'
    | 'malware'
    | 'misinformation'
    | 'other';

interface SubmitDocumentReportInput {
    documentId: string;
    reason: DocumentReportReason;
    details: string;
}

const allowedReasons: DocumentReportReason[] = [
    'copyright',
    'inappropriate',
    'spam',
    'malware',
    'misinformation',
    'other'
];

export const submitDocumentReport = async ({
    documentId,
    reason,
    details
}: SubmitDocumentReportInput): Promise<void> => {
    const normalizedDetails = details.trim();
    if (!allowedReasons.includes(reason)) throw new Error('Selecione um motivo válido para a denúncia.');
    if (normalizedDetails.length > 2000) throw new Error('Os detalhes devem ter no máximo 2000 caracteres.');

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Entre na sua conta para denunciar um documento.');

    const { error } = await supabase.from('document_reports').insert({
        document_id: documentId,
        reporter_id: user.id,
        reason,
        details: normalizedDetails || null
    });

    if (error?.code === '23505') {
        throw new Error('Você já enviou uma denúncia para este documento.');
    }
    if (error) throw error;
};
