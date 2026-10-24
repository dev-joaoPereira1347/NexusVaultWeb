import { beforeEach, describe, expect, test, vi } from 'vitest';

const { fromMock, getUserMock, insertMock } = vi.hoisted(() => ({
    fromMock: vi.fn(),
    getUserMock: vi.fn(),
    insertMock: vi.fn()
}));

vi.mock('@/services/supabase', () => ({
    supabase: {
        auth: { getUser: getUserMock },
        from: fromMock
    }
}));

const { submitDocumentReport } = await import('@/services/documentReportService');

describe('document report service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getUserMock.mockResolvedValue({ data: { user: { id: 'reporter-123' } }, error: null });
        insertMock.mockResolvedValue({ error: null });
        fromMock.mockReturnValue({ insert: insertMock });
    });

    test('stores a report attributed to the signed-in user and trims details', async () => {
        await submitDocumentReport({
            documentId: 'document-123',
            reason: 'copyright',
            details: '  Conteúdo protegido.  '
        });

        expect(fromMock).toHaveBeenCalledWith('document_reports');
        expect(insertMock).toHaveBeenCalledWith({
            document_id: 'document-123',
            reporter_id: 'reporter-123',
            reason: 'copyright',
            details: 'Conteúdo protegido.'
        });
    });

    test('stores omitted details as null', async () => {
        await submitDocumentReport({
            documentId: 'document-123',
            reason: 'spam',
            details: '   '
        });

        expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ details: null }));
    });

    test('requires an authenticated user and does not attempt an insert', async () => {
        getUserMock.mockResolvedValue({ data: { user: null }, error: null });

        await expect(submitDocumentReport({
            documentId: 'document-123',
            reason: 'other',
            details: ''
        })).rejects.toThrow('Entre na sua conta para denunciar um documento.');

        expect(insertMock).not.toHaveBeenCalled();
    });

    test('reports duplicate submissions with a clear message', async () => {
        insertMock.mockResolvedValue({ error: { code: '23505' } });

        await expect(submitDocumentReport({
            documentId: 'document-123',
            reason: 'spam',
            details: ''
        })).rejects.toThrow('Você já enviou uma denúncia para este documento.');
    });

    test('rejects details beyond the database limit', async () => {
        await expect(submitDocumentReport({
            documentId: 'document-123',
            reason: 'other',
            details: 'a'.repeat(2001)
        })).rejects.toThrow('Os detalhes devem ter no máximo 2000 caracteres.');

        expect(getUserMock).not.toHaveBeenCalled();
        expect(insertMock).not.toHaveBeenCalled();
    });
});
