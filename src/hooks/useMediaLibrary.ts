import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export const MEDIA_BUCKET = 'media';

export interface StorageItem {
  name: string;
  id: string | null;      // null = virtual folder prefix
  metadata: {
    size: number;
    mimetype: string;
    lastModified: string;
  } | null;
  created_at: string | null;
  updated_at: string | null;
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];
export const isImage = (name: string) =>
  IMAGE_EXTS.includes(name.split('.').pop()?.toLowerCase() ?? '');

export const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export const buildPath = (...parts: string[]) =>
  parts.filter(Boolean).join('/');

/** Get public URL for a file path inside the media bucket */
export const getPublicUrl = (filePath: string): string =>
  supabase.storage.from(MEDIA_BUCKET).getPublicUrl(filePath).data.publicUrl;

/** List files and virtual folders at a given path inside the media bucket */
export function useStorageItems(path: string) {
  return useQuery({
    queryKey: ['storage', MEDIA_BUCKET, path],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .list(path || undefined, {
          limit: 500,
          sortBy: { column: 'name', order: 'asc' },
        });
      if (error) throw error;
      // Filter out .keep placeholders used for empty folder creation
      return (data ?? []).filter((i) => i.name !== '.keep') as StorageItem[];
    },
    staleTime: 0,
  });
}

/** Returns helpers that operate on the media bucket and invalidate the cache */
export function useStorageActions() {
  const qc = useQueryClient();
  const invalidate = (path: string) =>
    qc.invalidateQueries({ queryKey: ['storage', MEDIA_BUCKET, path] });

  /** Upload one or more files into the given folder path */
  const uploadFiles = async (folderPath: string, files: File[]) => {
    await Promise.all(
      files.map((file) => {
        const dest = buildPath(folderPath, file.name);
        return supabase.storage
          .from(MEDIA_BUCKET)
          .upload(dest, file, { upsert: true })
          .then(({ error }) => { if (error) throw error; });
      }),
    );
    invalidate(folderPath);
  };

  /** Create a virtual folder by uploading a hidden .keep placeholder */
  const createFolder = async (parentPath: string, folderName: string) => {
    const dest = buildPath(parentPath, folderName, '.keep');
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(dest, new Blob([''], { type: 'text/plain' }), { upsert: true });
    if (error) throw error;
    invalidate(parentPath);
  };

  /** Delete a single file */
  const deleteFile = async (filePath: string, parentPath: string) => {
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .remove([filePath]);
    if (error) throw error;
    invalidate(parentPath);
  };

  /** Delete a folder: list all children and remove them, then invalidate */
  const deleteFolder = async (folderPath: string, parentPath: string) => {
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .list(folderPath, { limit: 500 });
    if (error) throw error;

    const paths = (data ?? []).map((f) => buildPath(folderPath, f.name));
    if (paths.length > 0) {
      const { error: delErr } = await supabase.storage
        .from(MEDIA_BUCKET)
        .remove(paths);
      if (delErr) throw delErr;
    }
    invalidate(parentPath);
  };

  return { uploadFiles, createFolder, deleteFile, deleteFolder };
}
