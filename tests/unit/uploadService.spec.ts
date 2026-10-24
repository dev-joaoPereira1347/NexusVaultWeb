import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { UploadForm } from '@/types/upload';

const uploadMock = vi.fn();
const signedUploadMock = vi.fn();
const removeMock = vi.fn();
const insertMock = vi.fn();
const selectMock = vi.fn();
const singleMock = vi.fn();
const getCurrentUserMock = vi.fn();
const convertImageToWebpMock = vi.fn();
const scanVirusTotalMock = vi.fn();

vi.mock('@/services/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        createSignedUploadUrl: signedUploadMock,
        remove: removeMock,
      })),
    },
    functions: {
      invoke: scanVirusTotalMock,
    },
    from: vi.fn(() => ({
      insert: insertMock,
    })),
  },
}));

vi.mock('@/services/authService', () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock('@/utils/convertImageToWebp', () => ({
  convertImageToWebp: convertImageToWebpMock,
}));

const { uploadLibraryItem } = await import('@/services/uploadService');

const baseForm: UploadForm = {
  title: 'Livro de Teste',
  author: 'Autor de Teste',
  category: 'literatura',
  year: '2024',
  type: 'livro',
  genre: 'Ficção',
  language: 'pt',
  description: 'Descrição de teste',
  cover: null,
  rightsDeclarationAccepted: true,
};

describe('uploadLibraryItem', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    getCurrentUserMock.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    scanVirusTotalMock.mockResolvedValue({ data: { success: true }, error: null });
    uploadMock.mockResolvedValue({ error: null });
    signedUploadMock.mockResolvedValue({
      data: { signedUrl: 'https://storage.example/upload?token=temporary-token' },
      error: null,
    });
    removeMock.mockResolvedValue({ error: null });
    insertMock.mockReturnValue({ select: selectMock });
    selectMock.mockReturnValue({ single: singleMock });
    singleMock.mockResolvedValue({
      data: {
        id: 'request-123',
        target_item_id: 'item-123',
        title: 'Livro de Teste',
        year: 2024,
        rights_declaration_accepted: true,
        rights_declaration_accepted_at: expect.any(String),
        file_name: 'document.pdf',
        status: 'pending',
        status_message: null,
        created_at: '2026-10-14T12:00:00Z',
        updated_at: '2026-10-14T12:00:00Z',
      },
      error: null,
    });
  });

  test('stores a document in quarantine and starts asynchronous scanning', async () => {
    const file = new File(['conteúdo'], 'document.pdf', { type: 'application/pdf' });

    const result = await uploadLibraryItem(file, baseForm);

    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(uploadMock.mock.calls[0][0]).toMatch(/^user-123\/.+\.pdf$/);
    expect(uploadMock.mock.calls[0][1]).toBe(file);
    expect(uploadMock.mock.calls[0][2]).toEqual(expect.objectContaining({
      contentType: 'application/pdf',
      upsert: false,
    }));
    expect(scanVirusTotalMock).toHaveBeenCalledWith('scan-virus-total', {
      body: { action: 'start', requestId: insertMock.mock.calls[0][0].id },
    });
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      uploaded_by: 'user-123',
      status: 'pending',
      target_item_id: expect.any(String),
      title: 'Livro de Teste',
      file_name: 'document.pdf',
      document_quarantine_path: uploadMock.mock.calls[0][0],
      file_path: uploadMock.mock.calls[0][0],
    }));
    expect(result.id).toBe('request-123');
    expect(result.status).toBe('pending');
  });

  test('reports real transfer progress when requested', async () => {
    class MockXMLHttpRequest extends EventTarget {
      upload = new EventTarget();
      status = 201;
      open = vi.fn();
      setRequestHeader = vi.fn();

      send = (file: File) => {
        const midpoint = Math.floor(file.size / 2);
        this.upload.dispatchEvent(new ProgressEvent('progress', {
          lengthComputable: true,
          loaded: midpoint,
          total: file.size,
        }));
        this.upload.dispatchEvent(new ProgressEvent('progress', {
          lengthComputable: true,
          loaded: file.size,
          total: file.size,
        }));
        this.dispatchEvent(new Event('load'));
      };
    }

    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest);
    const file = new File(['conteúdo'], 'document.pdf', { type: 'application/pdf' });
    const progress: number[] = [];

    await uploadLibraryItem(file, baseForm, (percentage) => progress.push(percentage));

    expect(signedUploadMock).toHaveBeenCalledOnce();
    expect(uploadMock).not.toHaveBeenCalled();
    expect(progress.some((percentage) => percentage > 0 && percentage < 100)).toBe(true);
    expect(progress.at(-1)).toBe(100);
  });

  test('keeps the queued upload when starting the background scan fails', async () => {
    const file = new File(['conteúdo'], 'document.pdf', { type: 'application/pdf' });
    scanVirusTotalMock.mockResolvedValue({
      data: null,
      error: new Error('Arquivo bloqueado: o VirusTotal detectou conteúdo malicioso ou suspeito.'),
    });

    const result = await uploadLibraryItem(file, baseForm);

    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(result.status_message).toContain('O envio foi salvo');
    expect(removeMock).not.toHaveBeenCalled();
  });

  test('requires an authenticated user', async () => {
    getCurrentUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const file = new File(['conteúdo'], 'document.pdf', { type: 'application/pdf' });

    await expect(uploadLibraryItem(file, baseForm)).rejects.toThrow(
      'É necessário estar autenticado para enviar conteúdo.',
    );
    expect(uploadMock).not.toHaveBeenCalled();
  });

  test('requires the rights declaration before uploading any file', async () => {
    const file = new File(['conteúdo'], 'document.pdf', { type: 'application/pdf' });

    await expect(uploadLibraryItem(file, {
      ...baseForm,
      rightsDeclarationAccepted: false,
    })).rejects.toThrow('Confirme a declaração de direitos autorais');

    expect(uploadMock).not.toHaveBeenCalled();
    expect(getCurrentUserMock).not.toHaveBeenCalled();
  });

  test('requires a valid publication year before uploading any file', async () => {
    const file = new File(['conteúdo'], 'document.pdf', { type: 'application/pdf' });

    await expect(uploadLibraryItem(file, {
      ...baseForm,
      year: '',
    })).rejects.toThrow('Informe um ano válido');

    expect(uploadMock).not.toHaveBeenCalled();
    expect(getCurrentUserMock).not.toHaveBeenCalled();
  });

  test('removes the document when the database insert fails', async () => {
    const file = new File(['conteúdo'], 'document.pdf', { type: 'application/pdf' });
    singleMock.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    await expect(uploadLibraryItem(file, baseForm)).rejects.toMatchObject({
      message: 'Database error',
    });
    expect(removeMock).toHaveBeenCalledTimes(1);
    expect(removeMock.mock.calls[0][0]).toEqual([
      expect.stringMatching(/^user-123\/.+\.pdf$/),
    ]);
  });
});
