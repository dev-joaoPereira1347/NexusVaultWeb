import { supabase } from '@/services/supabase';
import { getCurrentUser } from '@/services/authService';
import type { DocumentReview, ReviewDraft } from '@/types/userArea';

type ReviewRow = {
    id: string;
    document_id: string;
    rating: number;
    comment: string | null;
    library_items: { title: string; author: string } | { title: string; author: string }[] | null;
};

const mapReview = (row: ReviewRow): DocumentReview => {
    const document = Array.isArray(row.library_items) ? row.library_items[0] : row.library_items;

    return {
        id: row.id,
        document_id: row.document_id,
        rating: row.rating,
        comment: row.comment ?? '',
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

export const listMyReviews = async (): Promise<DocumentReview[]> => {
    const userId = await requireUserId();
    const { data, error } = await supabase
        .from('document_reviews')
        .select('id, document_id, rating, comment, library_items!document_id(title, author)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as ReviewRow[]).map(mapReview);
};

export const createReview = async (draft: ReviewDraft): Promise<void> => {
    const userId = await requireUserId();
    const { error } = await supabase.from('document_reviews').insert({
        user_id: userId,
        document_id: draft.documentId,
        rating: draft.rating,
        comment: draft.comment.trim() || null
    });

    if (error) throw error;
};

export const updateReview = async (id: string, draft: Omit<ReviewDraft, 'documentId'>): Promise<void> => {
    const userId = await requireUserId();
    const { error } = await supabase
        .from('document_reviews')
        .update({
            rating: draft.rating,
            comment: draft.comment.trim() || null,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw error;
};

export const deleteReview = async (id: string): Promise<void> => {
    const userId = await requireUserId();
    const { error } = await supabase
        .from('document_reviews')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw error;
};
