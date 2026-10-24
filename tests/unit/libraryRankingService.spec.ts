import { beforeEach, describe, expect, test, vi } from 'vitest';

const { fromMock, getPublicUrlMock, rpcMock } = vi.hoisted(() => ({
    fromMock: vi.fn(),
    getPublicUrlMock: vi.fn(),
    rpcMock: vi.fn()
}));

vi.mock('@/services/supabase', () => ({
    supabase: {
        from: fromMock,
        rpc: rpcMock,
        storage: { from: () => ({ getPublicUrl: getPublicUrlMock }) }
    }
}));

vi.mock('@/services/uploadService', () => ({
    LIBRARY_COVERS_BUCKET: 'library-covers',
    LIBRARY_DOCUMENTS_BUCKET: 'library-documents'
}));

const { listRankedPublicLibraryItems, recordLibraryItemMetric } =
    await import('@/services/libraryService');

describe('library ranking service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getPublicUrlMock.mockImplementation((path: string) => ({
            data: { publicUrl: `https://storage.test/${path}` }
        }));
    });

    test('loads rankings by metric and category, mapping counts and public URLs', async () => {
        rpcMock.mockResolvedValue({
            data: [{
                id: 'document-1',
                title: 'Most read',
                author: 'Author',
                category: 'literatura',
                genre: 'Romance',
                content_type: 'livro',
                year: 1900,
                description: 'A classic',
                file_name: 'classic.pdf',
                file_path: 'owner/classic.pdf',
                cover_path: 'owner/classic.webp',
                access_count: '42',
                download_count: '12'
            }],
            error: null
        });

        await expect(listRankedPublicLibraryItems('accesses', 'literatura', 5)).resolves.toEqual([{
            id: 'document-1',
            title: 'Most read',
            author: 'Author',
            category: 'literatura',
            genre: 'Romance',
            content_type: 'livro',
            year: 1900,
            description: 'A classic',
            file_name: 'classic.pdf',
            cover_url: 'https://storage.test/owner/classic.webp',
            download_url: 'https://storage.test/owner/classic.pdf',
            access_count: 42,
            download_count: 12
        }]);

        expect(rpcMock).toHaveBeenCalledWith('get_library_item_rankings', {
            p_metric: 'accesses',
            p_category: 'literatura',
            p_limit: 5
        });
        expect(fromMock).not.toHaveBeenCalled();
    });

    test('records access and download metrics through the RPC', async () => {
        rpcMock.mockResolvedValue({ error: null });

        await expect(recordLibraryItemMetric('document-1', 'downloads')).resolves.toBeUndefined();

        expect(rpcMock).toHaveBeenCalledWith('record_library_item_metric', {
            p_document_id: 'document-1',
            p_metric: 'downloads'
        });
    });

    test('surfaces metric recording errors', async () => {
        const error = new Error('Database unavailable');
        rpcMock.mockResolvedValue({ error });

        await expect(recordLibraryItemMetric('document-1', 'accesses')).rejects.toBe(error);
    });
});
