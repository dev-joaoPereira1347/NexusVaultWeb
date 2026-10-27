import { supabase } from '@/services/supabase';
import { getCurrentUser } from '@/services/authService';
import { convertImageToWebp } from '@/utils/convertImageToWebp';
import type { UploadForm } from '@/types/upload';
import type { LibraryUploadRequest } from '@/types/userArea';
import { parsePublicationYear } from '@/utils/publicationYear';
import { ALLOWED_DOCUMENT_EXTENSIONS, MAX_DOCUMENT_FILE_SIZE_BYTES } from '@/constants/uploadConfig';

/** Bucket público para arquivos (PDF, EPUB, TXT, MD). */
export const LIBRARY_DOCUMENTS_BUCKET = 'library-documents';

/** Bucket público para capas em WebP. */
export const LIBRARY_COVERS_BUCKET = 'library-covers';

const LIBRARY_QUARANTINE_BUCKET = 'library-quarantine';
type UploadProgressCallback = (progress: number) => void;

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

const uploadToBucket = async (
    bucket: string,
    path: string,
    file: File,
    contentType: string,
    onProgress?: UploadProgressCallback
) => {
    if (onProgress) {
        const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path, { upsert: false });
        if (error) throw error;

        await new Promise<void>((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open('PUT', data.signedUrl);
            request.setRequestHeader('cache-control', 'max-age=3600');
            request.setRequestHeader('content-type', contentType);
            request.setRequestHeader('x-upsert', 'false');
            request.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    onProgress(Math.round((event.loaded / event.total) * 100));
                }
            });
            request.addEventListener('load', () => {
                if (request.status >= 200 && request.status < 300) {
                    resolve();
                } else {
                    reject(new Error('Não foi possível enviar o arquivo.'));
                }
            });
            request.addEventListener('error', () => reject(new Error('Não foi possível enviar o arquivo.')));
            request.addEventListener('abort', () => reject(new Error('O envio do arquivo foi interrompido.')));
            request.send(file);
        });
        return;
    }

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
    if (!extension || !ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) {
        throw new Error('Formato não suportado. Utilize PDF, TXT, EPUB ou MD.');
    }

    if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
        throw new Error('O arquivo não pode ser maior que 50MB.');
    }

    return { extension, mimeType: mimeFromExtension(extension) };
};

const validateUploadMetadata = (form: UploadForm, requireRightsDeclaration: boolean) => {
    if (!form.title.trim() || !form.author.trim() || !form.category || !form.type) {
        throw new Error('Preencha título, autor, categoria e tipo.');
    }

    const year = parsePublicationYear(form.year);
    if (year === null) {
        throw new Error(`Informe um ano válido entre 1 e ${new Date().getFullYear()}.`);
    }
    if (requireRightsDeclaration && !form.rightsDeclarationAccepted) {
        throw new Error('Confirme a declaração de direitos autorais antes de enviar o documento.');
    }

    return year;
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

type ScannableFile = {
    file: File;
    kind: 'document' | 'cover';
    mimeType: string;
    path: string;
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

type QueueUploadDetails = {
    userId: string;
    form: UploadForm;
    fileName: string;
    fileMime: string;
    fileSize: number;
    filePath: string;
    documentQuarantinePath: string | null;
    coverPath: string | null;
    coverQuarantinePath: string | null;
    targetItemId: string | null;
    collectionIds?: string[];
    isUpdate: boolean;
    files: ScannableFile[];
    onProgress?: UploadProgressCallback;
};

const startBackgroundScan = async (requestId: string) => {
    try {
        const { error } = await supabase.functions.invoke('scan-virus-total', {
            body: { action: 'start', requestId }
        });
        if (!error) return null;

        const response = 'context' in error && error.context instanceof Response
            ? await error.context.clone().json().catch(() => null)
            : null;
        return typeof response?.error === 'string'
            ? response.error
            : 'O envio foi salvo, mas ainda não foi possível iniciar a verificação. Atualize o status na área do usuário.';
    } catch {
        return 'O envio foi salvo, mas ainda não foi possível iniciar a verificação. Atualize o status na área do usuário.';
    }
};

export const checkLibraryUploadRequest = async (requestId: string): Promise<void> => {
    const { error } = await supabase.functions.invoke('scan-virus-total', {
        body: { action: 'check', requestId }
    });
    if (!error) return;

    const response = 'context' in error && error.context instanceof Response
        ? await error.context.clone().json().catch(() => null)
        : null;
    throw new Error(typeof response?.error === 'string' ? response.error : error.message);
};

const createUploadRequest = async (details: QueueUploadDetails): Promise<LibraryUploadRequest> => {
    const { userId, form, files } = details;
    const parsedYear = validateUploadMetadata(form, !details.isUpdate);
    const uploadedFiles: Array<{ bucket: string; path: string }> = [];
    const totalFileSize = files.reduce((total, { file }) => total + file.size, 0);
    let completedFileSize = 0;

    try {
        for (const { file, mimeType, path } of files) {
            await uploadToBucket(
                LIBRARY_QUARANTINE_BUCKET,
                path,
                file,
                mimeType,
                details.onProgress
                    ? (fileProgress) => {
                        const completed = completedFileSize + (file.size * fileProgress) / 100;
                        details.onProgress?.(totalFileSize > 0
                            ? Math.round((completed / totalFileSize) * 95)
                            : 0);
                    }
                    : undefined
            );
            uploadedFiles.push({ bucket: LIBRARY_QUARANTINE_BUCKET, path });
            completedFileSize += file.size;
            if (totalFileSize > 0) {
                details.onProgress?.(Math.round((completedFileSize / totalFileSize) * 95));
            }
        }

        const requestId = crypto.randomUUID();
        const { data, error } = await supabase
            .from('library_upload_requests')
            .insert({
                id: requestId,
                uploaded_by: userId,
                target_item_id: details.targetItemId ?? requestId,
                is_update: details.isUpdate,
                collection_ids: !details.isUpdate && form.type === 'livro'
                    ? [...new Set(details.collectionIds ?? [])]
                    : [],
                status: 'pending',
                title: form.title.trim(),
                author: form.author.trim(),
                category: form.category,
                content_type: form.type,
                year: parsedYear,
                rights_declaration_accepted: !details.isUpdate && form.rightsDeclarationAccepted,
                rights_declaration_accepted_at: !details.isUpdate && form.rightsDeclarationAccepted
                    ? new Date().toISOString()
                    : null,
                genre: form.genre.trim() || null,
                language: form.language || null,
                description: form.description.trim() || null,
                file_name: details.fileName,
                file_mime: details.fileMime,
                file_size: details.fileSize,
                file_path: details.filePath,
                document_quarantine_path: details.documentQuarantinePath,
                cover_path: details.coverPath,
                cover_quarantine_path: details.coverQuarantinePath
            })
            .select('id, target_item_id, title, file_name, status, status_message, created_at, updated_at')
            .single();
        if (error) throw error;

        details.onProgress?.(100);
        const statusMessage = await startBackgroundScan(requestId);
        return {
            ...data,
            status_message: statusMessage ?? data.status_message
        } as LibraryUploadRequest;
    } catch (error) {
        const cleanupErrors = await cleanupUploadedFiles(uploadedFiles);
        throw getCleanupFailure(error, cleanupErrors);
    }
};

export const uploadLibraryItem = async (
    file: File,
    form: UploadForm,
    onProgress?: UploadProgressCallback,
    collectionIds: string[] = []
): Promise<LibraryUploadRequest> => {
    const { extension, mimeType } = validateDocumentFile(file);
    validateUploadMetadata(form, true);
    if (form.type !== 'livro' && collectionIds.length > 0) {
        throw new Error('Só é possível organizar livros em coleções.');
    }
    const coverFile = await prepareCoverFile(form.cover);

    const { data: { user }, error: userError } = await getCurrentUser();
    if (userError) throw userError;
    if (!user) throw new Error('É necessário estar autenticado para enviar conteúdo.');

    const documentPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const coverPath = coverFile ? `${user.id}/${crypto.randomUUID()}.webp` : null;
    return createUploadRequest({
        userId: user.id,
        form,
        fileName: file.name,
        fileMime: mimeType,
        fileSize: file.size,
        filePath: documentPath,
        documentQuarantinePath: documentPath,
        coverPath,
        coverQuarantinePath: coverPath,
        targetItemId: null,
        collectionIds,
        isUpdate: false,
        onProgress,
        files: [
        { file, kind: 'document', mimeType, path: documentPath },
        ...(coverFile && coverPath
            ? [{ file: coverFile, kind: 'cover' as const, mimeType: 'image/webp', path: coverPath }]
            : [])
        ]
    });
};

export const updateMyLibraryItem = async (
    userId: string,
    itemId: string,
    form: UploadForm,
    replacementFile: File | null,
    removeCover: boolean
): Promise<{ cleanupErrors: string[]; uploadRequest: LibraryUploadRequest | null }> => {
    validateUploadMetadata(form, false);

    const fileDetails = replacementFile ? validateDocumentFile(replacementFile) : null;
    const coverFile = await prepareCoverFile(form.cover);
    const { data: currentItem, error: lookupError } = await supabase
        .from('library_items')
        .select('file_path, file_name, file_mime, file_size, cover_path')
        .eq('id', itemId)
        .eq('uploaded_by', userId)
        .maybeSingle();

    if (lookupError) throw lookupError;
    if (!currentItem) throw new Error('Documento não encontrado ou você não tem permissão para alterá-lo.');

    const documentPath = fileDetails
        ? `${userId}/${crypto.randomUUID()}.${fileDetails.extension}`
        : currentItem.file_path;
    const coverPath = coverFile
        ? `${userId}/${crypto.randomUUID()}.webp`
        : removeCover
            ? null
            : currentItem.cover_path;

    if (replacementFile || coverFile) {
        const files: ScannableFile[] = [];
        if (replacementFile && fileDetails) {
            files.push({
                file: replacementFile,
                kind: 'document',
                mimeType: fileDetails.mimeType,
                path: documentPath
            });
        }
        if (coverFile && coverPath) {
            files.push({
                file: coverFile,
                kind: 'cover',
                mimeType: 'image/webp',
                path: coverPath
            });
        }

        const uploadRequest = await createUploadRequest({
            userId,
            form,
            fileName: replacementFile ? replacementFile.name : currentItem.file_name,
            fileMime: fileDetails ? fileDetails.mimeType : currentItem.file_mime,
            fileSize: replacementFile ? replacementFile.size : currentItem.file_size,
            filePath: documentPath,
            documentQuarantinePath: replacementFile ? documentPath : null,
            coverPath,
            coverQuarantinePath: coverFile ? coverPath : null,
            targetItemId: itemId,
            isUpdate: true,
            files
        });
        return { cleanupErrors: [], uploadRequest };
    }

    const parsedYear = validateUploadMetadata(form, false);
    const updates = {
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category,
        content_type: form.type,
        year: parsedYear,
        genre: form.genre.trim() || null,
        language: form.language || null,
        description: form.description.trim() || null,
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
        throw error;
    }

    const obsoleteFiles = [
        ...(replacementFile ? [{ bucket: LIBRARY_DOCUMENTS_BUCKET, path: currentItem.file_path }] : []),
        ...(currentItem.cover_path && currentItem.cover_path !== coverPath
            ? [{ bucket: LIBRARY_COVERS_BUCKET, path: currentItem.cover_path }]
            : [])
    ];

    return { cleanupErrors: await cleanupUploadedFiles(obsoleteFiles), uploadRequest: null };
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
