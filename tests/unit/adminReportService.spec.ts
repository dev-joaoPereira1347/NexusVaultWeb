import { beforeEach, describe, expect, test, vi } from 'vitest';

const {
    eqMock,
    fromMock,
    getUserMock,
    inMock,
    limitMock,
    maybeSingleMock,
    orderMock,
    profileMock,
    selectMock,
    invokeMock,
    updateMock
} = vi.hoisted(() => ({
    eqMock: vi.fn(),
    fromMock: vi.fn(),
    getUserMock: vi.fn(),
    inMock: vi.fn(),
    limitMock: vi.fn(),
    maybeSingleMock: vi.fn(),
    orderMock: vi.fn(),
    profileMock: vi.fn(),
    selectMock: vi.fn(),
    invokeMock: vi.fn(),
    updateMock: vi.fn()
}));

vi.mock('@/services/supabase', () => ({
    supabase: {
        auth: { getUser: getUserMock },
        functions: { invoke: invokeMock },
        from: fromMock
    }
}));

vi.mock('@/services/authService', () => ({
    getPublicProfile: profileMock
}));

const query = {
    eq: eqMock,
    in: inMock,
    limit: limitMock,
    maybeSingle: maybeSingleMock,
    order: orderMock,
    select: selectMock,
    update: updateMock
};

const { approveAdminDocumentReport, listAdminDocumentReports, updateAdminDocumentReportStatus } =
    await import('@/services/adminReportService');
const { resolveAdminUserReport } = await import('@/services/adminReportService');

describe('admin document reports', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getUserMock.mockResolvedValue({
            data: { user: { id: 'admin-123', app_metadata: { role: 'admin' } } },
            error: null
        });
        fromMock.mockReturnValue(query);
        selectMock.mockReturnValue(query);
        orderMock.mockReturnValue(query);
        updateMock.mockReturnValue(query);
        eqMock.mockReturnValue(query);
        inMock.mockReturnValue(query);
        profileMock.mockResolvedValue(null);
        invokeMock.mockResolvedValue({
            data: { status: 'resolved', documentDeleted: true },
            error: null
        });
    });

    test('loads reports and joins document details for administrators', async () => {
        limitMock.mockResolvedValue({
            data: [{
                id: 'report-1',
                document_id: 'document-1',
                reported_document_id: 'document-1',
                reporter_id: 'reporter-1',
                reason: 'copyright',
                details: 'Please review',
                status: 'pending',
                created_at: '2026-10-19T12:00:00Z',
                reviewed_at: null,
                reviewed_by: null
            }],
            error: null
        });
        inMock.mockResolvedValue({
            data: [{ id: 'document-1', title: 'Example', author: 'Author', uploaded_by: 'uploader-1' }],
            error: null
        });

        const reports = await listAdminDocumentReports();

        expect(fromMock).toHaveBeenNthCalledWith(1, 'document_reports');
        expect(fromMock).toHaveBeenNthCalledWith(2, 'library_items');
        expect(inMock).toHaveBeenCalledWith('id', ['document-1']);
        expect(reports[0].document).toEqual({
            title: 'Example',
            author: 'Author',
            uploaded_by: 'uploader-1'
        });
        expect(selectMock).toHaveBeenCalledWith(expect.stringContaining('reported_document_id'));
    });

    test('does not read reports when the current user is not an administrator', async () => {
        getUserMock.mockResolvedValue({
            data: { user: { id: 'user-123', app_metadata: {} } },
            error: null
        });

        await expect(listAdminDocumentReports()).rejects.toThrow('Acesso restrito à equipe administrativa.');
        expect(fromMock).not.toHaveBeenCalled();
    });

    test('records the reviewer and review timestamp with a decision', async () => {
        maybeSingleMock.mockResolvedValue({ data: { id: 'report-1' }, error: null });

        const reviewerId = await updateAdminDocumentReportStatus('report-1', 'dismissed');

        expect(reviewerId).toBe('admin-123');
        expect(fromMock).toHaveBeenCalledWith('document_reports');
        expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
            status: 'dismissed',
            reviewed_by: 'admin-123',
            reviewed_at: expect.any(String)
        }));
        expect(eqMock).toHaveBeenCalledWith('id', 'report-1');
        expect(inMock).toHaveBeenCalledWith('status', ['pending', 'reviewing']);
    });

    test('approves removal only through the protected moderation function', async () => {
        await expect(approveAdminDocumentReport('report-1')).resolves.toEqual({
            reviewerId: 'admin-123',
            documentDeleted: true
        });

        expect(invokeMock).toHaveBeenCalledWith('moderate-document-report', {
            body: { reportId: 'report-1', action: 'approve_removal' }
        });
        expect(fromMock).not.toHaveBeenCalled();
    });

    test('does not claim removal succeeded when the function response is incomplete', async () => {
        invokeMock.mockResolvedValue({
            data: { status: 'removing', documentDeleted: false },
            error: null
        });

        await expect(approveAdminDocumentReport('report-1'))
            .rejects.toThrow('O documento não foi removido.');
    });

    test('loads profile identity for user-target reports', async () => {
        limitMock.mockResolvedValue({
            data: [{
                id: 'report-user',
                document_id: null,
                reported_document_id: null,
                reported_user_id: 'target-user',
                reporter_id: 'reporter-1',
                reason: 'harassment',
                details: null,
                status: 'pending',
                created_at: '2026-10-19T12:00:00Z',
                reviewed_at: null,
                reviewed_by: null,
                removal_started_at: null
            }],
            error: null
        });
        profileMock.mockResolvedValue({ username: 'Target profile', avatar_url: null });

        const reports = await listAdminDocumentReports();

        expect(fromMock).toHaveBeenCalledTimes(1);
        expect(profileMock).toHaveBeenCalledWith('target-user');
        expect(reports[0].reportedUser).toEqual({ username: 'Target profile' });
        expect(reports[0].document).toBeNull();
    });

    test('resolves reported-user deletion through the protected admin function', async () => {
        invokeMock.mockResolvedValue({
            data: { status: 'resolved', userDeleted: true },
            error: null
        });

        await expect(resolveAdminUserReport('report-user')).resolves.toEqual({
            reviewerId: 'admin-123',
            userDeleted: true
        });

        expect(invokeMock).toHaveBeenCalledWith('admin-content', {
            body: { reportId: 'report-user', action: 'resolve_reported_user' }
        });
        expect(fromMock).not.toHaveBeenCalled();
    });
});
