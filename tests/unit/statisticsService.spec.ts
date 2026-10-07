import { beforeEach, describe, expect, test, vi } from 'vitest';

interface QueryResponse {
    data: { uploaded_by: string }[] | null;
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
    supabase: { from: fromMock }
}));

const { getPublicLibraryStatistics } = await import('@/services/statisticsService');

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

describe('getPublicLibraryStatistics', () => {
    beforeEach(() => {
        fromMock.mockReset();
    });

    test('counts documents and unique contributors across pages', async () => {
        const firstPageIds = Array.from({ length: 1000 }, (_, index) => `user-${index}`);
        fromMock
            .mockReturnValueOnce(makeQuery({ data: null, count: 2048, error: null }))
            .mockReturnValueOnce(makeQuery({
                data: firstPageIds.map((uploaded_by) => ({ uploaded_by })),
                count: 1001,
                error: null
            }))
            .mockReturnValueOnce(makeQuery({
                data: [{ uploaded_by: firstPageIds[0] }],
                count: 1001,
                error: null
            }));

        await expect(getPublicLibraryStatistics()).resolves.toEqual({
            documentCount: 2048,
            contributorCount: 1000
        });
        expect(fromMock).toHaveBeenCalledTimes(3);
    });

    test('throws when the database query fails', async () => {
        const error = new Error('Database unavailable');
        fromMock
            .mockReturnValueOnce(makeQuery({ data: null, count: 10, error: null }))
            .mockReturnValueOnce(makeQuery({ data: null, count: null, error }));

        await expect(getPublicLibraryStatistics()).rejects.toBe(error);
    });

    test('throws when the database omits the exact document count', async () => {
        fromMock
            .mockReturnValueOnce(makeQuery({ data: null, count: null, error: null }))
            .mockReturnValueOnce(makeQuery({ data: [], count: 0, error: null }));

        await expect(getPublicLibraryStatistics()).rejects.toThrow('não retornou a contagem');
    });
});
