import { StorageItem, isImage, formatBytes, getPublicUrl, buildPath } from '@/hooks/useMediaLibrary';

interface Props {
  items: StorageItem[];
  currentPath: string;
  onNavigate: (folder: string) => void;
  onDelete: (item: StorageItem) => void;
  onCopy: (url: string) => void;
}

function FolderIcon() {
  return (
    <svg className="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toUpperCase() ?? 'FILE';
  return (
    <div className="w-10 h-12 bg-gray-100 border border-gray-200 rounded flex flex-col items-center justify-center">
      <span className="text-gray-400 text-xs font-bold leading-none">{ext.slice(0, 4)}</span>
    </div>
  );
}

function CopyBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Copy URL"
      className="p-1 text-gray-400 hover:text-blue-600 transition"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Delete"
      className="p-1 text-gray-400 hover:text-red-600 transition"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}

export function MediaFileGrid({ items, currentPath, onNavigate, onDelete, onCopy }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        This folder is empty. Upload files or create a sub-folder.
      </div>
    );
  }

  const folders = items.filter((i) => i.id === null);
  const files = items.filter((i) => i.id !== null);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {/* Folders first */}
      {folders.map((item) => (
        <div key={item.name}
          className="bg-white border rounded-lg p-3 flex flex-col items-center gap-2 hover:border-blue-300 transition group cursor-pointer"
          onClick={() => onNavigate(buildPath(currentPath, item.name))}
        >
          <FolderIcon />
          <span className="text-xs text-gray-700 text-center break-all leading-tight w-full truncate">
            {item.name}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <DeleteBtn onClick={(e) => { (e as unknown as MouseEvent).stopPropagation?.(); onDelete(item); }} />
          </div>
        </div>
      ))}

      {/* Files */}
      {files.map((item) => {
        const filePath = buildPath(currentPath, item.name);
        const url = getPublicUrl(filePath);
        const size = item.metadata?.size ?? 0;

        return (
          <div key={item.name}
            className="bg-white border rounded-lg p-3 flex flex-col items-center gap-2 hover:border-blue-300 transition group"
          >
            {isImage(item.name) ? (
              <img
                src={url}
                alt={item.name}
                className="w-full h-16 object-cover rounded"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            ) : (
              <FileIcon name={item.name} />
            )}
            <span className="text-xs text-gray-700 text-center break-all leading-tight w-full truncate">
              {item.name}
            </span>
            {size > 0 && (
              <span className="text-xs text-gray-400">{formatBytes(size)}</span>
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <CopyBtn onClick={() => onCopy(url)} />
              <DeleteBtn onClick={() => onDelete(item)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
