import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Dump } from '../types';

export function useSearch(query: string) {
  return useQuery<Dump[]>({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query.trim()) return [];

      // Convert user query to tsquery format
      const tsQuery = query
        .trim()
        .split(/\s+/)
        .map((word) => `${word}:*`)
        .join(' & ');

      const { data, error } = await supabase
        .from('dumps')
        .select('*, categories(*)')
        .textSearch('search_vector', tsQuery)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: query.trim().length > 0,
  });
}
