import { supabase } from '@/services/supabase';

export interface PublicDocumentReview {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
}

export const listPublicDocumentReviews = async (documentId: string): Promise<PublicDocumentReview[]> => {
    const { data, error } = await supabase
        .from('document_reviews')
        .select('id, rating, comment, created_at')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(6);

    if (error) throw error;

    return (data ?? []).map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment ?? '',
        created_at: review.created_at
    }));
};
