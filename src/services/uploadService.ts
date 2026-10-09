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
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
};

const validateDocumentFile = (file: File) => {
    const extension = extensionFromFileName(file.name);
    if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
        throw new Error('Formato não suportado. Utilize PDF, TXT, EPUB ou MD.');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('O arquivo não pode ser maior que 50MB.');
    }

    return { extension, mimeType: mimeFromExtension(extension) };
};

const prepareCoverFile = async (file: File | null): Promise<File | null> => {
    let coverFile = file;
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

    return coverFile;
};

const cleanupUploadedFiles = async (files: Array<{ bucket: string; path: string }>) => {
    const results = await Promise.allSettled(files.map(({ bucket, path }) => removeFromBucket(bucket, path)));
    return results.flatMap((result, index) => result.status === 'rejected'
        ? [`${files[index].path}: ${result.reason instanceof Error ? result.reason.message : 'falha ao excluir arquivo'}`]
        : []);
};

const getCleanupFailure = (error: unknown, cleanupErrors: string[]) => {
    const message = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
            ? error.message
            : 'Erro desconhecido.';
    return new Error(cleanupErrors.length
        ? `${message} Também não foi possível limpar arquivos temporários: ${cleanupErrors.join('; ')}`
        : message);
};

export const uploadLibraryItem = async (file: File, form: UploadForm): Promise<LibraryItem> => {
    const { extension, mimeType } = validateDocumentFile(file);
    const coverFile = await prepareCoverFile(form.cover);

    const { data: { user }, error: userError } = await getCurrentUser();
    if (userError) throw userError;
    if (!user) throw new Error('É necessário estar autenticado para enviar conteúdo.');

    const documentPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const coverPath = coverFile ? `${user.id}/${crypto.randomUUID()}.webp` : null;

    await uploadToBucket(
        LIBRARY_DOCUMENTS_BUCKET,
        documentPath,
        file,
        mimeType
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
        year: Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : null,
        genre: form.genre.trim() || null,
        language: form.language || null,
        description: form.description.trim() || null,
        file_path: documentPath,
        file_name: file.name,
        file_mime: mimeType,
        file_size: file.size,
        cover_path: coverPath
    };

    const { data: insertedItem, error: insertError } = await supabase
        .from('library_items')
        .insert(row)
        .select()
        .single();

    if (insertError) {
        const cleanupErrors = await cleanupUploadedFiles([
            { bucket: LIBRARY_DOCUMENTS_BUCKET, path: documentPath },
            ...(coverPath ? [{ bucket: LIBRARY_COVERS_BUCKET, path: coverPath }] : [])
        ]);
        throw getCleanupFailure(insertError, cleanupErrors);
    }

    return insertedItem as LibraryItem;
};

export const updateMyLibraryItem = async (
    userId: string,
    itemId: string,
    form: UploadForm,
    replacementFile: File | null,
    removeCover: boolean
): Promise<string[]> => {
    if (!form.title.trim() || !form.author.trim() || !form.category || !form.type) {
        throw new Error('Preencha título, autor, categoria e tipo.');
    }

    const fileDetails = replacementFile ? validateDocumentFile(replacementFile) : null;
    const coverFile = await prepareCoverFile(form.cover);
    const { data: currentItem, error: lookupError } = await supabase
        .from('library_items')
        .select('file_path, cover_path')
        .eq('id', itemId)
        .eq('uploaded_by', userId)
        .maybeSingle();

    if (lookupError) throw lookupError;
    if (!currentItem) throw new Error('Documento não encontrado ou você não tem permissão para alterá-lo.');

    const stagedFiles: Array<{ bucket: string; path: string }> = [];
    const documentPath = fileDetails
        ? `${userId}/${crypto.randomUUID()}.${fileDetails.extension}`
        : currentItem.file_path;
    const coverPath = coverFile
        ? `${userId}/${crypto.randomUUID()}.webp`
        : removeCover
            ? null
            : currentItem.cover_path;

    try {
        if (fileDetails && replacementFile) {
            await uploadToBucket(LIBRARY_DOCUMENTS_BUCKET, documentPath, replacementFile, fileDetails.mimeType);
            stagedFiles.push({ bucket: LIBRARY_DOCUMENTS_BUCKET, path: documentPath });
        }
        if (coverFile && coverPath) {
            await uploadToBucket(LIBRARY_COVERS_BUCKET, coverPath, coverFile, 'image/webp');
            stagedFiles.push({ bucket: LIBRARY_COVERS_BUCKET, path: coverPath });
        }
    } catch (error) {
        const cleanupErrors = await cleanupUploadedFiles(stagedFiles);
        throw getCleanupFailure(error, cleanupErrors);
    }

    const parsedYear = Number.parseInt(form.year, 10);
    const updates = {
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category,
        content_type: form.type,
        year: Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : null,
        genre: form.genre.trim() || null,
        language: form.language || null,
        description: form.description.trim() || null,
        file_path: documentPath,
        ...(replacementFile && fileDetails ? {
            file_name: replacementFile.name,
            file_mime: fileDetails.mimeType,
            file_size: replacementFile.size
        } : {}),
        cover_path: coverPath,
        updated_at: new Date().toISOString()
    };

    const { data: updatedItem, error: updateError } = await supabase
        .from('library_items')
        .update(updates)
        .eq('id', itemId)
        .eq('uploaded_by', userId)
        .select('id')
        .maybeSingle();

    if (updateError || !updatedItem) {
        const error = updateError ?? new Error('Documento não encontrado ou você não tem permissão para alterá-lo.');
        const cleanupErrors = await cleanupUploadedFiles(stagedFiles);
        throw getCleanupFailure(error, cleanupErrors);
    }

    const obsoleteFiles = [
        ...(replacementFile ? [{ bucket: LIBRARY_DOCUMENTS_BUCKET, path: currentItem.file_path }] : []),
        ...(currentItem.cover_path && currentItem.cover_path !== coverPath
            ? [{ bucket: LIBRARY_COVERS_BUCKET, path: currentItem.cover_path }]
            : [])
    ];

    return cleanupUploadedFiles(obsoleteFiles);
};

export const deleteMyLibraryItem = async (userId: string, itemId: string): Promise<string[]> => {
    const { data: deletedItem, error } = await supabase
        .from('library_items')
        .delete()
        .eq('id', itemId)
        .eq('uploaded_by', userId)
        .select('file_path, cover_path')
        .maybeSingle();

    if (error) throw error;
    if (!deletedItem) throw new Error('Documento não encontrado ou você não tem permissão para excluí-lo.');

    return cleanupUploadedFiles([
        { bucket: LIBRARY_DOCUMENTS_BUCKET, path: deletedItem.file_path },
        ...(deletedItem.cover_path ? [{ bucket: LIBRARY_COVERS_BUCKET, path: deletedItem.cover_path }] : [])
    ]);
};
