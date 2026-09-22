import { supabase } from '@/services/supabase';
import { getCurrentUser } from '@/services/authService';
import type { UploadForm } from '@/types/upload';
import type { LibraryItemInsert } from '@/types/library';

/** Bucket público para arquivos (PDF, EPUB, TXT, MD). */
export const LIBRARY_DOCUMENTS_BUCKET = 'library-documents';

/** Bucket público para capas em WebP. */
export const LIBRARY_COVERS_BUCKET = 'library-covers';

const ALLOWED_EXTENSIONS = new Set(['pdf', 'txt', 'epub', 'md']);
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const extensionFromFileName = (fileName: string): string | null => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension || null;
};

const mimeFromExtension = (extension: string): string => {
    switch (extension) {
        case 'pdf':
            return 'application/pdf';
        case 'txt':
            return 'text/plain';
        case 'epub':
            return 'application/epub+zip';
        case 'md':
            return 'text/markdown';
        default:
            return 'application/octet-stream';
    }
};

const uploadToBucket = async (bucket: string, path: string, file: File, contentType: string) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: false,
        contentType
    });

    if (error) throw error;
};

const removeFromBucket = async (bucket: string, path: string) => {
    await supabase.storage.from(bucket).remove([path]);
};

export const uploadLibraryItem = async (file: File, form: UploadForm) => {
    const extension = extensionFromFileName(file.name);
    if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
        throw new Error('Formato não suportado. Utilize PDF, TXT, EPUB ou MD.');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('O arquivo não pode ser maior que 50MB.');
    }

    if (form.cover && form.cover.type !== 'image/webp') {
        throw new Error('A capa deve estar no formato WebP.');
    }

    const { data: { user }, error: userError } = await getCurrentUser();
    if (userError) throw userError;
    if (!user) throw new Error('É necessário estar autenticado para enviar conteúdo.');

    const documentPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const coverPath = form.cover ? `${user.id}/${crypto.randomUUID()}.webp` : null;

    await uploadToBucket(
        LIBRARY_DOCUMENTS_BUCKET,
        documentPath,
        file,
        mimeFromExtension(extension)
    );

    if (form.cover && coverPath) {
        try {
            await uploadToBucket(LIBRARY_COVERS_BUCKET, coverPath, form.cover, 'image/webp');
        } catch (coverError) {
            await removeFromBucket(LIBRARY_DOCUMENTS_BUCKET, documentPath);
            throw coverError;
        }
    }

    const parsedYear = Number.parseInt(form.year, 10);
    const row: LibraryItemInsert = {
        uploaded_by: user.id,
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category,
        content_type: form.type,
        year: Number.isFinite(parsedYear) ? parsedYear : null,
        genre: form.genre.trim() || null,
        language: form.language || null,
        description: form.description.trim() || null,
        file_path: documentPath,
        file_name: file.name,
        file_mime: mimeFromExtension(extension),
        file_size: file.size,
        cover_path: coverPath
    };

    const { error: insertError } = await supabase.from('library_items').insert(row);

    if (insertError) {
        await removeFromBucket(LIBRARY_DOCUMENTS_BUCKET, documentPath);
        if (coverPath) {
            await removeFromBucket(LIBRARY_COVERS_BUCKET, coverPath);
        }
        throw insertError;
    }
};
