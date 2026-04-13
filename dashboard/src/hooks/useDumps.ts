import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Dump } from '../types';

const PAGE_SIZE = 20;

export function useDumps(categoryId: string | null) {
  return useInfiniteQuery<Dump[]>({
    queryKey: ['dumps', categoryId],
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('dumps')
        .select('*, categories(*)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageParam as number, (pageParam as number) + PAGE_SIZE - 1);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
  });
}

export function useDeleteDump() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dumpId: string) => {
      const { error } = await supabase.from('dumps').delete().eq('id', dumpId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dumps'] });
      queryClient.invalidateQueries({ queryKey: ['categoryCounts'] });
    },
  });
}

export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const { error } = await supabase
        .from('dumps')
        .update({ is_pinned: !isPinned })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dumps'] });
    },
  });
}

export function useUpdateDumpCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, categoryId }: { id: string; categoryId: string }) => {
      const { error } = await supabase
        .from('dumps')
        .update({ category_id: categoryId })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dumps'] });
      queryClient.invalidateQueries({ queryKey: ['categoryCounts'] });
    },
  });
}
