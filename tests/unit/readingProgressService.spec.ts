import { beforeEach, describe, expect, test, vi } from 'vitest';

const {
    eqMock,
    fromMock,
    getSessionMock,
    maybeSingleMock,
    selectMock,
    upsertMock
} = vi.hoisted(() => ({
    eqMock: vi.fn(),
    fromMock: vi.fn(),
    getSessionMock: vi.fn(),
    maybeSingleMock: vi.fn(),
    selectMock: vi.fn(),
    upsertMock: vi.fn()
}));

vi.mock('@/services/supabase', () => ({
    supabase: {
        auth: {
            getSession: getSessionMock
        },
        from: fromMock
    }
}));

const {
    getMyReadingProgressPosition,
    saveReadingProgressAutomatically
} = await import('@/services/readingProgressService');

describe('reading progress service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getSessionMock.mockResolvedValue({
            data: { session: { user: { id: 'user-123' } } },
            error: null
        });
        eqMock.mockImplementation(() => ({ eq: eqMock, maybeSingle: maybeSingleMock }));
        maybeSingleMock.mockResolvedValue({ data: { page: 4, percent: '40.00' }, error: null });
        selectMock.mockReturnValue({ eq: eqMock });
        upsertMock.mockResolvedValue({ error: null });
        fromMock.mockReturnValue({
            select: selectMock,
            upsert: upsertMock
        });
    });

    test('loads the signed-in user reading position for a document', async () => {
        await expect(getMyReadingProgressPosition('document-123')).resolves.toEqual({
            page: 4,
            percent: 40
        });
        expect(fromMock).toHaveBeenCalledWith('reading_progress');
        expect(selectMock).toHaveBeenCalledWith('page, percent');
        expect(eqMock).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
        expect(eqMock).toHaveBeenNthCalledWith(2, 'document_id', 'document-123');
        expect(maybeSingleMock).toHaveBeenCalledOnce();
    });

    test('does not create a record for a visitor who is not signed in', async () => {
        getSessionMock.mockResolvedValue({ data: { session: null }, error: null });

        await expect(saveReadingProgressAutomatically('document-123', 2, 20)).resolves.toBe(false);
        expect(fromMock).not.toHaveBeenCalled();
    });

    test('upserts an in-progress position for the authenticated user', async () => {
        await expect(saveReadingProgressAutomatically('document-123', 4.8, 44.4)).resolves.toBe(true);
        expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 'user-123',
            document_id: 'document-123',
            page: 4,
            percent: 44.4,
            status: 'lendo'
        }), { onConflict: 'user_id,document_id' });
    });

    test('marks a fully read document as completed', async () => {
        await saveReadingProgressAutomatically('document-123', 8, 100);

        expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({
            percent: 100,
            status: 'lido'
        }), { onConflict: 'user_id,document_id' });
    });

    test('surfaces database errors while saving progress', async () => {
        const error = new Error('Database unavailable');
        upsertMock.mockResolvedValue({ error });

        await expect(saveReadingProgressAutomatically('document-123', 1, 10)).rejects.toBe(error);
    });
});
