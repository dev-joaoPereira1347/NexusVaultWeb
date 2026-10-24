import { beforeEach, describe, expect, test, vi } from 'vitest';

interface FeaturedRow {
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

interface QueryBuilder {
    select: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    then: (
        onFulfilled: (response: { data: FeaturedRow[] | null; error: Error | null }) => unknown,
        onRejected?: (reason: unknown) => unknown
    ) => Promise<unknown>;
}

const { fromMock, getPublicUrlMock } = vi.hoisted(() => ({
    fromMock: vi.fn(),
    getPublicUrlMock: vi.fn()
}));

vi.mock('@/services/supabase', () => ({
    supabase: {
        from: fromMock,
        storage: { from: () => ({ getPublicUrl: getPublicUrlMock }) }
    }
}));

vi.mock('@/services/uploadService', () => ({
    LIBRARY_COVERS_BUCKET: 'library-covers',
    LIBRARY_DOCUMENTS_BUCKET: 'library-documents'
}));

const { listFeaturedPublicLibraryItems } = await import('@/services/libraryService');

const makeQuery = (response: { data: FeaturedRow[] | null; error: Error | null }): QueryBuilder => {
    const query: QueryBuilder = {
        select: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        then: (onFulfilled, onRejected) => Promise.resolve(response).then(onFulfilled, onRejected)
    };
    query.select.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    return query;
};

describe('listFeaturedPublicLibraryItems', () => {
    beforeEach(() => {
        fromMock.mockReset();
        getPublicUrlMock.mockImplementation((path: string) => ({
            data: { publicUrl: `https://storage.test/${path}` }
        }));
    });

    test('loads the latest eight items and maps public file URLs', async () => {
        const query = makeQuery({
            data: [{
                id: 'document-1',
                title: 'Recent work',
                author: 'Author',
                category: 'literatura',
                genre: null,
                content_type: 'livro',
                year: 2025,
                description: 'A new item',
                file_name: 'recent.pdf',
                file_path: 'user/recent.pdf',
                cover_path: 'user/cover.webp'
            }],
            error: null
        });
        fromMock.mockReturnValue(query);

        await expect(listFeaturedPublicLibraryItems()).resolves.toEqual([expect.objectContaining({
            id: 'document-1',
            title: 'Recent work',
            cover_url: 'https://storage.test/user/cover.webp',
            download_url: 'https://storage.test/user/recent.pdf'
        })]);

        expect(query.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: false });
        expect(query.order).toHaveBeenNthCalledWith(2, 'id', { ascending: true });
        expect(query.limit).toHaveBeenCalledWith(8);
    });

    test('surfaces catalog errors instead of presenting stale highlights as current', async () => {
        const error = new Error('Database unavailable');
        fromMock.mockReturnValue(makeQuery({ data: null, error }));

        await expect(listFeaturedPublicLibraryItems()).rejects.toBe(error);
    });
});
