import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export interface HeroSlide {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  bg_overlay: string;
  cta_label: string | null;
  cta_href: string | null;
  show_text: boolean;
  show_button: boolean;
  is_active: boolean;
  height_px: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type HeroSlideInsert = Omit<HeroSlide, 'id' | 'created_at' | 'updated_at'>;
export type HeroSlideUpdate = Partial<HeroSlideInsert>;

/** Storefront: fetch only active slides ordered by sort_order */
export function useHeroSlides() {
  return useQuery({
    queryKey: ['hero_slides', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as HeroSlide[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** Admin: fetch all slides (active + inactive) */
export function useAllHeroSlides() {
  return useQuery({
    queryKey: ['hero_slides', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as HeroSlide[];
    },
  });
}

export function useCreateHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slide: HeroSlideInsert) => {
      const { data, error } = await supabase
        .from('hero_slides')
        .insert(slide)
        .select()
        .single();
      if (error) throw error;
      return data as HeroSlide;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hero_slides'] }),
  });
}

export function useUpdateHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & HeroSlideUpdate) => {
      const { data, error } = await supabase
        .from('hero_slides')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as HeroSlide;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hero_slides'] }),
  });
}

export function useDeleteHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hero_slides').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hero_slides'] }),
  });
}
