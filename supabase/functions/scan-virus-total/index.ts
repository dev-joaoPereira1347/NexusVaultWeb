import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { createClient } from 'npm:@supabase/supabase-js@2';

const DOCUMENT_BUCKET = 'library-documents';
const COVER_BUCKET = 'library-covers';
const QUARANTINE_BUCKET = 'library-quarantine';
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const VIRUSTOTAL_API_URL = 'https://www.virustotal.com/api/v3';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type UploadRequest = {
  id: string;
  uploaded_by: string;
  status: 'pending' | 'processing' | 'scanning' | 'approved' | 'rejected' | 'failed';
  updated_at: string;
  status_message: string | null;
  analysis_id: string | null;
  cover_analysis_id: string | null;
  document_sha256: string | null;
  cover_sha256: string | null;
  target_item_id: string;
  is_update: boolean;
  title: string;
  author: string;
  category: string;
  content_type: string;
  year: number | null;
  genre: string | null;
  language: string | null;
  description: string | null;
  file_name: string;
  file_mime: string;
  file_size: number;
  file_path: string;
  document_quarantine_path: string | null;
  cover_path: string | null;
  cover_quarantine_path: string | null;
};

type VirusTotalStats = {
  malicious: number;
  suspicious: number;
  harmless?: number;
  undetected?: number;
  [key: string]: number | undefined;
};

type PreparedFile = {
  kind: 'document' | 'cover';
  path: string;
  destinationPath: string;
  bucket: string;
  mimeType: string;
  analysisId: string | null;
  sha256: string | null;
};

class ScanError extends Error {
  constructor(message: string, readonly status = 500) {
    super(message);
  }
}

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const virusTotalRequest = async (url: string, apiKey: string, init?: RequestInit) => {
  const response = await fetch(url, {
    ...init,
    headers: { ...init?.headers, 'x-apikey': apiKey },
  });
  if (!response.ok) {
    throw new ScanError(`O VirusTotal respondeu com HTTP ${response.status}.`, 502);
  }
  return await response.json();
};

const getHashReport = async (sha256: string, apiKey: string) => {
  const response = await fetch(`${VIRUSTOTAL_API_URL}/files/${encodeURIComponent(sha256)}`, {
    headers: { 'x-apikey': apiKey },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new ScanError(`O VirusTotal respondeu com HTTP ${response.status}.`, 502);

  const result = await response.json();
  return result.data?.attributes?.last_analysis_stats as VirusTotalStats | undefined;
};

const getVerdict = (stats: VirusTotalStats | undefined): 'clean' | 'malicious' => {
  const totalEngines = stats
    ? Object.values(stats).reduce((total, count) => total + (typeof count === 'number' ? count : 0), 0)
    : 0;
  if (
    !stats ||
    typeof stats.malicious !== 'number' ||
    typeof stats.suspicious !== 'number' ||
    totalEngines === 0
  ) {
    throw new ScanError('O VirusTotal ainda não possui um resultado confiável para este arquivo.', 502);
  }
  return stats.malicious > 0 || stats.suspicious > 0 ? 'malicious' : 'clean';
};

const validateOwnedPath = (path: string | null, userId: string, allowedKind: 'document' | 'cover') => {
  if (!path) return null;
  const match = /^([0-9a-f-]{36})\/([0-9a-f-]{36})\.([a-z]+)$/i.exec(path);
  if (!match || match[1].toLowerCase() !== userId.toLowerCase()) {
    throw new ScanError('Caminho de arquivo inválido.', 400);
  }
  const allowedExtensions = allowedKind === 'document'
    ? new Set(['pdf', 'txt', 'epub', 'md'])
    : new Set(['webp']);
  if (!allowedExtensions.has(match[3].toLowerCase())) {
    throw new ScanError('Formato de arquivo não suportado.', 400);
  }
  return path;
};

const getPreparedFiles = (upload: UploadRequest): PreparedFile[] => {
  const files: PreparedFile[] = [];
  const documentPath = validateOwnedPath(upload.document_quarantine_path, upload.uploaded_by, 'document');
  const coverPath = validateOwnedPath(upload.cover_quarantine_path, upload.uploaded_by, 'cover');

  if (documentPath) {
    if (documentPath !== upload.file_path) {
      throw new ScanError('O caminho do documento em quarentena não corresponde ao destino.', 400);
    }
    files.push({
      kind: 'document',
      path: documentPath,
      destinationPath: upload.file_path,
      bucket: DOCUMENT_BUCKET,
      mimeType: upload.file_mime,
      analysisId: upload.analysis_id,
      sha256: upload.document_sha256,
    });
  }
  if (coverPath) {
    if (coverPath !== upload.cover_path) {
      throw new ScanError('O caminho da capa em quarentena não corresponde ao destino.', 400);
    }
    files.push({
      kind: 'cover',
      path: coverPath,
      destinationPath: coverPath,
      bucket: COVER_BUCKET,
      mimeType: 'image/webp',
      analysisId: upload.cover_analysis_id,
      sha256: upload.cover_sha256,
    });
  }
  if (!files.length) throw new ScanError('A solicitação não contém arquivos para verificar.', 400);
  return files;
};

const getFileHash = async (blob: Blob) => {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const uploadForAnalysis = async (blob: Blob, fileName: string, apiKey: string) => {
  const form = new FormData();
  form.append('file', blob, fileName);
  let uploadUrl = `${VIRUSTOTAL_API_URL}/files`;
  if (blob.size > 32 * 1024 * 1024) {
    const uploadInfo = await virusTotalRequest(`${VIRUSTOTAL_API_URL}/files/upload_url`, apiKey, {
      method: 'GET',
    });
    if (typeof uploadInfo.data !== 'string') {
      throw new ScanError('O VirusTotal não retornou um endereço de envio válido.', 502);
    }
    uploadUrl = uploadInfo.data;
  }
  const result = await virusTotalRequest(uploadUrl, apiKey, { method: 'POST', body: form });
  if (typeof result.data?.id !== 'string') {
    throw new ScanError('O VirusTotal não retornou o identificador da análise.', 502);
  }
  return result.data.id as string;
};

const getAnalysisVerdict = async (analysisId: string, apiKey: string) => {
  const result = await virusTotalRequest(
    `${VIRUSTOTAL_API_URL}/analyses/${encodeURIComponent(analysisId)}`,
    apiKey,
  );
  const attributes = result.data?.attributes;
  if (attributes?.status !== 'completed') return 'pending';
  return getVerdict(attributes.stats as VirusTotalStats | undefined);
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization) return jsonResponse({ error: 'Não autenticado.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const virusTotalApiKey = Deno.env.get('VIRUSTOTAL_API_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !virusTotalApiKey) {
    return jsonResponse({ error: 'A verificação antivírus não está configurada no servidor.' }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return jsonResponse({ error: 'Sessão inválida.' }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  let upload: UploadRequest | null = null;
  let files: PreparedFile[] = [];
  let published: Array<{ bucket: string; path: string }> = [];
  let lockAcquired = false;
  let itemPersisted = false;
  let requestApproved = false;

  const updateUpload = async (values: Record<string, unknown>) => {
    if (!upload) throw new ScanError('Solicitação de envio não encontrada.', 404);
    const { error } = await adminClient
      .from('library_upload_requests')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', upload.id)
      .eq('uploaded_by', user.id);
    if (error) throw new ScanError('Não foi possível atualizar o estado da verificação.', 500);
    Object.assign(upload, values);
  };

  const removeQuarantine = async () => {
    if (!upload) return;
    const paths = [upload.document_quarantine_path, upload.cover_quarantine_path].filter(
      (path): path is string => typeof path === 'string',
    );
    if (!paths.length) return;
    const { error } = await adminClient.storage.from(QUARANTINE_BUCKET).remove(paths);
    if (error) throw new ScanError('Não foi possível limpar os arquivos da quarentena.', 500);
  };

  const recordFailure = async (message: string, status: UploadRequest['status']) => {
    await removeQuarantine();
    await updateUpload({ status, status_message: message });
  };

  try {
    const body = await request.json();
    if (
      typeof body.requestId !== 'string' ||
      (body.action !== 'start' && body.action !== 'check')
    ) {
      throw new ScanError('Solicitação de verificação inválida.', 400);
    }

    const { data, error } = await adminClient
      .from('library_upload_requests')
      .select('*')
      .eq('id', body.requestId)
      .eq('uploaded_by', user.id)
      .maybeSingle();
    if (error) throw new ScanError('Não foi possível carregar a solicitação de envio.', 500);
    if (!data) throw new ScanError('Solicitação de envio não encontrada.', 404);
    upload = data as UploadRequest;
    if (upload.status === 'approved' || upload.status === 'rejected' || upload.status === 'failed') {
      return jsonResponse({ status: upload.status, message: upload.status_message });
    }

    const { data: currentItem, error: itemError } = await adminClient
      .from('library_items')
      .select('id, uploaded_by, file_path, file_name, file_mime, file_size, cover_path')
      .eq('id', upload.target_item_id)
      .maybeSingle();
    if (itemError) throw new ScanError('Não foi possível validar o documento de destino.', 500);
    if (upload.is_update && currentItem?.uploaded_by !== user.id) {
      throw new ScanError('Documento de destino não encontrado ou sem permissão.', 404);
    }
    if (!upload.is_update && currentItem && currentItem.uploaded_by !== user.id) {
      throw new ScanError('Identificador de documento já utilizado.', 409);
    }
    if (!upload.is_update && !upload.document_quarantine_path) {
      throw new ScanError('O envio precisa conter um documento para publicação.', 400);
    }
    if (upload.is_update && currentItem) {
      if (
        (!upload.document_quarantine_path && (
          upload.file_path !== currentItem.file_path ||
          upload.file_name !== currentItem.file_name ||
          upload.file_mime !== currentItem.file_mime ||
          upload.file_size !== currentItem.file_size
        )) ||
        (!upload.cover_quarantine_path && upload.cover_path !== null && upload.cover_path !== currentItem.cover_path)
      ) {
        throw new ScanError('A solicitação tenta alterar um arquivo sem passar pela quarentena.', 400);
      }
    }

    files = getPreparedFiles(upload);
    const staleLockTime = new Date(Date.now() - 120_000).toISOString();
    if (upload.status === 'processing' && Date.parse(upload.updated_at) > Date.now() - 120_000) {
      return jsonResponse({ status: 'processing', message: upload.status_message });
    }
    let lockQuery = adminClient
      .from('library_upload_requests')
      .update({ status: 'processing', status_message: null, updated_at: new Date().toISOString() })
      .eq('id', upload.id)
      .eq('uploaded_by', user.id);
    lockQuery = upload.status === 'processing'
      ? lockQuery.eq('status', 'processing').lt('updated_at', staleLockTime)
      : lockQuery.in('status', ['pending', 'scanning']);
    const { data: lockedRequest, error: lockError } = await lockQuery.select('id').maybeSingle();
    if (lockError) throw new ScanError('Não foi possível iniciar a verificação.', 500);
    if (!lockedRequest) {
      return jsonResponse({ status: upload.status, message: upload.status_message });
    }
    lockAcquired = true;
    upload.status = 'processing';

    let rejected = false;
    let stillScanning = false;
    for (const file of files) {
      const { data: blob, error: downloadError } = await adminClient.storage
        .from(QUARANTINE_BUCKET)
        .download(file.path);
      if (downloadError || !blob) throw new ScanError('Não foi possível recuperar o arquivo em quarentena.', 400);
      if (blob.size > MAX_FILE_SIZE_BYTES) throw new ScanError('O arquivo excede o limite de 50MB.', 413);

      if (body.action === 'start' || !file.sha256) {
        file.sha256 = await getFileHash(blob);
        const report = await getHashReport(file.sha256, virusTotalApiKey);
        if (report) {
          if (getVerdict(report) === 'malicious') {
            rejected = true;
            break;
          }
          file.analysisId = null;
        } else {
          file.analysisId = await uploadForAnalysis(blob, file.path.split('/').at(-1)!, virusTotalApiKey);
          stillScanning = true;
        }
      } else if (file.analysisId) {
        const verdict = await getAnalysisVerdict(file.analysisId, virusTotalApiKey);
        if (verdict === 'malicious') {
          rejected = true;
          break;
        }
        if (verdict === 'pending') stillScanning = true;
        else file.analysisId = null;
      }
    }

    if (rejected) {
      await recordFailure('Arquivo rejeitado: o VirusTotal detectou conteúdo malicioso ou suspeito.', 'rejected');
      return jsonResponse({ status: 'rejected', message: upload.status_message });
    }

    await updateUpload({
      status: stillScanning ? 'scanning' : 'processing',
      status_message: stillScanning ? 'A análise está em andamento no VirusTotal.' : null,
      analysis_id: files.find(({ kind }) => kind === 'document')?.analysisId ?? null,
      cover_analysis_id: files.find(({ kind }) => kind === 'cover')?.analysisId ?? null,
      document_sha256: files.find(({ kind }) => kind === 'document')?.sha256 ?? upload.document_sha256,
      cover_sha256: files.find(({ kind }) => kind === 'cover')?.sha256 ?? upload.cover_sha256,
    });
    if (stillScanning) return jsonResponse({ status: 'scanning', message: upload.status_message });

    for (const file of files) {
      const { data: blob, error: downloadError } = await adminClient.storage
        .from(QUARANTINE_BUCKET)
        .download(file.path);
      if (downloadError || !blob) throw new ScanError('Não foi possível recuperar o arquivo aprovado.', 400);
      const { error: publishError } = await adminClient.storage.from(file.bucket).upload(
        file.destinationPath,
        blob,
        { contentType: file.mimeType, upsert: true },
      );
      if (publishError) throw new ScanError('Não foi possível publicar o arquivo aprovado.', 500);
      published.push({ bucket: file.bucket, path: file.destinationPath });
    }

    const { data: previousItem } = await adminClient
      .from('library_items')
      .select('file_path, cover_path')
      .eq('id', upload.target_item_id)
      .maybeSingle();
    const libraryItem = {
      id: upload.target_item_id,
      uploaded_by: upload.uploaded_by,
      title: upload.title,
      author: upload.author,
      category: upload.category,
      content_type: upload.content_type,
      year: upload.year,
      genre: upload.genre,
      language: upload.language,
      description: upload.description,
      file_path: upload.file_path,
      file_name: upload.file_name,
      file_mime: upload.file_mime,
      file_size: upload.file_size,
      cover_path: upload.cover_path,
      updated_at: new Date().toISOString(),
    };
    const { error: saveError } = await adminClient.from('library_items').upsert(libraryItem);
    if (saveError) throw new ScanError('Não foi possível registrar o documento aprovado.', 500);
    itemPersisted = true;

    const { error: approvalError } = await adminClient
      .from('library_upload_requests')
      .update({
        status: 'approved',
        status_message: 'Verificação concluída. O documento foi publicado no acervo.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', upload.id)
      .eq('uploaded_by', user.id);
    if (approvalError) throw new ScanError('Não foi possível confirmar a aprovação do documento.', 500);
    requestApproved = true;
    upload.status = 'approved';
    await removeQuarantine();

    const obsoleteFiles = [
      ...(previousItem?.file_path && previousItem.file_path !== upload.file_path
        ? [{ bucket: DOCUMENT_BUCKET, path: previousItem.file_path }]
        : []),
      ...(previousItem?.cover_path && previousItem.cover_path !== upload.cover_path
        ? [{ bucket: COVER_BUCKET, path: previousItem.cover_path }]
        : []),
    ];
    await Promise.all(obsoleteFiles.map(({ bucket, path }) => adminClient.storage.from(bucket).remove([path])));
    return jsonResponse({ status: 'approved', message: 'Verificação concluída. O documento foi publicado no acervo.' });
  } catch (error) {
    let message = error instanceof ScanError
      ? error.message
      : 'Falha inesperada durante a verificação antivírus.';
    const failedPermanently = error instanceof ScanError && error.status < 500;
    if (
      upload &&
      (lockAcquired || failedPermanently) &&
      !requestApproved &&
      upload.status !== 'rejected' &&
      upload.status !== 'approved'
    ) {
      try {
        if (failedPermanently) await removeQuarantine();
        await updateUpload({
          status: failedPermanently ? 'failed' : 'scanning',
          status_message: message,
        });
      } catch (updateError) {
        message = `${message} Não foi possível persistir o estado final da solicitação.`;
        console.error('Failed to persist VirusTotal scan status', updateError);
      }
    }
    if (published.length && !itemPersisted) {
      const results = await Promise.all(published.map(({ bucket, path }) =>
        adminClient.storage.from(bucket).remove([path])));
      if (results.some(({ error: cleanupError }) => cleanupError)) {
        console.error('Failed to clean up partially published files after VirusTotal error');
      }
    }
    return jsonResponse({
      status: upload?.status ?? 'failed',
      error: message,
    }, error instanceof ScanError ? error.status : 500);
  }
});
