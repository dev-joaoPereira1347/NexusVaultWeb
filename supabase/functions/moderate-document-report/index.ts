import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

Deno.serve(async (request: Request) => {
    if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (request.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405);

    const authorization = request.headers.get('Authorization');
    if (!authorization) return jsonResponse({ error: 'Não autenticado.' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
        console.error('Supabase moderation function environment is incomplete.');
        return jsonResponse({ error: 'A moderação não está configurada corretamente.' }, 500);
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ error: 'Solicitação inválida.' }, 400);
    }

    if (!isRecord(body) || body.action !== 'approve_removal' || typeof body.reportId !== 'string'
        || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.reportId)) {
        return jsonResponse({ error: 'A denúncia ou a decisão informada é inválida.' }, 400);
    }
    const reportId = body.reportId;

    const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authorization } },
        auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return jsonResponse({ error: 'Sessão inválida.' }, 401);
    if (user.app_metadata.role !== 'admin') return jsonResponse({ error: 'Acesso restrito à equipe administrativa.' }, 403);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: report, error: reportError } = await adminClient
        .from('document_reports')
        .select('id, document_id, status, removal_started_at, reviewed_at, reviewed_by')
        .eq('id', reportId)
        .maybeSingle();

    if (reportError) {
        console.error('Failed to load document report for moderation', reportError);
        return jsonResponse({ error: 'Não foi possível carregar a denúncia.' }, 500);
    }
    if (!report) return jsonResponse({ error: 'A denúncia não foi encontrada.' }, 404);
    if (report.status !== 'pending' && report.status !== 'reviewing' && report.status !== 'removing') {
        return jsonResponse({ error: 'Esta denúncia já foi analisada.' }, 409);
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
        .select('id, document_id')
        .maybeSingle();
    if (claimError) {
        console.error('Failed to claim document report for removal', claimError);
        return jsonResponse({ error: 'Não foi possível iniciar a remoção. Tente novamente.' }, 500);
    }
    if (!claimedReport) {
        return jsonResponse({
            error: report.status === 'removing'
                ? 'A remoção desta denúncia já está em andamento.'
                : 'Esta denúncia foi alterada por outra pessoa. Atualize a fila.'
        }, 409);
    }

    const restoreReport = async () => {
        const { error } = await adminClient
            .from('document_reports')
            .update({
                status: previousStatus,
                removal_started_at: null,
                reviewed_at: report.reviewed_at,
                reviewed_by: report.reviewed_by
            })
            .eq('id', report.id)
            .eq('status', 'removing');
        if (error) {
            console.error('Failed to restore report status after removal failure', error);
            return false;
        }
        return true;
    };

    const removalFailure = async (message: string, status: number) => {
        const restored = await restoreReport();
        return jsonResponse({
            error: restored
                ? message
                : `${message} A denúncia ficou marcada como remoção em andamento; tente novamente após dois minutos.`
        }, status);
    };

    let documentDeleted = false;
    if (claimedReport.document_id) {
        const { data: document, error: documentError } = await adminClient
            .from('library_items')
            .select('id, file_path, cover_path')
            .eq('id', claimedReport.document_id)
            .maybeSingle();

        if (documentError) {
            console.error('Failed to load reported document for removal', documentError);
            return await removalFailure('Não foi possível carregar o documento denunciado.', 500);
        }

        if (document) {
            const removals = await Promise.allSettled([
                adminClient.storage.from('library-documents').remove([document.file_path]),
                ...(document.cover_path
                    ? [adminClient.storage.from('library-covers').remove([document.cover_path])]
                    : [])
            ]);
            const removalErrors = removals.flatMap((result) => {
                if (result.status === 'rejected') {
                    return [result.reason instanceof Error ? result.reason.message : 'Falha inesperada ao remover um arquivo.'];
                }
                return result.value.error ? [result.value.error.message] : [];
            });
            if (removalErrors.length) {
                console.error('Failed to remove one or more files during document moderation', removalErrors);
                return await removalFailure(
                    `Não foi possível remover todos os arquivos do documento. Tente novamente. ${removalErrors.join('; ')}`,
                    502
                );
            }

            const { data: deletedDocument, error: deleteError } = await adminClient
                .from('library_items')
                .delete()
                .eq('id', document.id)
                .select('id')
                .maybeSingle();

            if (deleteError) {
                console.error('Failed to delete moderated document metadata', deleteError);
                return await removalFailure(
                    'Os arquivos foram removidos, mas não foi possível concluir a remoção do documento. Tente novamente.',
                    500
                );
            }
            if (!deletedDocument) {
                return await removalFailure('O documento mudou durante a análise. Atualize a fila e tente novamente.', 409);
            }
            documentDeleted = true;
        }
    }

    const { data: decisionData, error: decisionError } = await adminClient
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

    if (decisionError || !decisionData) {
        console.error('Failed to record approved document removal', decisionError);
        return jsonResponse({ error: 'O documento foi removido, mas não foi possível registrar a decisão. Atualize a fila para sincronizar o histórico.' }, 500);
    }

    return jsonResponse({ status: 'resolved', documentDeleted });
});
