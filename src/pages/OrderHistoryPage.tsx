import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/hooks/useLocale';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { formatPrice, formatDate } from '@/lib/format';
import { Link } from 'react-router-dom';
import type { Order } from '@/types/domain';

export function OrderHistoryPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user } = useAuthStore();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      return (data ?? []) as Order[];
    },
    enabled: !!user,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('account.orders')}</h1>
      {isLoading ? (
        <p>{t('common.loading')}</p>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} to={`/${locale}/account/orders/${order.id}`}
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">#{order.order_number}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.created_at, locale)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(order.total, order.currency, locale)}</p>
                  <p className="text-sm text-gray-500">{t(`order.status.${order.status}`)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">{t('account.noOrders')}</p>
      )}
    </div>
  );
}
