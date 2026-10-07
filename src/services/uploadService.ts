import { supabase } from '@/services/supabase';
import { getCurrentUser } from '@/services/authService';
import { convertImageToWebp } from '@/utils/convertImageToWebp';
import type { UploadForm } from '@/types/upload';
import type { LibraryItem, LibraryItemInsert } from '@/types/library';

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

export const uploadLibraryItem = async (file: File, form: UploadForm): Promise<LibraryItem> => {
    const extension = extensionFromFileName(file.name);
    if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
        throw new Error('Formato não suportado. Utilize PDF, TXT, EPUB ou MD.');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('O arquivo não pode ser maior que 50MB.');
    }

    let coverFile: File | null = form.cover;
    if (coverFile) {
        if (!coverFile.type.startsWith('image/')) {
            throw new Error('O arquivo de capa deve ser uma imagem válida (JPEG, PNG ou WebP).');
        }

        if (coverFile.type !== 'image/webp') {
            try {
                coverFile = await convertImageToWebp(coverFile, { maxSize: 1200, quality: 0.85 });
            } catch {
                throw new Error('Não foi possível processar e converter a capa para o formato WebP.');
            }
        }
    }

    const { data: { user }, error: userError } = await getCurrentUser();
    if (userError) throw userError;
    if (!user) throw new Error('É necessário estar autenticado para enviar conteúdo.');

    const documentPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const coverPath = coverFile ? `${user.id}/${crypto.randomUUID()}.webp` : null;

    await uploadToBucket(
        LIBRARY_DOCUMENTS_BUCKET,
        documentPath,
        file,
        mimeFromExtension(extension)
    );

    if (coverFile && coverPath) {
        try {
            await uploadToBucket(LIBRARY_COVERS_BUCKET, coverPath, coverFile, 'image/webp');
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

    const { data: insertedItem, error: insertError } = await supabase
        .from('library_items')
        .insert(row)
        .select()
        .single();

    if (insertError) {
        await removeFromBucket(LIBRARY_DOCUMENTS_BUCKET, documentPath);
        if (coverPath) {
            await removeFromBucket(LIBRARY_COVERS_BUCKET, coverPath);
        }
        throw insertError;
    }

    return insertedItem as LibraryItem;
};
