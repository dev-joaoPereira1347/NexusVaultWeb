import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === 'string' && error.trim()) return error;
    if (isRecord(error)) {
        const message = [error.message, error.error_description, error.details, error.hint]
            .find((value): value is string => typeof value === 'string' && value.trim().length > 0);
        if (message) return message;
        if (typeof error.code === 'string' && error.code) {
            return `Erro do serviço administrativo (${error.code}).`;
        }
        try {
            const serialized = JSON.stringify(error);
            if (serialized && serialized !== '{}') return serialized;
        } catch {
            return 'O serviço administrativo retornou um erro não serializável.';
        }
    }
    return 'O serviço administrativo retornou um erro sem detalhes.';
};

const isUuid = (value: unknown): value is string =>
    typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const getPage = (value: unknown): number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 100_000
        ? value
        : 1;

const removeStoragePaths = async (
    adminClient: ReturnType<typeof createClient>,
    bucket: string,
    paths: Array<string | null | undefined>
) => {
    const uniquePaths = [...new Set(paths.filter((path): path is string => Boolean(path)))];
    for (let offset = 0; offset < uniquePaths.length; offset += 100) {
        const { error } = await adminClient.storage.from(bucket).remove(uniquePaths.slice(offset, offset + 100));
        if (error) {
            console.error(`Failed to remove objects from ${bucket}`, error);
            throw new Error(`Não foi possível remover todos os arquivos do bucket ${bucket}.`);
        }
    }
};

const assertOwnedStoragePaths = (paths: Array<string | null | undefined>, userId: string) => {
    for (const path of paths) {
        if (path && (!path.startsWith(`${userId}/`) || path.includes('..'))) {
            throw new Error('Os metadados contêm um caminho de arquivo inválido; nenhum arquivo foi removido.');
        }
    }
};

const getStorageFolderPaths = async (
    adminClient: ReturnType<typeof createClient>,
    bucket: string,
    folder: string
) => {
    const pageSize = 1000;
    const paths: string[] = [];
    for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await adminClient.storage.from(bucket).list(folder, {
            limit: pageSize,
            offset
        });
        if (error) throw error;
        paths.push(...(data ?? [])
            .filter((entry) => entry.id)
            .map((entry) => `${folder}/${entry.name}`));
        if (!data || data.length < pageSize) return paths;
    }
};

const getUserLibraryItems = async (
    adminClient: ReturnType<typeof createClient>,
    userId: string
) => {
    const pageSize = 1000;
    const items: Array<{ id: string; file_path: string; cover_path: string | null }> = [];
    for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await adminClient
            .from('library_items')
            .select('id, file_path, cover_path')
            .eq('uploaded_by', userId)
            .order('id')
            .range(offset, offset + pageSize - 1);
        if (error) throw error;
        items.push(...(data ?? []));
        if (!data || data.length < pageSize) return items;
    }
};

const getUserUploadRequests = async (
    adminClient: ReturnType<typeof createClient>,
    userId: string
) => {
    const pageSize = 1000;
    const requests: Array<{ document_quarantine_path: string | null; cover_quarantine_path: string | null }> = [];
    for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await adminClient
            .from('library_upload_requests')
            .select('document_quarantine_path, cover_quarantine_path')
            .eq('uploaded_by', userId)
            .order('id')
            .range(offset, offset + pageSize - 1);
        if (error) {
            if (error.code === '42P01' || error.code === 'PGRST205') return requests;
            throw error;
        }
        requests.push(...(data ?? []));
        if (!data || data.length < pageSize) return requests;
    }
};

const getUsersPage = async (adminClient: ReturnType<typeof createClient>, page: number) => {
    const perPage = 50;
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data.users.map((user) => ({
        id: user.id,
        email: user.email ?? null,
        name: typeof user.user_metadata.full_name === 'string'
            ? user.user_metadata.full_name
            : typeof user.user_metadata.username === 'string'
                ? user.user_metadata.username
                : null,
        isAdmin: user.app_metadata.role === 'admin'
    }));
    return { users, hasMore: users.length === perPage };
};

const removeUserData = async (
    adminClient: ReturnType<typeof createClient>,
    userId: string
) => {
    const [documents, uploadRequests] = await Promise.all([
        getUserLibraryItems(adminClient, userId),
        getUserUploadRequests(adminClient, userId)
    ]);
    assertOwnedStoragePaths(
        documents.flatMap((document) => [document.file_path, document.cover_path]),
        userId
    );
    assertOwnedStoragePaths(
        uploadRequests.flatMap((upload) => [
            upload.document_quarantine_path,
            upload.cover_quarantine_path
        ]),
        userId
    );
    await removeStoragePaths(adminClient, 'library-documents', documents.map((document) => document.file_path));
    await removeStoragePaths(adminClient, 'library-covers', documents.map((document) => document.cover_path));
    await removeStoragePaths(
        adminClient,
        'library-quarantine',
        uploadRequests.flatMap((upload) => [
            upload.document_quarantine_path,
            upload.cover_quarantine_path
        ])
    );
    const avatarPaths = await getStorageFolderPaths(adminClient, 'avatars', userId);
    await removeStoragePaths(adminClient, 'avatars', avatarPaths);
    return documents.length;
};

Deno.serve(async (request: Request) => {
    if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (request.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405);

    const authorization = request.headers.get('Authorization');
    if (!authorization) return jsonResponse({ error: 'Não autenticado.' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
        console.error('Admin content function environment is incomplete.');
        return jsonResponse({ error: 'A gestão administrativa não está configurada corretamente.' }, 500);
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ error: 'Solicitação inválida.' }, 400);
    }
    if (!isRecord(body) || typeof body.action !== 'string') {
        return jsonResponse({ error: 'Ação inválida.' }, 400);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authorization } },
        auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return jsonResponse({ error: 'Sessão inválida.' }, 401);
    if (user.app_metadata.role !== 'admin') {
        return jsonResponse({ error: 'Acesso restrito à equipe administrativa.' }, 403);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        if (body.action === 'list_users') {
            return jsonResponse(await getUsersPage(adminClient, getPage(body.page)));
        }

        if (body.action === 'list_documents') {
            if (body.contentType !== 'livro' && body.contentType !== 'documento') {
                return jsonResponse({ error: 'Selecione uma categoria de conteúdo válida.' }, 400);
            }
            const page = getPage(body.page);
            const perPage = 50;
            const from = (page - 1) * perPage;
            const { data, error, count } = await adminClient
                .from('library_items')
                .select('id, title, author, uploaded_by, created_at', { count: 'exact' })
                .eq('content_type', body.contentType)
                .order('created_at', { ascending: false })
                .range(from, from + perPage - 1);
            if (error) throw error;
            if (count === null) throw new Error('O banco não retornou a contagem de documentos.');
            return jsonResponse({
                documents: data ?? [],
                hasMore: from + (data?.length ?? 0) < count
            });
        }

        if (body.action === 'delete_document') {
            if (!isUuid(body.documentId)) return jsonResponse({ error: 'Documento inválido.' }, 400);
            if (body.contentType !== 'livro' && body.contentType !== 'documento') {
                return jsonResponse({ error: 'Selecione uma categoria de conteúdo válida.' }, 400);
            }

            const { data: document, error: documentError } = await adminClient
                .from('library_items')
                .select('id, file_path, cover_path, uploaded_by')
                .eq('id', body.documentId)
                .eq('content_type', body.contentType)
                .maybeSingle();
            if (documentError) throw documentError;
            if (!document) return jsonResponse({ error: 'Documento não encontrado.' }, 404);

            assertOwnedStoragePaths([document.file_path, document.cover_path], document.uploaded_by);

            await removeStoragePaths(adminClient, 'library-documents', [document.file_path]);
            await removeStoragePaths(adminClient, 'library-covers', [document.cover_path]);

            const { data: deleted, error: deleteError } = await adminClient
                .from('library_items')
                .delete()
                .eq('id', document.id)
                .select('id')
                .maybeSingle();
            if (deleteError) throw deleteError;
            if (!deleted) return jsonResponse({ error: 'O documento mudou durante a operação. Atualize a lista.' }, 409);

            return jsonResponse({ success: true });
        }

        if (body.action === 'delete_user') {
            if (!isUuid(body.userId)) return jsonResponse({ error: 'Usuário inválido.' }, 400);
            if (body.userId === user.id) {
                return jsonResponse({ error: 'Não é permitido excluir a própria conta pelo painel.' }, 403);
            }

            const { data: targetResult, error: targetError } = await adminClient.auth.admin.getUserById(body.userId);
            if (targetError) throw targetError;
            const targetUser = targetResult.user;
            if (!targetUser) return jsonResponse({ error: 'Usuário não encontrado.' }, 404);
            if (targetUser.app_metadata.role === 'admin') {
                return jsonResponse({ error: 'Contas administrativas não podem ser excluídas por este painel.' }, 403);
            }

            const removedDocuments = await removeUserData(adminClient, targetUser.id);

            const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(targetUser.id);
            if (deleteUserError) throw deleteUserError;
            return jsonResponse({ success: true, removedDocuments });
        }

        if (body.action === 'resolve_reported_user') {
            if (!isUuid(body.reportId)) return jsonResponse({ error: 'Denúncia inválida.' }, 400);
            const { data: report, error: reportError } = await adminClient
                .from('document_reports')
                .select('id, reported_user_id, status, removal_started_at')
                .eq('id', body.reportId)
                .maybeSingle();
            if (reportError) throw reportError;
            if (!report || !report.reported_user_id) {
                return jsonResponse({ error: 'A denúncia de usuário não foi encontrada.' }, 404);
            }
            if (report.status !== 'pending' && report.status !== 'reviewing' && report.status !== 'removing') {
                return jsonResponse({ error: 'Esta denúncia já foi analisada.' }, 409);
            }
            if (report.reported_user_id === user.id) {
                return jsonResponse({ error: 'Não é permitido remover sua própria conta pelo painel.' }, 403);
            }

            const previousStatus = report.status === 'pending' ? 'pending' : 'reviewing';
            const staleRemovalTime = new Date(Date.now() - 120_000).toISOString();
            let claimQuery = adminClient
                .from('document_reports')
                .update({ status: 'removing', removal_started_at: new Date().toISOString() })
                .eq('id', report.id);
            claimQuery = report.status === 'removing'
                ? claimQuery.eq('status', 'removing').lt('removal_started_at', staleRemovalTime)
                : claimQuery.in('status', ['pending', 'reviewing']);
            const { data: claimedReport, error: claimError } = await claimQuery
                .select('id')
                .maybeSingle();
            if (claimError) throw claimError;
            if (!claimedReport) return jsonResponse({ error: 'Esta denúncia já está sendo processada. Atualize a fila.' }, 409);

            const restoreReport = async () => {
                const { error } = await adminClient
                    .from('document_reports')
                    .update({ status: previousStatus, removal_started_at: null })
                    .eq('id', report.id)
                    .eq('status', 'removing');
                if (error) console.error('Failed to restore user report after deletion failure', error);
            };

            const { data: targetResult, error: targetError } = await adminClient.auth.admin.getUserById(report.reported_user_id);
            const targetWasAlreadyDeleted = targetError?.status === 404 || targetError?.code === 'user_not_found';
            if (targetError && !targetWasAlreadyDeleted) {
                await restoreReport();
                throw targetError;
            }
            if (!targetWasAlreadyDeleted && targetResult.user?.app_metadata.role === 'admin') {
                await restoreReport();
                return jsonResponse({ error: 'Contas administrativas não podem ser removidas por uma denúncia.' }, 403);
            }

            if (targetResult?.user) {
                try {
                    await removeUserData(adminClient, targetResult.user.id);
                    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(targetResult.user.id);
                    if (deleteUserError) throw deleteUserError;
                } catch (error) {
                    await restoreReport();
                    throw error;
                }
            }

            const { data: decision, error: decisionError } = await adminClient
                .from('document_reports')
                .update({
                    status: 'resolved',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: user.id,
                    removal_started_at: null
                })
                .eq('id', report.id)
                .eq('status', 'removing')
                .select('id')
                .maybeSingle();
            if (decisionError || !decision) {
                console.error('Failed to record user report resolution', decisionError);
                return jsonResponse({ error: 'A conta foi removida, mas não foi possível registrar a decisão. Atualize a fila.' }, 500);
            }
            return jsonResponse({ status: 'resolved', userDeleted: Boolean(targetResult?.user) });
        }

        return jsonResponse({ error: 'Ação desconhecida.' }, 400);
    } catch (error) {
        console.error('Admin content operation failed', error);
        return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
});
