import { supabase } from '@/services/supabase';
import { getCurrentUser } from '@/services/authService';
import { LIBRARY_DOCUMENTS_BUCKET, LIBRARY_COVERS_BUCKET } from '@/services/uploadService';
import type { PublicLibraryItem } from '@/types/library';
import type { BookCollection, BookCollectionDraft } from '@/types/bookCollections';

interface CollectionRow {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    is_public: boolean;
    updated_at: string;
}

interface CollectionBookRow {
    id: string;
    title: string;
    author: string;
    category: string;
    genre: string | null;
    content_type: string;
    year: number | null;
    description: string | null;
    file_name: string;
    file_path: string;
    cover_path: string | null;
}

interface CollectionItemRow {
    collection_id: string;
    position: number;
    added_at: string;
    library_items: CollectionBookRow[] | CollectionBookRow | null;
}

const throwCollectionError = (error: unknown): never => {
    const code = typeof error === 'object' && error !== null && 'code' in error
        && typeof error.code === 'string'
        ? error.code
        : '';
    const message = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
            && typeof error.message === 'string'
            ? error.message
            : 'Erro desconhecido ao acessar o banco de dados.';

    if (code === '42P01' || code === 'PGRST205') {
        throw new Error(
            'As tabelas de coleções ainda não estão disponíveis no banco. Aplique a migração 20261027143000_book_collections.sql no Supabase e tente novamente.'
        );
    }

    if (code === 'PGRST200') {
        throw new Error(
            'O relacionamento entre coleções e livros não foi encontrado no esquema do Supabase. Confira se a migração 20261027143000_book_collections.sql foi aplicada e atualize o cache do esquema.'
        );
    }

    throw new Error(`Não foi possível acessar as coleções: ${message}`);
};

const validateDraft = (draft: BookCollectionDraft): BookCollectionDraft => {
    const name = draft.name.trim();
    if (!name || name.length > 80) throw new Error('O nome da coleção deve ter entre 1 e 80 caracteres.');
    return { name, isPublic: draft.isPublic };
};

const getCollectionRows = async (ownerId: string, publicOnly: boolean): Promise<BookCollection[]> => {
    let query = supabase
        .from('book_collections')
        .select('id, user_id, name, description, is_public, updated_at')
        .eq('user_id', ownerId)
        .order('updated_at', { ascending: false });

    if (publicOnly) query = query.eq('is_public', true);

    const { data: collectionData, error: collectionError } = await query;
    if (collectionError) throwCollectionError(collectionError);
    const collections = (collectionData ?? []) as CollectionRow[];
    if (!collections.length) return [];

    const { data: itemData, error: itemError } = await supabase
        .from('book_collection_items')
        .select('collection_id, position, added_at, library_items!book_collection_items_document_id_fkey(id, title, author, category, genre, content_type, year, description, file_name, file_path, cover_path)')
        .in('collection_id', collections.map(({ id }) => id))
        .order('position', { ascending: true })
        .order('added_at', { ascending: false });

    if (itemError) throwCollectionError(itemError);

    const itemsByCollection = new Map<string, PublicLibraryItem[]>();
    for (const row of (itemData ?? []) as CollectionItemRow[]) {
        const document = Array.isArray(row.library_items) ? row.library_items[0] : row.library_items;
        if (!document) continue;

        const items = itemsByCollection.get(row.collection_id) ?? [];
        items.push({
            id: document.id,
            title: document.title,
            author: document.author,
            category: document.category,
            genre: document.genre,
            content_type: document.content_type,
            year: document.year,
            description: document.description,
            file_name: document.file_name,
            cover_url: document.cover_path
                ? supabase.storage.from(LIBRARY_COVERS_BUCKET).getPublicUrl(document.cover_path).data.publicUrl
                : '',
            download_url: supabase.storage.from(LIBRARY_DOCUMENTS_BUCKET).getPublicUrl(document.file_path).data.publicUrl
        });
        itemsByCollection.set(row.collection_id, items);
    }

    return collections.map((collection) => ({
        ...collection,
        description: collection.description ?? '',
        items: itemsByCollection.get(collection.id) ?? []
    }));
};

const ensureFavoritesCollectionForUser = async (userId: string): Promise<void> => {
    const { data, error: collectionError } = await supabase
        .from('book_collections')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', 'Favoritos')
        .limit(1);
    if (collectionError) throwCollectionError(collectionError);
    if (data?.length) return;

    await createBookCollection({ name: 'Favoritos', isPublic: false });
};

export const ensureFavoritesBookCollection = async (): Promise<void> => {
    const { data: { user }, error } = await getCurrentUser();
    if (error) throwCollectionError(error);
    if (!user) throw new Error('Usuário não autenticado.');
    await ensureFavoritesCollectionForUser(user.id);
};

export const listMyBookCollections = async (): Promise<BookCollection[]> => {
    const { data: { user }, error } = await getCurrentUser();
    if (error) throwCollectionError(error);
    if (!user) throw new Error('Usuário não autenticado.');
    await ensureFavoritesCollectionForUser(user.id);
    return getCollectionRows(user.id, false);
};

export const listPublicBookCollections = async (userId: string): Promise<BookCollection[]> =>
    getCollectionRows(userId, true);

export const createBookCollection = async (draft: BookCollectionDraft): Promise<string> => {
    const { data: { user }, error: userError } = await getCurrentUser();
    if (userError) throw userError;
    if (!user) throw new Error('Usuário não autenticado.');

    const collection = validateDraft(draft);
    const { data, error } = await supabase.from('book_collections').insert({
        user_id: user.id,
        name: collection.name,
        is_public: collection.isPublic
    }).select('id').single();
    if (error) throwCollectionError(error);
    if (!data?.id) throw new Error('O banco não retornou o identificador da coleção criada.');
    return data.id;
};

export const updateBookCollection = async (id: string, draft: BookCollectionDraft): Promise<void> => {
    const collection = validateDraft(draft);
    const { error } = await supabase
        .from('book_collections')
        .update({
            name: collection.name,
            is_public: collection.isPublic,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);
    if (error) throwCollectionError(error);
};

export const deleteBookCollection = async (id: string): Promise<void> => {
    const { error } = await supabase.from('book_collections').delete().eq('id', id);
    if (error) throwCollectionError(error);
};

export const addBookToCollection = async (collectionId: string, documentId: string): Promise<void> => {
    const { error } = await supabase.from('book_collection_items').insert({
        collection_id: collectionId,
        document_id: documentId
    });
    if (error?.code === '23505') throw new Error('Este livro já está nesta coleção.');
    if (error) throwCollectionError(error);
};

export const removeBookFromCollection = async (collectionId: string, documentId: string): Promise<void> => {
    const { error } = await supabase
        .from('book_collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('document_id', documentId);
    if (error) throwCollectionError(error);
};
