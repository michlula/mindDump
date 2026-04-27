import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Dump } from '../types';

export function useCalendarDumps(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  return useQuery<Dump[]>({
    queryKey: ['calendarDumps', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dumps')
        .select('*, categories(*)')
        .not('metadata->event_date', 'is', null)
        .gte('metadata->>event_date', startDate)
        .lt('metadata->>event_date', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
