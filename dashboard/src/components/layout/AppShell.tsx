import { useState } from 'react';
import { Header } from './Header';
import { CategoryTabs } from './CategoryTabs';
import { DumpList } from '../dump/DumpList';
import { SearchOverlay } from '../search/SearchOverlay';

export function AppShell() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header
        onSearchToggle={() => setShowSearch(!showSearch)}
        showSearch={showSearch}
      />
      <CategoryTabs
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {showSearch ? (
        <SearchOverlay onClose={() => setShowSearch(false)} />
      ) : (
        <main className="max-w-3xl mx-auto px-4 py-4 pb-20">
          <DumpList categoryId={selectedCategory} />
        </main>
      )}
    </div>
  );
}
