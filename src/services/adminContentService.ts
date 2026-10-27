import { supabase } from '@/services/supabase';

export interface AdminManagedUser {
    id: string;
    email: string | null;
    name: string | null;
    isAdmin: boolean;
}

export interface AdminManagedDocument {
    id: string;
    title: string;
    author: string;
    uploaded_by: string;
    created_at: string;
}

export type AdminContentType = 'livro' | 'documento';

interface AdminListResult<T> {
    items: T[];
    hasMore: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const requestAdminContent = async <T>(body: Record<string, unknown>): Promise<T> => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user || user.app_metadata.role !== 'admin') {
        throw new Error('Acesso restrito à equipe administrativa.');
    }

    const { data, error } = await supabase.functions.invoke('admin-content', { body });
    if (error) {
        const response = 'context' in error && error.context instanceof Response
            ? await error.context.clone().json().catch(() => null)
            : null;
        throw new Error(typeof response?.error === 'string' ? response.error : error.message);
    }
    if (!data || typeof data !== 'object') {
        throw new Error('O serviço administrativo retornou uma resposta inválida.');
    }
    if ('error' in data && typeof data.error === 'string') {
        throw new Error(data.error);
    }
    return data as T;
};

const readListResult = <T>(value: unknown, key: 'users' | 'documents'): AdminListResult<T> => {
    if (
        !isRecord(value)
        || !(key in value)
        || !Array.isArray(value[key])
        || !('hasMore' in value)
        || typeof value.hasMore !== 'boolean'
    ) {
        throw new Error('O serviço administrativo retornou uma lista inválida.');
    }
    return { items: value[key] as T[], hasMore: value.hasMore };
};

export const listAdminUsers = async (page: number): Promise<AdminListResult<AdminManagedUser>> =>
    readListResult(await requestAdminContent<unknown>({ action: 'list_users', page }), 'users');

export const listAdminDocuments = async (
    page: number,
    contentType: AdminContentType
): Promise<AdminListResult<AdminManagedDocument>> =>
    readListResult(await requestAdminContent<unknown>({ action: 'list_documents', page, contentType }), 'documents');

export const deleteAdminUser = async (userId: string): Promise<{ removedDocuments: number }> => {
    const result = await requestAdminContent<unknown>({ action: 'delete_user', userId });
    if (
        typeof result !== 'object'
        || result === null
        || !('success' in result)
        || result.success !== true
        || !('removedDocuments' in result)
        || typeof result.removedDocuments !== 'number'
    ) {
        throw new Error('O serviço não confirmou a remoção da conta.');
    }
    return { removedDocuments: result.removedDocuments };
};

export const deleteAdminDocument = async (documentId: string, contentType: AdminContentType): Promise<void> => {
    const result = await requestAdminContent<unknown>({ action: 'delete_document', documentId, contentType });
    if (
        typeof result !== 'object'
        || result === null
        || !('success' in result)
        || result.success !== true
    ) {
        throw new Error('O serviço não confirmou a remoção do documento.');
    }
};
