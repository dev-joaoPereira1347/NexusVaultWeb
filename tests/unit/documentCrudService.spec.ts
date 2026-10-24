import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { UploadForm } from '@/types/upload';

const { chain, fromMock, removeMock, uploadMock } = vi.hoisted(() => {
  const queryChain = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  queryChain.select.mockReturnValue(queryChain);
  queryChain.eq.mockReturnValue(queryChain);
  queryChain.update.mockReturnValue(queryChain);
  queryChain.delete.mockReturnValue(queryChain);

  return {
    chain: queryChain,
    fromMock: vi.fn(() => queryChain),
    removeMock: vi.fn(),
    uploadMock: vi.fn(),
  };
});

vi.mock('@/services/supabase', () => ({
  supabase: {
    from: fromMock,
    storage: {
      from: vi.fn(() => ({ upload: uploadMock, remove: removeMock })),
    },
  },
}));

const { deleteMyLibraryItem, updateMyLibraryItem } = await import('@/services/uploadService');

const form: UploadForm = {
  title: 'Título atualizado',
  author: 'Autora',
  category: 'literatura',
  year: '2025',
  type: 'livro',
  genre: 'Romance',
  language: 'pt',
  description: 'Descrição atualizada',
  cover: null,
  rightsDeclarationAccepted: false,
};

describe('document owner CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.update.mockReturnValue(chain);
    chain.delete.mockReturnValue(chain);
    removeMock.mockResolvedValue({ error: null });
    uploadMock.mockResolvedValue({ error: null });
  });

  test('updates only an item belonging to the supplied owner', async () => {
    chain.maybeSingle
      .mockResolvedValueOnce({
        data: { file_path: 'owner-123/original.pdf', cover_path: null },
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: 'item-123' }, error: null });

    const cleanupErrors = await updateMyLibraryItem('owner-123', 'item-123', form, null, false);

    expect(cleanupErrors).toEqual([]);
    expect(fromMock).toHaveBeenCalledWith('library_items');
    expect(chain.eq).toHaveBeenNthCalledWith(1, 'id', 'item-123');
    expect(chain.eq).toHaveBeenNthCalledWith(2, 'uploaded_by', 'owner-123');
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Título atualizado',
      author: 'Autora',
      file_path: 'owner-123/original.pdf',
      year: 2025,
    }));
    expect(removeMock).not.toHaveBeenCalled();
  });

  test('deletes only an item belonging to the supplied owner and removes its stored files', async () => {
    chain.maybeSingle.mockResolvedValue({
      data: { file_path: 'owner-123/document.pdf', cover_path: 'owner-123/cover.webp' },
      error: null,
    });

    const cleanupErrors = await deleteMyLibraryItem('owner-123', 'item-123');

    expect(cleanupErrors).toEqual([]);
    expect(chain.delete).toHaveBeenCalledOnce();
    expect(chain.eq).toHaveBeenNthCalledWith(1, 'id', 'item-123');
    expect(chain.eq).toHaveBeenNthCalledWith(2, 'uploaded_by', 'owner-123');
    expect(removeMock).toHaveBeenCalledTimes(2);
    expect(removeMock).toHaveBeenCalledWith(['owner-123/document.pdf']);
    expect(removeMock).toHaveBeenCalledWith(['owner-123/cover.webp']);
  });

  test('replaces the document file and removes the previous file and cover', async () => {
    chain.maybeSingle
      .mockResolvedValueOnce({
        data: { file_path: 'owner-123/original.pdf', cover_path: 'owner-123/cover.webp' },
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: 'item-123' }, error: null });
    const replacement = new File(['novo conteúdo'], 'new-document.txt', { type: 'text/plain' });

    const cleanupErrors = await updateMyLibraryItem('owner-123', 'item-123', form, replacement, true);

    expect(cleanupErrors).toEqual([]);
    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringMatching(/^owner-123\/.+\.txt$/),
      replacement,
      expect.objectContaining({ contentType: 'text/plain' }),
    );
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
      file_name: 'new-document.txt',
      file_mime: 'text/plain',
      file_size: replacement.size,
      cover_path: null,
    }));
    expect(removeMock).toHaveBeenCalledWith(['owner-123/original.pdf']);
    expect(removeMock).toHaveBeenCalledWith(['owner-123/cover.webp']);
  });

  test('does not remove files when the item is not owned by the user', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(deleteMyLibraryItem('another-user', 'item-123')).rejects.toThrow(
      'Documento não encontrado ou você não tem permissão para excluí-lo.',
    );

    expect(removeMock).not.toHaveBeenCalled();
  });
});
