import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Category } from '../types';

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data;
    },
  });
}

export function useCategoryCounts() {
  return useQuery<Record<string, number>>({
    queryKey: ['categoryCounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dumps')
        .select('category_id');

      if (error) throw error;

      const counts: Record<string, number> = { all: data.length };
      data.forEach((d) => {
        if (d.category_id) {
          counts[d.category_id] = (counts[d.category_id] || 0) + 1;
        }
      });
      return counts;
    },
  });
}
