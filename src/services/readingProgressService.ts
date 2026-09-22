import { supabase } from '@/services/supabase';
import { getCurrentUser } from '@/services/authService';
import type { ProgressDraft, ReadingProgress } from '@/types/userArea';

type ProgressRow = {
    id: string;
    document_id: string;
    page: number;
    percent: number | string;
    status: ReadingProgress['status'];
    library_items: { title: string; author: string } | { title: string; author: string }[] | null;
};

const mapProgress = (row: ProgressRow): ReadingProgress => {
    const document = Array.isArray(row.library_items) ? row.library_items[0] : row.library_items;

    return {
        id: row.id,
        document_id: row.document_id,
        page: row.page,
        percent: Number(row.percent),
        status: row.status,
        title: document?.title ?? 'Documento indisponível',
        author: document?.author ?? ''
    };
};

const requireUserId = async (): Promise<string> => {
    const { data: { user }, error } = await getCurrentUser();
    if (error) throw error;
    if (!user) throw new Error('Usuário não autenticado.');
    return user.id;
};

export const listMyReadingProgress = async (): Promise<ReadingProgress[]> => {
    const userId = await requireUserId();
    const { data, error } = await supabase
        .from('reading_progress')
        .select('id, document_id, page, percent, status, library_items!document_id(title, author)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as ProgressRow[]).map(mapProgress);
};

export const createReadingProgress = async (draft: ProgressDraft): Promise<void> => {
    const userId = await requireUserId();
    const { error } = await supabase.from('reading_progress').insert({
        user_id: userId,
        document_id: draft.documentId,
        page: draft.page,
        percent: draft.percent,
        status: draft.status
    });

    if (error) throw error;
};

export const updateReadingProgress = async (id: string, draft: Omit<ProgressDraft, 'documentId'>): Promise<void> => {
    const userId = await requireUserId();
    const { error } = await supabase
        .from('reading_progress')
        .update({
            page: draft.page,
            percent: draft.percent,
            status: draft.status,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw error;
};

export const deleteReadingProgress = async (id: string): Promise<void> => {
    const userId = await requireUserId();
    const { error } = await supabase
        .from('reading_progress')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw error;
};
