import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Product, LocaleCode, Category, SearchResult } from '@/types/domain';

// ─── Single Product by locale-specific slug ───────────────────────
// BRD §3.2.4 — locale-specific slugs
export function useProduct(slug: string, locale: LocaleCode) {
  return useQuery({
    queryKey: ['product', slug, locale],
    queryFn: async () => {
      // Use RPC function to handle locale-specific slug lookup
      const { data: productData, error: rpcError } = await supabase
        .rpc('get_product_by_slug', {
          p_slug: slug,
          p_locale: locale,
        });

      if (rpcError) throw rpcError;
      if (!productData || productData.length === 0) {
        throw new Error('Product not found');
      }

      const product = productData[0];

      // Fetch related data separately with proper joins
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id);

      const { data: images, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .order('sort_order');

      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('id', product.category_id)
        .single();

      if (variantsError) throw variantsError;
      if (imagesError) throw imagesError;
      if (categoryError) throw categoryError;

      return {
        ...product,
        variants: variants ?? [],
        images: images ?? [],
        category: category,
      } as unknown as Product;
    },
    enabled: !!slug,
  });
}

// ─── Featured Products ────────────────────────────────────────
// Fetch products marked as featured by admin
export function useFeaturedProducts(locale: LocaleCode, limit = 8) {
  return useQuery({
    queryKey: ['featured-products', locale, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, slug, short_description, meta_title, is_active, created_at,
          variants:product_variants(id, prices, sale_prices, stock_quantity),
          images:product_images(url, alt_text, sort_order),
          category:categories(id, name, slug)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });
}

// ─── Product List with pagination ─────────────────────────────────
// BRD §3.1.1
interface ProductListParams {
  locale: LocaleCode;
  categorySlug?: string;
  searchQuery?: string;
  page?: number;
  perPage?: number;
  sortBy?: 'name' | 'price_asc' | 'price_desc' | 'newest';
}

export function useProducts({
  locale,
  categorySlug,
  searchQuery,
  page = 1,
  perPage = 24,
  sortBy = 'newest',
}: ProductListParams) {
  return useQuery({
    queryKey: ['products', locale, categorySlug, searchQuery, page, perPage, sortBy],
    queryFn: async () => {
      // If filtering by category, use the dedicated RPC function
      if (categorySlug) {
        const offset = (page - 1) * perPage;
        const { data, error } = await supabase
          .rpc('get_products_by_category_slug', {
            p_category_slug: categorySlug,
            p_locale: locale,
            p_limit: perPage,
            p_offset: offset,
          });

        if (error) throw error;

        // Extract total count from first row
        const total = data && data.length > 0 ? (data[0] as any).total_count : 0;

        return {
          data: (data ?? []) as unknown as Product[],
          total,
          page,
          per_page: perPage,
          total_pages: Math.ceil(total / perPage),
        };
      }

      // Default: fetch all active products
      let query = supabase
        .from('products')
        .select(`
          id, name, slug, short_description, meta_title, is_active, created_at,
          variants:product_variants(id, prices, sale_prices, stock_quantity),
          images:product_images(url, alt_text, sort_order),
          category:categories(id, name, slug)
        `, { count: 'exact' })
        .eq('is_active', true);

      // Search filter across name and description in all locales
      if (searchQuery?.trim()) {
        const term = `%${searchQuery.trim()}%`;
        query = query.or(
          `name->>en.ilike.${term},name->>bn-BD.ilike.${term},name->>sv.ilike.${term},` +
          `description->>en.ilike.${term},description->>bn-BD.ilike.${term},description->>sv.ilike.${term}`
        );
      }

      // Sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'name':
          // Name sorting handled client-side below
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const from = (page - 1) * perPage;
      query = query.range(from, from + perPage - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      let products = (data ?? []) as unknown as Product[];

      // Client-side sorting for name if requested (JSONB column ordering via API is complex)
      if (sortBy === 'name' && products.length > 0) {
        products = products.sort((a, b) => {
          const nameA = (a.name as any)?.[locale] || '';
          const nameB = (b.name as any)?.[locale] || '';
          return nameA.localeCompare(nameB);
        });
      }

      return {
        data: products,
        total: count ?? 0,
        page,
        per_page: perPage,
        total_pages: Math.ceil((count ?? 0) / perPage),
      };
    },
  });
}

// ─── Full-Text Search ─────────────────────────────────────────────
// BRD §3.1.2 — per-locale tsvector columns
export function useProductSearch(query: string, locale: LocaleCode) {
  const vectorColumn = {
    en: 'search_vector_en',
    'bn-BD': 'search_vector_bn',
    sv: 'search_vector_sv',
  }[locale];

  return useQuery({
    queryKey: ['search', query, locale],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .rpc('search_products', {
          search_query: query,
          search_locale: locale,
        });

      if (error) throw error;
      return (data ?? []) as SearchResult[];
    },
    enabled: query.trim().length > 0,
  });
}

// ─── Categories ───────────────────────────────────────────────────
export function useCategories(locale: LocaleCode) {
  return useQuery({
    queryKey: ['categories', locale],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return (data ?? []) as unknown as Category[];
    },
  });
}

// ─── Related Products ─────────────────────────────────────────────
// BRD §3.1.1
export function useRelatedProducts(productId: string, categoryId: string | null, locale: LocaleCode) {
  return useQuery({
    queryKey: ['related-products', productId, categoryId, locale],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          id, name, slug, short_description,
          variants:product_variants(id, prices, sale_prices, stock_quantity),
          images:product_images(url, alt_text, sort_order)
        `)
        .eq('is_active', true)
        .neq('id', productId)
        .limit(4);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
    enabled: !!productId,
  });
}
