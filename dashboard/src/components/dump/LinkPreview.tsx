import { useRef, useEffect } from 'react';
import { Dump } from '../../types';

interface LinkPreviewProps {
  dump: Dump;
  isEditingTitle: boolean;
  editValue: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
}

export function LinkPreview({
  dump,
  isEditingTitle,
  editValue,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
}: LinkPreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const meta = dump.metadata;
  const url = meta?.url || dump.body || dump.content;
  const aiTitle = dump.title || dump.content;
  const displayUrl = (() => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  })();

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingTitle]);

  return (
    <div>
      {isEditingTitle ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onCancel();
          }}
          onBlur={onSave}
          className="w-full text-sm text-gray-800 dark:text-gray-200 mb-2 bg-transparent border-b border-indigo-400 outline-none"
        />
      ) : aiTitle !== url ? (
        <p
          className="text-gray-800 dark:text-gray-200 text-sm mb-2 cursor-pointer hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
          onClick={onStartEdit}
        >
          {aiTitle}
        </p>
      ) : null}

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:opacity-90 transition-opacity"
      >
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Preview image */}
          {meta?.image && (
            <div className="w-full h-40 overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={meta.image}
                alt={meta.title || ''}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Text content */}
          <div className="p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {meta?.siteName || displayUrl}
            </p>
            {meta?.title && (
              <p className="font-medium text-gray-800 dark:text-gray-200 text-sm line-clamp-2">
                {meta.title}
              </p>
            )}
            {meta?.description && (
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-2">
                {meta.description}
              </p>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}
