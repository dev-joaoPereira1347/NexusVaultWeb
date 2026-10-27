import { beforeEach, describe, expect, test, vi } from 'vitest';

const { getUserMock, invokeMock } = vi.hoisted(() => ({
    getUserMock: vi.fn(),
    invokeMock: vi.fn()
}));

vi.mock('@/services/supabase', () => ({
    supabase: {
        auth: { getUser: getUserMock },
        functions: { invoke: invokeMock }
    }
}));

const {
    deleteAdminDocument,
    deleteAdminUser,
    listAdminDocuments,
    listAdminUsers
} = await import('@/services/adminContentService');

describe('admin content service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getUserMock.mockResolvedValue({
            data: { user: { id: 'admin-123', app_metadata: { role: 'admin' } } },
            error: null
        });
        invokeMock.mockResolvedValue({ data: { success: true }, error: null });
    });

    test('requests paginated users through the protected admin function', async () => {
        invokeMock.mockResolvedValue({
            data: { users: [{ id: 'user-123', email: 'person@example.com', name: 'Person', isAdmin: false }], hasMore: true },
            error: null
        });

        await expect(listAdminUsers(2)).resolves.toEqual({
            items: [{ id: 'user-123', email: 'person@example.com', name: 'Person', isAdmin: false }],
            hasMore: true
        });
        expect(invokeMock).toHaveBeenCalledWith('admin-content', { body: { action: 'list_users', page: 2 } });
    });

    test('lists books and does not proceed for non-admin users', async () => {
        invokeMock.mockResolvedValue({
            data: { documents: [{ id: 'document-123' }], hasMore: false },
            error: null
        });
        await expect(listAdminDocuments(1, 'livro')).resolves.toEqual({
            items: [{ id: 'document-123' }],
            hasMore: false
        });
        expect(invokeMock).toHaveBeenCalledWith('admin-content', {
            body: { action: 'list_documents', page: 1, contentType: 'livro' }
        });

        getUserMock.mockResolvedValue({
            data: { user: { id: 'user-123', app_metadata: {} } },
            error: null
        });
        await expect(listAdminDocuments(1, 'documento')).rejects.toThrow('Acesso restrito à equipe administrativa.');
        expect(invokeMock).toHaveBeenCalledTimes(1);
    });

    test('invokes document removal and requires explicit success', async () => {
        await expect(deleteAdminDocument('document-123', 'documento')).resolves.toBeUndefined();
        expect(invokeMock).toHaveBeenCalledWith('admin-content', {
            body: { action: 'delete_document', documentId: 'document-123', contentType: 'documento' }
        });

        invokeMock.mockResolvedValue({ data: { success: false }, error: null });
        await expect(deleteAdminDocument('document-123', 'documento')).rejects.toThrow(
            'O serviço não confirmou a remoção do documento.'
        );
    });

    test('returns associated document count after confirmed user removal', async () => {
        invokeMock.mockResolvedValue({ data: { success: true, removedDocuments: 3 }, error: null });
        await expect(deleteAdminUser('user-123')).resolves.toEqual({ removedDocuments: 3 });
        expect(invokeMock).toHaveBeenCalledWith('admin-content', {
            body: { action: 'delete_user', userId: 'user-123' }
        });
    });
});
