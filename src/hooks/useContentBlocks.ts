import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { ContentBlock } from '@/types/domain';

type ContentBlockInsert = Omit<ContentBlock, 'id'>;
type ContentBlockUpdate = Partial<ContentBlockInsert>;

/** Fetch content blocks by type */
export function useContentBlocks(type: ContentBlock['type']) {
  return useQuery({
    queryKey: ['content_blocks', type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('type', type)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ContentBlock[];
    },
  });
}

/** Fetch active content blocks by type (storefront) */
export function useActiveContentBlocks(type: ContentBlock['type']) {
  return useQuery({
    queryKey: ['content_blocks', type, 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ContentBlock[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateContentBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (block: ContentBlockInsert) => {
      const { data, error } = await supabase
        .from('content_blocks')
        .insert(block)
        .select()
        .single();
      if (error) throw error;
      return data as ContentBlock;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content_blocks'] }),
  });
}

export function useUpdateContentBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & ContentBlockUpdate) => {
      const { data, error } = await supabase
        .from('content_blocks')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ContentBlock;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content_blocks'] }),
  });
}

export function useDeleteContentBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('content_blocks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content_blocks'] }),
  });
}
