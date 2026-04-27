import { useState, useMemo } from 'react';
import { useCalendarDumps } from '../../hooks/useCalendarDumps';
import { DumpCard } from '../dump/DumpCard';
import { Dump } from '../../types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: dumps, isLoading } = useCalendarDumps(currentYear, currentMonth);

  // Group dumps by day
  const dumpsByDay = useMemo(() => {
    const map = new Map<number, Dump[]>();
    if (!dumps) return map;
    for (const dump of dumps) {
      const eventDate = (dump.metadata as Record<string, unknown>).event_date as string;
      const day = parseInt(eventDate.split('-')[2], 10);
      const existing = map.get(day) || [];
      existing.push(dump);
      map.set(day, existing);
    }
    return map;
  }, [dumps]);

  // Calendar grid calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const isCurrentMonth = currentYear === todayYear && currentMonth === todayMonth;

  const monthLabel = new Date(currentYear, currentMonth - 1).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });

  function goToPrevMonth() {
    setSelectedDay(null);
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function goToNextMonth() {
    setSelectedDay(null);
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  const selectedDumps = selectedDay ? dumpsByDay.get(selectedDay) || [] : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-20">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          aria-label="Previous month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {monthLabel}
        </h2>
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          aria-label="Next month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {/* Empty cells for days before the 1st */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-50 dark:bg-gray-900 min-h-[56px]" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayDumps = dumpsByDay.get(day) || [];
            const hasEvents = dayDumps.length > 0;
            const isToday = isCurrentMonth && day === todayDay;
            const isSelected = day === selectedDay;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`relative min-h-[56px] p-1 text-left transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950'
                    : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                    isToday
                      ? 'bg-indigo-600 text-white font-bold'
                      : isSelected
                        ? 'text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {day}
                </span>
                {hasEvents && (
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {dayDumps.slice(0, 3).map((_, dotIdx) => (
                      <div
                        key={dotIdx}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400"
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected day detail panel */}
      {selectedDay !== null && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            {new Date(currentYear, currentMonth - 1, selectedDay).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
          {selectedDumps.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No events on this day
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDumps.map((dump) => (
                <DumpCard key={dump.id} dump={dump} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
