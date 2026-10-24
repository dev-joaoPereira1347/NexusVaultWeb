import { supabase } from '@/services/supabase';
import { getCurrentSession, getCurrentUser } from '@/services/authService';
import type { ReadingProgress } from '@/types/userArea';

export interface ReadingProgressPosition {
    page: number;
    percent: number;
}

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

export const getMyReadingProgressPosition = async (documentId: string): Promise<ReadingProgressPosition | null> => {
    const { data: { session }, error: userError } = await getCurrentSession();
    if (userError) throw userError;
    const user = session?.user;
    if (!user) return null;

    const { data, error } = await supabase
        .from('reading_progress')
        .select('page, percent')
        .eq('user_id', user.id)
        .eq('document_id', documentId)
        .maybeSingle();

    if (error) throw error;
    return data
        ? { page: Number(data.page), percent: Number(data.percent) }
        : null;
};

export const saveReadingProgressAutomatically = async (
    documentId: string,
    page: number,
    percent: number
): Promise<boolean> => {
    const { data: { session }, error: userError } = await getCurrentSession();
    if (userError) throw userError;
    const user = session?.user;
    if (!user) return false;

    const { error } = await supabase
        .from('reading_progress')
        .upsert({
            user_id: user.id,
            document_id: documentId,
            page: Math.max(0, Math.floor(page)),
            percent: Math.min(100, Math.max(0, percent)),
            status: percent >= 100 ? 'lido' : 'lendo',
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,document_id' });

    if (error) throw error;
    return true;
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
