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
  return (
    <div className="sticky top-[6.5rem] z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-3xl mx-auto">
        <div className="flex overflow-x-auto scrollbar-hide px-2 gap-1 py-1.5">
          {TYPE_OPTIONS.map((opt) => (
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
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
