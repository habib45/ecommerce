import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useStorageItems, useStorageActions, buildPath, MEDIA_BUCKET } from '@/hooks/useMediaLibrary';
import { MediaFileGrid } from '@/components/admin/MediaFileGrid';
import type { StorageItem } from '@/hooks/useMediaLibrary';

/** Split a path into breadcrumb segments: ['folder', 'subfolder', ...] */
function pathSegments(path: string) {
  return path ? path.split('/') : [];
}

export function AdminMediaLibrary() {
  const [currentPath, setCurrentPath] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading, error } = useStorageItems(currentPath);
  const { uploadFiles, createFolder, deleteFile, deleteFolder } = useStorageActions();

  /* ── Navigation ── */
  const navigateTo = (path: string) => setCurrentPath(path);
  const navigateToCrumb = (index: number) => {
    const segments = pathSegments(currentPath);
    setCurrentPath(segments.slice(0, index + 1).join('/'));
  };

  /* ── Upload ── */
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      await uploadFiles(currentPath, Array.from(files));
      toast.success(`${files.length} file(s) uploaded`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── Create folder ── */
  const handleCreateFolder = async () => {
    const name = newFolderName.trim().replace(/[^a-zA-Z0-9_\-]/g, '-');
    if (!name) return;
    try {
      await createFolder(currentPath, name);
      toast.success(`Folder "${name}" created`);
      setNewFolderName('');
      setShowFolderInput(false);
    } catch {
      toast.error('Failed to create folder');
    }
  };

  /* ── Delete ── */
  const handleDelete = async (item: StorageItem) => {
    const isFolder = item.id === null;
    const label = isFolder ? `folder "${item.name}" and all its contents` : `"${item.name}"`;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    try {
      const targetPath = buildPath(currentPath, item.name);
      if (isFolder) {
        await deleteFolder(targetPath, currentPath);
      } else {
        await deleteFile(targetPath, currentPath);
      }
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  /* ── Copy URL ── */
  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied to clipboard');
    } catch {
      toast.error('Copy failed — check clipboard permissions');
    }
  };

  const segments = pathSegments(currentPath);

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-sm text-gray-500 mt-1">
            Bucket: <code className="bg-gray-100 px-1 rounded">{MEDIA_BUCKET}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploading ? 'Uploading…' : 'Upload Files'}
          </button>

          {/* New Folder */}
          <button
            onClick={() => setShowFolderInput((v) => !v)}
            className="px-4 py-2 bg-white border text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            New Folder
          </button>
        </div>
      </div>

      {/* New folder input */}
      {showFolderInput && (
        <div className="mb-4 flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3">
          <input
            autoFocus
            type="text"
            placeholder="folder-name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            className="flex-1 border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <button
            onClick={handleCreateFolder}
            className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
          >
            Create
          </button>
          <button
            onClick={() => { setShowFolderInput(false); setNewFolderName(''); }}
            className="px-3 py-1.5 text-gray-500 text-sm hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm mb-4 bg-white border rounded-lg px-4 py-2">
        <button
          onClick={() => navigateTo('')}
          className={`hover:text-primary-600 transition ${currentPath === '' ? 'font-semibold text-gray-900' : 'text-gray-500'}`}
        >
          media
        </button>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-gray-300">/</span>
            <button
              onClick={() => navigateToCrumb(i)}
              className={`hover:text-primary-600 transition ${i === segments.length - 1 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}
            >
              {seg}
            </button>
          </span>
        ))}
        {currentPath && (
          <button
            onClick={() => navigateTo(segments.slice(0, -1).join('/'))}
            className="ml-auto text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
          >
            ← Back
          </button>
        )}
      </nav>

      {/* Content */}
      <div className="bg-white border rounded-lg p-4 min-h-64">
        {error ? (
          <p className="text-red-500 text-sm">Failed to load files. Check storage policies.</p>
        ) : isLoading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : (
          <MediaFileGrid
            items={items}
            currentPath={currentPath}
            onNavigate={navigateTo}
            onDelete={handleDelete}
            onCopy={handleCopy}
          />
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Hover over a file to reveal Copy URL and Delete actions.
        Images show a thumbnail preview. Accepted: any file type, max 50 MB.
      </p>
    </div>
  );
}
