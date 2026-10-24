import { beforeEach, describe, expect, test, vi } from 'vitest';

interface LibraryRow {
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

interface QueryResponse {
    data: LibraryRow[] | null;
    count: number | null;
    error: Error | null;
}

interface QueryBuilder {
    select: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    range: ReturnType<typeof vi.fn>;
    then: (
        onFulfilled: (response: QueryResponse) => unknown,
        onRejected?: (reason: unknown) => unknown
    ) => Promise<unknown>;
}

const { fromMock } = vi.hoisted(() => ({
    fromMock: vi.fn()
}));

vi.mock('@/services/supabase', () => ({
    supabase: {
        from: fromMock,
        storage: {
            from: () => ({
                getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } })
            })
        }
    }
}));

vi.mock('@/services/uploadService', () => ({
    LIBRARY_COVERS_BUCKET: 'library-covers',
    LIBRARY_DOCUMENTS_BUCKET: 'library-documents'
}));

const { listPublicLibraryItems } = await import('@/services/libraryService');

const makeQuery = (response: QueryResponse): QueryBuilder => {
    const query: QueryBuilder = {
        select: vi.fn(),
        order: vi.fn(),
        range: vi.fn(),
        then: (onFulfilled, onRejected) => Promise.resolve(response).then(onFulfilled, onRejected)
    };

    query.select.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.range.mockReturnValue(query);
    return query;
};

const makeItem = (index: number): LibraryRow => ({
    id: `document-${index}`,
    title: `Document ${index}`,
    author: 'Test Author',
    category: 'literatura',
    genre: null,
    content_type: 'livro',
    year: null,
    description: null,
    file_name: `document-${index}.pdf`,
    file_path: `user/document-${index}.pdf`,
    cover_path: null
});

describe('listPublicLibraryItems', () => {
    beforeEach(() => {
        fromMock.mockReset();
    });

    test('loads every page so search includes documents beyond the first 1000', async () => {
        const firstPage = Array.from({ length: 1000 }, (_, index) => makeItem(index));
        const firstQuery = makeQuery({ data: firstPage, count: 1001, error: null });
        const lastQuery = makeQuery({ data: [makeItem(1000)], count: 1001, error: null });
        fromMock.mockReturnValueOnce(firstQuery).mockReturnValueOnce(lastQuery);

        const items = await listPublicLibraryItems();

        expect(items).toHaveLength(1001);
        expect(items.at(-1)?.id).toBe('document-1000');
        expect(firstQuery.range).toHaveBeenCalledWith(0, 999);
        expect(lastQuery.range).toHaveBeenCalledWith(1000, 1999);
    });

    test('surfaces an error if the database returns an empty page before the catalog ends', async () => {
        fromMock.mockReturnValueOnce(makeQuery({ data: [], count: 1, error: null }));

        await expect(listPublicLibraryItems()).rejects.toThrow('página vazia');
    });
});
