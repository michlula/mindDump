import { useState } from 'react';
import { Dump } from '../../types';
import { LinkPreview } from './LinkPreview';
import { MediaViewer } from './MediaViewer';
import { useDeleteDump, useTogglePin } from '../../hooks/useDumps';

interface DumpCardProps {
  dump: Dump;
}

export function DumpCard({ dump }: DumpCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const deleteDump = useDeleteDump();
  const togglePin = useTogglePin();

  const category = dump.categories;
  const timeStr = new Date(dump.created_at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <div
        className={`relative bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-all hover:shadow-md ${
          dump.is_pinned ? 'ring-2 ring-indigo-300 dark:ring-indigo-700' : ''
        }`}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
      >
        {/* Pin indicator */}
        {dump.is_pinned && (
          <div className="absolute top-2 right-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">
            Pinned
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {dump.type === 'text' && <TextContent content={dump.content} />}
          {dump.type === 'link' && <LinkPreview dump={dump} />}
          {dump.type === 'image' && (
            <ImageContent dump={dump} onView={() => setShowViewer(true)} />
          )}
          {dump.type === 'video' && (
            <VideoContent dump={dump} onView={() => setShowViewer(true)} />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            {category && (
              <span
                className="px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: category.color + '20', color: category.color }}
              >
                {category.icon} {category.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>{timeStr}</span>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Context menu */}
        {showMenu && (
          <div className="absolute right-2 bottom-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[140px]">
            <MenuButton
              onClick={() => {
                togglePin.mutate({ id: dump.id, isPinned: dump.is_pinned });
                setShowMenu(false);
              }}
            >
              {dump.is_pinned ? 'Unpin' : 'Pin to top'}
            </MenuButton>
            <MenuButton
              onClick={() => {
                if (confirm('Delete this item?')) {
                  deleteDump.mutate(dump.id);
                }
                setShowMenu(false);
              }}
              danger
            >
              Delete
            </MenuButton>
            <MenuButton onClick={() => setShowMenu(false)}>Cancel</MenuButton>
          </div>
        )}
      </div>

      {/* Full-screen media viewer */}
      {showViewer && dump.media_url && (
        <MediaViewer
          url={dump.media_url}
          type={dump.type as 'image' | 'video'}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
}

function TextContent({ content }: { content: string }) {
  return (
    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
      {content}
    </p>
  );
}

function ImageContent({ dump, onView }: { dump: Dump; onView: () => void }) {
  return (
    <div>
      {dump.content && dump.content !== '[Image]' && (
        <p className="text-gray-800 dark:text-gray-200 text-sm mb-2">{dump.content}</p>
      )}
      <img
        src={dump.media_url!}
        alt={dump.content || 'Image'}
        className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-h-80 object-cover"
        onClick={onView}
        loading="lazy"
      />
    </div>
  );
}

function VideoContent({ dump, onView }: { dump: Dump; onView: () => void }) {
  return (
    <div>
      {dump.content && dump.content !== '[Video]' && (
        <p className="text-gray-800 dark:text-gray-200 text-sm mb-2">{dump.content}</p>
      )}
      <div
        className="relative w-full rounded-lg overflow-hidden bg-gray-900 cursor-pointer max-h-80"
        onClick={onView}
      >
        <video
          src={dump.media_url!}
          className="w-full max-h-80 object-contain"
          preload="metadata"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-800 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}
