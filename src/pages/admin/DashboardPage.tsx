import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

/** BRD §3.12.1 — sales by locale, translation completeness. */
export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [orders, products] = await Promise.all([
        supabase.from('orders').select('id, total, locale, currency', { count: 'exact' }),
        supabase.from('products').select('id, name', { count: 'exact' }),
      ]);
      return { orderCount: orders.count ?? 0, productCount: products.count ?? 0 };
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-3xl font-bold">{stats?.orderCount ?? '—'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-3xl font-bold">{stats?.productCount ?? '—'}</p>
        </div>
      </div>
    </div>
  );
}
