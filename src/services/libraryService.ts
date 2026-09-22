import { supabase } from '@/services/supabase';
import { LIBRARY_COVERS_BUCKET } from '@/services/uploadService';
import type { LibraryCatalogItem, LibraryContribution } from '@/types/userArea';

const getCoverUrl = (coverPath: string | null): string => {
    if (!coverPath) return '';
    return supabase.storage.from(LIBRARY_COVERS_BUCKET).getPublicUrl(coverPath).data.publicUrl;
};

export const listMyContributions = async (userId: string): Promise<LibraryContribution[]> => {
    const { data, error } = await supabase
        .from('library_items')
        .select('id, title, author, category, content_type, year, file_name, cover_path, created_at')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        author: item.author,
        category: item.category,
        content_type: item.content_type,
        year: item.year,
        file_name: item.file_name,
        cover_url: getCoverUrl(item.cover_path),
        created_at: item.created_at
    }));
};

export const listLibraryCatalog = async (): Promise<LibraryCatalogItem[]> => {
    const { data, error } = await supabase
        .from('library_items')
        .select('id, title, author')
        .order('title', { ascending: true })
        .limit(200);

    if (error) throw error;
    return data ?? [];
};
