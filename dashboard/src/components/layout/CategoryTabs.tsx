import { useCategories, useCategoryCounts } from '../../hooks/useCategories';
import { Category } from '../../types';

interface CategoryTabsProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryTabs({ selectedId, onSelect }: CategoryTabsProps) {
  const { data: categories, isLoading } = useCategories();
  const { data: counts } = useCategoryCounts();

  if (isLoading) {
    return (
      <div className="h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800" />
    );
  }

  return (
    <div className="sticky top-14 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-3xl mx-auto">
        <div className="flex overflow-x-auto scrollbar-hide px-2 gap-1 py-2">
          {/* All tab */}
          <TabButton
            label="All"
            icon="📋"
            count={counts?.all}
            isActive={selectedId === null}
            onClick={() => onSelect(null)}
          />

          {categories?.map((cat) => (
            <TabButton
              key={cat.id}
              label={cat.name}
              icon={cat.icon}
              count={counts?.[cat.id]}
              color={cat.color}
              isActive={selectedId === cat.id}
              onClick={() => onSelect(cat.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  label: string;
  icon: string;
  count?: number;
  color?: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, icon, count, color, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
        isActive
          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
          isActive
            ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}
