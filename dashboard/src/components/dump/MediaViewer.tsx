import { useEffect } from 'react';

interface MediaViewerProps {
  url: string;
  type: 'image' | 'video';
  onClose: () => void;
}

export function MediaViewer({ url, type, onClose }: MediaViewerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <div
        className="max-w-full max-h-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {type === 'image' ? (
          <img
            src={url}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded"
          />
        ) : (
          <video
            src={url}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded"
          />
        )}
      </div>
    </div>
  );
}
