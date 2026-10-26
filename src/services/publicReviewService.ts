import { supabase } from '@/services/supabase';
import { getPublicProfile } from '@/services/authService';

export interface PublicDocumentReview {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    username: string;
    avatar_url: string | null;
}

export const listPublicDocumentReviews = async (documentId: string): Promise<PublicDocumentReview[]> => {
    const { data, error } = await supabase
        .from('document_reviews')
        .select('id, user_id, rating, comment, created_at')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(6);

    if (error) throw error;

    return Promise.all((data ?? []).map(async (review) => {
        const profile = await getPublicProfile(review.user_id);
        return {
            id: review.id,
            rating: review.rating,
            comment: review.comment ?? '',
            created_at: review.created_at,
            username: profile?.username || 'Leitor',
            avatar_url: profile?.avatar_url ?? null
        };
    }));
};
