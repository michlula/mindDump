import { Dump } from '../../types';

interface LinkPreviewProps {
  dump: Dump;
}

export function LinkPreview({ dump }: LinkPreviewProps) {
  const meta = dump.metadata;
  const url = meta?.url || dump.content;
  const displayUrl = (() => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  })();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block hover:opacity-90 transition-opacity"
    >
      {/* Show original text if different from URL */}
      {dump.content !== url && (
        <p className="text-gray-800 dark:text-gray-200 text-sm mb-2">{dump.content}</p>
      )}

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
  );
}
