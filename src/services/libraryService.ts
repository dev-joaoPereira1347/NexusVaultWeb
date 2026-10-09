import { supabase } from '@/services/supabase';
import { LIBRARY_COVERS_BUCKET, LIBRARY_DOCUMENTS_BUCKET } from '@/services/uploadService';
import type { PublicLibraryItem, PublicLibraryItemDetails } from '@/types/library';
import type { LibraryCatalogItem, LibraryContribution } from '@/types/userArea';

const getCoverUrl = (coverPath: string | null): string => {
    if (!coverPath) return '';
    return supabase.storage.from(LIBRARY_COVERS_BUCKET).getPublicUrl(coverPath).data.publicUrl;
};

export const listMyContributions = async (userId: string): Promise<LibraryContribution[]> => {
    const { data, error } = await supabase
        .from('library_items')
        .select('id, title, author, category, content_type, year, genre, language, description, file_name, file_path, file_mime, file_size, cover_path, created_at')
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
        genre: item.genre,
        language: item.language,
        description: item.description,
        file_name: item.file_name,
        file_path: item.file_path,
        file_mime: item.file_mime,
        file_size: item.file_size,
        cover_path: item.cover_path,
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

export const listPublicLibraryItems = async (): Promise<PublicLibraryItem[]> => {
    const { data, error } = await supabase
        .from('library_items')
        .select('id, title, author, category, genre, content_type, year, description, file_name, file_path, cover_path')
        .order('title', { ascending: true })
        .limit(200);

    if (error) throw error;

    const items = Array.isArray(data) ? data : data ? [data] : [];

    return items.map((item) => ({
        id: item.id,
        title: item.title,
        author: item.author,
        category: item.category,
        genre: item.genre,
        content_type: item.content_type,
        year: item.year,
        description: item.description,
        file_name: item.file_name,
        cover_url: getCoverUrl(item.cover_path),
        download_url: supabase.storage.from(LIBRARY_DOCUMENTS_BUCKET).getPublicUrl(item.file_path).data.publicUrl
    }));
};

export const getPublicLibraryItem = async (id: string): Promise<PublicLibraryItemDetails | null> => {
    const { data, error } = await supabase
        .from('library_items')
        .select('id, uploaded_by, title, author, category, content_type, year, genre, language, description, file_name, file_size, created_at, file_path, cover_path')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
        id: data.id,
        uploaded_by: data.uploaded_by,
        title: data.title,
        author: data.author,
        category: data.category,
        content_type: data.content_type,
        year: data.year,
        genre: data.genre,
        language: data.language,
        description: data.description,
        file_name: data.file_name,
        file_size: data.file_size,
        created_at: data.created_at,
        cover_url: getCoverUrl(data.cover_path),
        download_url: supabase.storage.from(LIBRARY_DOCUMENTS_BUCKET).getPublicUrl(data.file_path).data.publicUrl
    };
};

export const listPublicLibraryItemsByUploader = async (uploaderId: string): Promise<PublicLibraryItem[]> => {
    const { data, error } = await supabase
        .from('library_items')
        .select('id, title, author, category, genre, content_type, year, description, file_name, file_path, cover_path')
        .eq('uploaded_by', uploaderId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw error;

    return (data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        author: item.author,
        category: item.category,
        genre: item.genre,
        content_type: item.content_type,
        year: item.year,
        description: item.description,
        file_name: item.file_name,
        cover_url: getCoverUrl(item.cover_path),
        download_url: supabase.storage.from(LIBRARY_DOCUMENTS_BUCKET).getPublicUrl(item.file_path).data.publicUrl
    }));
};

export const listRelatedPublicLibraryItems = async (
    item: Pick<PublicLibraryItemDetails, 'id' | 'category'>
): Promise<PublicLibraryItem[]> => {
    const { data, error } = await supabase
        .from('library_items')
        .select('id, title, author, category, genre, content_type, year, description, file_name, file_path, cover_path')
        .eq('category', item.category)
        .neq('id', item.id)
        .order('title', { ascending: true })
        .limit(4);

    if (error) throw error;

    return (data ?? []).map((relatedItem) => ({
        id: relatedItem.id,
        title: relatedItem.title,
        author: relatedItem.author,
        category: relatedItem.category,
        genre: relatedItem.genre,
        content_type: relatedItem.content_type,
        year: relatedItem.year,
        description: relatedItem.description,
        file_name: relatedItem.file_name,
        cover_url: getCoverUrl(relatedItem.cover_path),
        download_url: supabase.storage.from(LIBRARY_DOCUMENTS_BUCKET).getPublicUrl(relatedItem.file_path).data.publicUrl
    }));
};
