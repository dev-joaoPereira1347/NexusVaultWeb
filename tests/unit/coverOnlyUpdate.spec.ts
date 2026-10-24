import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { UploadForm } from '@/types/upload';

const { chain, convertImageMock, fromMock, getCurrentUserMock, invokeMock, uploadMock } = vi.hoisted(() => {
    const queryChain = {
        eq: vi.fn(),
        insert: vi.fn(),
        maybeSingle: vi.fn(),
        select: vi.fn(),
        single: vi.fn()
    };
    queryChain.eq.mockReturnValue(queryChain);
    queryChain.insert.mockReturnValue(queryChain);
    queryChain.select.mockReturnValue(queryChain);

    return {
        chain: queryChain,
        convertImageMock: vi.fn(),
        fromMock: vi.fn(() => queryChain),
        getCurrentUserMock: vi.fn(),
        invokeMock: vi.fn(),
        uploadMock: vi.fn()
    };
});

vi.mock('@/services/supabase', () => ({
    supabase: {
        from: fromMock,
        functions: { invoke: invokeMock },
        storage: { from: vi.fn(() => ({ upload: uploadMock })) }
    }
}));

vi.mock('@/services/authService', () => ({
    getCurrentUser: getCurrentUserMock
}));

vi.mock('@/utils/convertImageToWebp', () => ({
    convertImageToWebp: convertImageMock
}));

const { updateMyLibraryItem } = await import('@/services/uploadService');

const form: UploadForm = {
    title: 'Livro existente',
    author: 'Autora',
    category: 'literatura',
    year: '2025',
    type: 'livro',
    genre: '',
    language: 'pt',
    description: '',
    cover: null,
    rightsDeclarationAccepted: false
};

describe('cover-only document update', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        chain.eq.mockReturnValue(chain);
        chain.insert.mockReturnValue(chain);
        chain.select.mockReturnValue(chain);
        chain.maybeSingle.mockResolvedValue({
            data: {
                file_path: 'user-123/original.pdf',
                file_name: 'original.pdf',
                file_mime: 'application/pdf',
                file_size: 100,
                cover_path: null
            },
            error: null
        });
        chain.single.mockResolvedValue({
            data: {
                id: 'request-123',
                target_item_id: 'item-123',
                title: 'Livro existente',
                file_name: 'original.pdf',
                status: 'pending',
                status_message: null,
                created_at: '2026-10-19T12:00:00Z',
                updated_at: '2026-10-19T12:00:00Z'
            },
            error: null
        });
        getCurrentUserMock.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
        });
        uploadMock.mockResolvedValue({ error: null });
        invokeMock.mockResolvedValue({ error: null });
    });

    test('queues one cover file for antivirus scanning without replacing the document', async () => {
        const cover = new File(['cover bytes'], 'cover.webp', { type: 'image/webp' });
        const result = await updateMyLibraryItem('user-123', 'item-123', { ...form, cover }, null, false);
        const request = chain.insert.mock.calls[0][0];

        expect(uploadMock).toHaveBeenCalledOnce();
        expect(uploadMock.mock.calls[0][0]).toMatch(/^user-123\/.+\.webp$/);
        expect(uploadMock.mock.calls[0][1]).toBe(cover);
        expect(request).toEqual(expect.objectContaining({
            target_item_id: 'item-123',
            is_update: true,
            file_path: 'user-123/original.pdf',
            document_quarantine_path: null,
            cover_path: uploadMock.mock.calls[0][0],
            cover_quarantine_path: uploadMock.mock.calls[0][0]
        }));
        expect(invokeMock).toHaveBeenCalledWith('scan-virus-total', {
            body: { action: 'start', requestId: request.id }
        });
        expect(result.uploadRequest?.id).toBe('request-123');
    });
});
