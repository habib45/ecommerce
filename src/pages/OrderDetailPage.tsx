import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { formatPrice, formatDate } from '@/lib/format';
import type { Order, OrderItem } from '@/types/domain';

const RETURNABLE_STATUSES = ['delivered', 'completed'];

function statusBadge(status: string) {
  switch (status) {
    case 'payment_confirmed':
    case 'processing':      return 'bg-blue-100 text-blue-700';
    case 'shipped':
    case 'partially_shipped': return 'bg-yellow-100 text-yellow-700';
    case 'delivered':
    case 'completed':       return 'bg-green-100 text-green-700';
    case 'cancelled':
    case 'refunded':        return 'bg-red-100 text-red-700';
    default:                return 'bg-gray-100 text-gray-600';
  }
}

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user } = useAuthStore();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('id', orderId!)
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data as Order & { items: OrderItem[] };
    },
    enabled: !!user && !!orderId,
  });

  const { data: existingReturn } = useQuery({
    queryKey: ['return', orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from('return_requests')
        .select('id, status, created_at')
        .eq('order_id', orderId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!orderId,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-gray-500">Order not found.</p>
        <Link to={`/${locale}/account/orders`} className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const canReturn = RETURNABLE_STATUSES.includes(order.status);
  const addr = order.shipping_address;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to={`/${locale}/account/orders`} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-1">
            ← {t('common.back')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.created_at, locale)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(order.status)}`}>
          {t(`order.status.${order.status}`, order.status.replace(/_/g, ' '))}
        </span>
      </div>

      {/* Items */}
      <div className="bg-white border rounded-lg overflow-hidden mb-4">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Items Ordered</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2">Product</th>
              <th className="text-center px-4 py-2">Qty</th>
              <th className="text-right px-4 py-2">Unit Price</th>
              <th className="text-right px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(order.items ?? []).map((item) => {
              const name = typeof item.product_name === 'object'
                ? (item.product_name as Record<string, string>)[locale] ?? Object.values(item.product_name as Record<string, string>)[0] ?? item.sku
                : item.sku;
              const variantName = typeof item.variant_name === 'object'
                ? (item.variant_name as Record<string, string>)[locale] ?? ''
                : '';
              return (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{name}</p>
                    {variantName && <p className="text-xs text-gray-400">{variantName}</p>}
                    <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {formatPrice(item.unit_price, order.currency, locale)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatPrice(item.total, order.currency, locale)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary + Address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Payment summary */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Payment Summary</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal, order.currency, locale)}</span>
            </div>
            {order.shipping > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{formatPrice(order.shipping, order.currency, locale)}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatPrice(order.tax, order.currency, locale)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 border-t pt-2 mt-2">
              <span>Total</span>
              <span>{formatPrice(order.total, order.currency, locale)}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        {addr && (
          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Shipping Address</h2>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-medium text-gray-900">{addr.full_name}</p>
              {addr.phone && <p>{addr.phone}</p>}
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>{[addr.city, addr.state_province, addr.postal_code].filter(Boolean).join(', ')}</p>
              <p>{addr.country}</p>
            </div>
          </div>
        )}
      </div>

      {/* Return section */}
      {canReturn && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Returns</h2>
          {existingReturn ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Return request submitted on {new Date(existingReturn.created_at).toLocaleDateString()}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                existingReturn.status === 'approved' || existingReturn.status === 'refunded'
                  ? 'bg-green-100 text-green-700'
                  : existingReturn.status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {existingReturn.status.replace(/_/g, ' ')}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Not satisfied with your order? You can request a return.</p>
              <Link
                to={`/${locale}/account/orders/${order.id}/return`}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 shrink-0 ml-4"
              >
                Request Return
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
