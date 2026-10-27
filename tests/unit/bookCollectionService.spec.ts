import { beforeEach, describe, expect, test, vi } from 'vitest';

const { fromMock, getCurrentUserMock } = vi.hoisted(() => ({
    fromMock: vi.fn(),
    getCurrentUserMock: vi.fn()
}));

vi.mock('@/services/supabase', () => ({
    supabase: {
        from: fromMock
    }
}));

vi.mock('@/services/authService', () => ({
    getCurrentUser: getCurrentUserMock
}));

const { createBookCollection, listPublicBookCollections } = await import('@/services/bookCollectionService');

const makeQuery = <T>(response: { data: T; error: unknown | null }) => {
    const query = {
        select: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        in: vi.fn(),
        then: (onFulfilled: (value: typeof response) => unknown, onRejected?: (reason: unknown) => unknown) =>
            Promise.resolve(response).then(onFulfilled, onRejected)
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.in.mockReturnValue(query);
    return query;
};

describe('book collection service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getCurrentUserMock.mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null
        });
    });

    test('creates a collection using only its name and visibility', async () => {
        const singleMock = vi.fn().mockResolvedValue({ data: { id: 'collection-1' }, error: null });
        const selectMock = vi.fn().mockReturnValue({ single: singleMock });
        const insertMock = vi.fn().mockReturnValue({ select: selectMock });
        fromMock.mockReturnValue({ insert: insertMock });

        await expect(createBookCollection({ name: '  Ler depois  ', isPublic: false }))
            .resolves.toBe('collection-1');

        expect(fromMock).toHaveBeenCalledWith('book_collections');
        expect(insertMock).toHaveBeenCalledWith({
            user_id: 'user-1',
            name: 'Ler depois',
            is_public: false
        });
    });

    test('only fetches public collections for the requested profile', async () => {
        const collection = {
            id: 'collection-1',
            user_id: 'user-1',
            name: 'Ficção',
            description: null,
            is_public: true,
            updated_at: '2026-10-27T12:00:00Z'
        };
        const collectionsQuery = makeQuery({ data: [collection], error: null });
        const itemsQuery = makeQuery({ data: [], error: null });
        fromMock.mockReturnValueOnce(collectionsQuery).mockReturnValueOnce(itemsQuery);

        await expect(listPublicBookCollections('user-1')).resolves.toEqual([{
            ...collection,
            description: '',
            items: []
        }]);

        expect(fromMock).toHaveBeenNthCalledWith(1, 'book_collections');
        expect(collectionsQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(collectionsQuery.eq).toHaveBeenCalledWith('is_public', true);
        expect(fromMock).toHaveBeenNthCalledWith(2, 'book_collection_items');
    });

    test('surfaces collection query failures', async () => {
        const error = new Error('Database unavailable');
        fromMock.mockReturnValue(makeQuery({ data: null, error }));

        await expect(listPublicBookCollections('user-1')).rejects.toThrow(
            'Não foi possível acessar as coleções: Database unavailable'
        );
    });

    test('explains when collection migrations are missing from Supabase', async () => {
        const error = Object.assign(new Error('Could not find the table in the schema cache'), {
            code: 'PGRST205'
        });
        fromMock.mockReturnValue(makeQuery({ data: null, error }));

        await expect(listPublicBookCollections('user-1')).rejects.toThrow(
            'Aplique a migração 20261027143000_book_collections.sql no Supabase'
        );
    });
});
