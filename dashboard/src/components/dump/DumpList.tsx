import { useEffect, useRef, useCallback } from 'react';
import { useDumps } from '../../hooks/useDumps';
import { DumpCard } from './DumpCard';

interface DumpListProps {
  categoryId: string | null;
}

export function DumpList({ categoryId }: DumpListProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useDumps(categoryId);

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Infinite scroll trigger
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const allDumps = data?.pages.flatMap((page) => page) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (allDumps.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400">
        <p className="text-4xl mb-4">🧠</p>
        <p className="text-lg font-medium">No dumps yet</p>
        <p className="text-sm mt-1">Send something to your Telegram bot to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allDumps.map((dump, index) => (
        <div
          key={dump.id}
          ref={index === allDumps.length - 1 ? lastElementRef : undefined}
        >
          <DumpCard dump={dump} />
        </div>
      ))}

      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
