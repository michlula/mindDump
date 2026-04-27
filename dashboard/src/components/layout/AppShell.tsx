import { useState } from 'react';
import { Header } from './Header';
import { CategoryTabs } from './CategoryTabs';
import { ContentTypeFilter } from './ContentTypeFilter';
import { DumpList } from '../dump/DumpList';
import { SearchOverlay } from '../search/SearchOverlay';
import { CalendarView } from '../calendar/CalendarView';

export function AppShell() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [currentView, setCurrentView] = useState<'feed' | 'calendar'>('feed');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header
        onSearchToggle={() => setShowSearch(!showSearch)}
        showSearch={showSearch}
        currentView={currentView}
        onViewToggle={() => setCurrentView(currentView === 'feed' ? 'calendar' : 'feed')}
      />
      {currentView === 'feed' && (
        <>
          <CategoryTabs
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <ContentTypeFilter
            selectedType={selectedType}
            onSelect={setSelectedType}
          />
        </>
      )}

      {showSearch ? (
        <SearchOverlay onClose={() => setShowSearch(false)} />
      ) : currentView === 'calendar' ? (
        <CalendarView />
      ) : (
        <main className="max-w-3xl mx-auto px-4 py-4 pb-20">
          <DumpList categoryId={selectedCategory} contentType={selectedType} />
        </main>
      )}
    </div>
  );
}
