import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { t, translationCompleteness } from '@/lib/translate';
import type { Product, TranslationMap } from '@/types/domain';
import { DataTable } from '@/components/admin/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

type ProductWithStock = Product & {
  product_variants: { stock_quantity: number }[];
};

const totalStock = (p: ProductWithStock) =>
  p.product_variants?.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0) ?? 0;

export function AdminProducts() {
  const navigate = useNavigate();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, product_variants(stock_quantity)')
        .order('created_at', { ascending: false });
      return (data ?? []) as ProductWithStock[];
    },
  });

  const columns = useMemo<ColumnDef<ProductWithStock, any>[]>(() => [
    {
      accessorFn: (p) => t(p.name as TranslationMap, 'en'),
      id: 'name',
      header: 'Name (EN)',
      cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
      enableSorting: true,
    },
    {
      id: 'bn_pct',
      header: 'bn-BD %',
      accessorFn: (p) =>
        translationCompleteness([p.name as TranslationMap, p.description as TranslationMap, p.meta_title as TranslationMap], 'bn-BD'),
      cell: (info) => {
        const v = info.getValue() as number;
        return (
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full max-w-[60px]">
              <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${v}%` }} />
            </div>
            <span className="text-xs text-gray-500 w-8">{v}%</span>
          </div>
        );
      },
      meta: { className: 'text-center' },
      enableSorting: true,
    },
    {
      id: 'sv_pct',
      header: 'sv %',
      accessorFn: (p) =>
        translationCompleteness([p.name as TranslationMap, p.description as TranslationMap, p.meta_title as TranslationMap], 'sv'),
      cell: (info) => {
        const v = info.getValue() as number;
        return (
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full max-w-[60px]">
              <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${v}%` }} />
            </div>
            <span className="text-xs text-gray-500 w-8">{v}%</span>
          </div>
        );
      },
      meta: { className: 'text-center' },
      enableSorting: true,
    },
    {
      id: 'stock',
      header: 'Stock',
      accessorFn: totalStock,
      cell: (info) => {
        const v = info.getValue() as number;
        return (
          <span className={`font-semibold ${v === 0 ? 'text-red-500' : v <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
            {v}
          </span>
        );
      },
      meta: { className: 'text-center' },
      enableSorting: true,
    },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: (info) => info.getValue()
        ? <span className="text-green-600 font-medium">Yes</span>
        : <span className="text-gray-400">No</span>,
      meta: { className: 'text-center' },
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: (info) => (
        <Link
          to={`/admin/products/${info.row.original.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:underline text-xs"
        >
          Edit
        </Link>
      ),
      meta: { className: 'text-right' },
      enableSorting: false,
    },
  ], []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} products</p>
        </div>
        <Link to="/admin/products/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          + Add Product
        </Link>
      </div>

      <DataTable
        data={products}
        columns={columns}
        isLoading={isLoading}
        clientSearch
        searchPlaceholder="Search by product name…"
        emptyMessage="No products found"
        onRowClick={(p) => navigate(`/admin/products/${p.id}`)}
        pageSize={20}
      />
    </div>
  );
}
