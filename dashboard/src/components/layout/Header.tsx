interface HeaderProps {
  onSearchToggle: () => void;
  showSearch: boolean;
  currentView: 'feed' | 'calendar';
  onViewToggle: () => void;
}

export function Header({ onSearchToggle, showSearch, currentView, onViewToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-indigo-600 dark:bg-indigo-900 text-white shadow-md">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">Mind Dump</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onViewToggle}
            className={`p-2 rounded-lg transition-colors ${
              currentView === 'calendar'
                ? 'bg-indigo-500 dark:bg-indigo-700'
                : 'hover:bg-indigo-500 dark:hover:bg-indigo-800'
            }`}
            aria-label={currentView === 'calendar' ? 'Switch to feed' : 'Switch to calendar'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={onSearchToggle}
            className="p-2 rounded-lg hover:bg-indigo-500 dark:hover:bg-indigo-800 transition-colors"
            aria-label={showSearch ? 'Close search' : 'Open search'}
          >
            {showSearch ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
