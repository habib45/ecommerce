import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useStorageItems,
  useStorageActions,
  isImage,
  formatBytes,
  buildPath,
  getPublicUrl,
  MEDIA_BUCKET,
} from '../useMediaLibrary';

const getSupabaseMock = async () => {
  const { supabase } = await import('@/lib/supabase/client');
  return supabase;
};

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MEDIA_BUCKET', () => {
  it('is "media"', () => {
    expect(MEDIA_BUCKET).toBe('media');
  });
});

describe('isImage', () => {
  it('returns true for jpg, jpeg, png, gif, webp, svg, avif', () => {
    expect(isImage('photo.jpg')).toBe(true);
    expect(isImage('photo.jpeg')).toBe(true);
    expect(isImage('photo.png')).toBe(true);
    expect(isImage('photo.gif')).toBe(true);
    expect(isImage('photo.webp')).toBe(true);
    expect(isImage('photo.svg')).toBe(true);
    expect(isImage('photo.avif')).toBe(true);
  });

  it('returns false for non-image files', () => {
    expect(isImage('document.pdf')).toBe(false);
    expect(isImage('video.mp4')).toBe(false);
    expect(isImage('data.csv')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(isImage('PHOTO.JPG')).toBe(true);
    expect(isImage('photo.PNG')).toBe(true);
  });

  it('returns false for files with no extension', () => {
    expect(isImage('noextension')).toBe(false);
  });
});

describe('formatBytes', () => {
  it('formats bytes < 1024 as B', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('formats bytes in KB range', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('formats bytes in MB range', () => {
    expect(formatBytes(1024 * 1024 * 3.5)).toBe('3.5 MB');
  });

  it('formats 0 as 0 B', () => {
    expect(formatBytes(0)).toBe('0 B');
  });
});

describe('buildPath', () => {
  it('joins path parts with /', () => {
    expect(buildPath('products', 'images', 'photo.jpg')).toBe('products/images/photo.jpg');
  });

  it('filters out empty parts', () => {
    expect(buildPath('', 'products', '', 'img.jpg')).toBe('products/img.jpg');
  });

  it('returns empty string for all empty parts', () => {
    expect(buildPath('', '', '')).toBe('');
  });
});

describe('getPublicUrl', () => {
  it('returns a public URL string from the storage mock', async () => {
    // The setup.ts mock for supabase.storage.from().getPublicUrl returns a known URL
    const url = getPublicUrl('products/image.jpg');
    expect(typeof url).toBe('string');
    // The setup mock returns: 'https://test.supabase.co/storage/v1/object/public/media/test.jpg'
    expect(url).toMatch(/https?:\/\//);
  });
});

describe('useStorageItems', () => {
  it('returns storage items, filtering .keep files', async () => {
    const supabase = await getSupabaseMock();
    const items = [
      { name: 'image.jpg', id: 'id-1', metadata: null, created_at: null, updated_at: null },
      { name: '.keep', id: null, metadata: null, created_at: null, updated_at: null },
    ];
    vi.mocked(supabase.storage.from).mockReturnValue({
      list: vi.fn().mockResolvedValueOnce({ data: items, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://x.com/img.jpg' } }),
    } as any);

    const { result } = renderHook(() => useStorageItems('products'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // .keep filtered out
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.name).toBe('image.jpg');
  });

  it('handles empty root path', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.storage.from).mockReturnValue({
      list: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
    } as any);

    const { result } = renderHook(() => useStorageItems(''), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('throws on list error', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.storage.from).mockReturnValue({
      list: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('list failed') }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
    } as any);

    const { result } = renderHook(() => useStorageItems('products'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('returns empty array when storage list returns null data with no error (covers ?? [] branch)', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.storage.from).mockReturnValue({
      list: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
    } as any);

    const { result } = renderHook(() => useStorageItems('products'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useStorageActions – error branches', () => {
  it('uploadFiles throws when upload fails', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: new Error('upload failed') }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      remove: vi.fn(),
    } as any);

    const { result } = renderHook(() => useStorageActions(), { wrapper: makeWrapper() });
    const file = new File(['x'], 'fail.jpg', { type: 'image/jpeg' });
    await expect(result.current.uploadFiles('products', [file])).rejects.toThrow('upload failed');
  });

  it('createFolder throws when upload fails', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: new Error('folder create failed') }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      remove: vi.fn(),
    } as any);

    const { result } = renderHook(() => useStorageActions(), { wrapper: makeWrapper() });
    await expect(result.current.createFolder('products', 'new')).rejects.toThrow('folder create failed');
  });

  it('deleteFile throws when remove fails', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn(),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      remove: vi.fn().mockResolvedValue({ error: new Error('delete failed') }),
    } as any);

    const { result } = renderHook(() => useStorageActions(), { wrapper: makeWrapper() });
    await expect(result.current.deleteFile('products/img.jpg', 'products')).rejects.toThrow('delete failed');
  });

  it('deleteFolder throws when list fails', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn(),
      list: vi.fn().mockResolvedValue({ data: null, error: new Error('list failed') }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      remove: vi.fn(),
    } as any);

    const { result } = renderHook(() => useStorageActions(), { wrapper: makeWrapper() });
    await expect(result.current.deleteFolder('products/old', 'products')).rejects.toThrow('list failed');
  });

  it('deleteFolder throws when remove fails', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn(),
      list: vi.fn().mockResolvedValue({ data: [{ name: 'file.jpg' }], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      remove: vi.fn().mockResolvedValue({ error: new Error('remove failed') }),
    } as any);

    const { result } = renderHook(() => useStorageActions(), { wrapper: makeWrapper() });
    await expect(result.current.deleteFolder('products/old', 'products')).rejects.toThrow('remove failed');
  });
});

describe('useStorageActions', () => {
  it('uploadFiles uploads files to the path', async () => {
    const supabase = await getSupabaseMock();
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: uploadMock,
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
    } as any);

    const { result } = renderHook(() => useStorageActions(), { wrapper: makeWrapper() });
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    await result.current.uploadFiles('products', [file]);
    expect(uploadMock).toHaveBeenCalledWith('products/photo.jpg', file, { upsert: true });
  });

  it('createFolder uploads a .keep placeholder', async () => {
    const supabase = await getSupabaseMock();
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: uploadMock,
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
    } as any);

    const { result } = renderHook(() => useStorageActions(), { wrapper: makeWrapper() });
    await result.current.createFolder('products', 'new-folder');
    expect(uploadMock).toHaveBeenCalledWith(
      'products/new-folder/.keep',
      expect.any(Blob),
      { upsert: true },
    );
  });

  it('deleteFile removes the file', async () => {
    const supabase = await getSupabaseMock();
    const removeMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn(),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      remove: removeMock,
    } as any);

    const { result } = renderHook(() => useStorageActions(), { wrapper: makeWrapper() });
    await result.current.deleteFile('products/image.jpg', 'products');
    expect(removeMock).toHaveBeenCalledWith(['products/image.jpg']);
  });

  it('deleteFolder lists and removes all contents', async () => {
    const supabase = await getSupabaseMock();
    const folderContents = [{ name: 'file1.jpg' }, { name: 'file2.jpg' }];
    const removeMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn(),
      list: vi.fn().mockResolvedValueOnce({ data: folderContents, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      remove: removeMock,
    } as any);

    const { result } = renderHook(() => useStorageActions(), { wrapper: makeWrapper() });
    await result.current.deleteFolder('products/old-folder', 'products');
    expect(removeMock).toHaveBeenCalledWith([
      'products/old-folder/file1.jpg',
      'products/old-folder/file2.jpg',
    ]);
  });

  it('deleteFolder does not call remove when folder is empty', async () => {
    const supabase = await getSupabaseMock();
    const removeMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn(),
      list: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      remove: removeMock,
    } as any);

    const { result } = renderHook(() => useStorageActions(), { wrapper: makeWrapper() });
    await result.current.deleteFolder('products/empty', 'products');
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('deleteFolder handles null data from list gracefully (covers data ?? [] branch)', async () => {
    const supabase = await getSupabaseMock();
    const removeMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn(),
      list: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      remove: removeMock,
    } as any);

    const { result } = renderHook(() => useStorageActions(), { wrapper: makeWrapper() });
    await result.current.deleteFolder('products/empty', 'products');
    // null data treated as empty — no remove call
    expect(removeMock).not.toHaveBeenCalled();
  });
});
