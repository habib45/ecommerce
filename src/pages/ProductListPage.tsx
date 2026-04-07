import { useSearchParams, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useLocale } from '@/hooks/useLocale';
import { useProducts } from '@/hooks/useProducts';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductSearch } from '@/components/product/ProductSearch';

export function ProductListPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const sortBy = (searchParams.get('sort') ?? 'newest') as 'newest' | 'name' | 'price_asc' | 'price_desc';
  const searchQuery = searchParams.get('search') ?? '';

  // Reset page when search/sort changes
  useEffect(() => { setPage(1); }, [searchQuery, sortBy, categorySlug]);

  const { data, isLoading } = useProducts({ locale, categorySlug, searchQuery, page, sortBy });

  const heading = searchQuery
    ? t('search.resultsFor', 'Results for "{{query}}"', { query: searchQuery })
    : t('nav.products');

  return (
    <>
      <SEOHead
        title={searchQuery ? `"${searchQuery}" — ${t('seo.productsTitle')}` : t('seo.productsTitle')}
        description={t('seo.productsDescription')}
        path={categorySlug ? `/categories/${categorySlug}` : '/products'}
        noindex={!!searchQuery}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
          <div className="flex items-center gap-4">
            <ProductSearch initialQuery={searchQuery} />
            {!searchQuery && (
              <select
                value={sortBy}
                onChange={(e) => setSearchParams({ sort: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="newest">{t('search.sortOptions.newest')}</option>
                <option value="name">{t('search.sortOptions.nameAsc')}</option>
                <option value="price_asc">{t('search.sortOptions.priceAsc')}</option>
                <option value="price_desc">{t('search.sortOptions.priceDesc')}</option>
              </select>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchParams({})}
                className="text-sm text-gray-500 hover:text-gray-900 underline"
              >
                {t('search.clearSearch', 'Clear search')}
              </button>
            )}
          </div>
        </div>

        {/* No results */}
        {!isLoading && data?.data.length === 0 && (
          <p className="text-gray-500 text-center py-12">
            {searchQuery
              ? t('search.noResults', 'No products found for "{{query}}"', { query: searchQuery })
              : t('products.empty', 'No products available.')}
          </p>
        )}

        {/* Results */}
        <ProductGrid products={data?.data ?? []} loading={isLoading} />

        {/* Pagination — hide during search */}
        {!searchQuery && data && data.total_pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: data.total_pages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded text-sm ${page === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
