import { useState, useRef, useEffect } from 'react';
import { useSearch } from '../../hooks/useSearch';
import { DumpCard } from '../dump/DumpCard';

interface SearchOverlayProps {
  onClose: () => void;
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: results, isLoading } = useSearch(query);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-20">
      {/* Search input */}
      <div className="relative mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your dumps..."
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Results */}
      {!query.trim() && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-sm">Type to search across all your dumps</p>
        </div>
      )}

      {isLoading && query.trim() && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      )}

      {results && results.length === 0 && query.trim() && !isLoading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-1">No results found</p>
          <p className="text-sm">Try different keywords</p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          {results.map((dump) => (
            <DumpCard key={dump.id} dump={dump} />
          ))}
        </div>
      )}
    </div>
  );
}
