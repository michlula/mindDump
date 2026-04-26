import { useTypeCounts } from '../../hooks/useCategories';

interface ContentTypeFilterProps {
  selectedType: string | null;
  onSelect: (type: string | null) => void;
}

const TYPE_OPTIONS = [
  { value: null, label: 'All', icon: '✱' },
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'link', label: 'Links', icon: '🔗' },
  { value: 'image', label: 'Images', icon: '🖼️' },
  { value: 'video', label: 'Videos', icon: '🎬' },
] as const;

export function ContentTypeFilter({ selectedType, onSelect }: ContentTypeFilterProps) {
  const { data: counts } = useTypeCounts();

  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined;

  return (
    <div className="sticky top-[6.5rem] z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-3xl mx-auto">
        <div className="flex overflow-x-auto scrollbar-hide px-2 gap-1 py-1.5">
          {TYPE_OPTIONS.map((opt) => {
            const count = opt.value === null ? total : counts?.[opt.value];
            return (
              <button
                key={opt.label}
                onClick={() => onSelect(opt.value)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedType === opt.value
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
                {count !== undefined && count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedType === opt.value
                      ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
