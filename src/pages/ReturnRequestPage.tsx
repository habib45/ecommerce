import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { formatPrice } from '@/lib/format';
import type { Order, OrderItem } from '@/types/domain';
import toast from 'react-hot-toast';

const REASON_CODES = [
  { value: 'defective',            label: 'Defective / Not working' },
  { value: 'wrong_item',           label: 'Wrong item received' },
  { value: 'not_as_described',     label: 'Not as described' },
  { value: 'damaged_in_shipping',  label: 'Damaged in shipping' },
  { value: 'changed_mind',         label: 'Changed my mind' },
  { value: 'other',                label: 'Other' },
];

interface ReturnLineItem {
  order_item_id: string;
  quantity: number;
  condition: string;
}

export function ReturnRequestPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<Record<string, number>>({}); // order_item_id → qty to return
  const [reasonCode, setReasonCode] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const toggleItem = (itemId: string, _maxQty: number) => {
    setSelected((prev) => {
      if (prev[itemId] !== undefined) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: 1 };
    });
  };

  const setQty = (itemId: string, qty: number, maxQty: number) => {
    setSelected((prev) => ({ ...prev, [itemId]: Math.min(Math.max(1, qty), maxQty) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemIds = Object.keys(selected);
    if (itemIds.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }
    if (!reasonCode) {
      toast.error('Please select a reason');
      return;
    }

    const items: ReturnLineItem[] = itemIds.map((id) => ({
      order_item_id: id,
      quantity: selected[id]!,
      condition: 'used',
    }));

    setSubmitting(true);
    try {
      const { error } = await supabase.from('return_requests').insert({
        order_id: orderId,
        user_id: user!.id,
        reason_code: reasonCode,
        reason_detail: reasonDetail.trim() || null,
        items,
      });
      if (error) throw error;
      toast.success('Return request submitted successfully');
      navigate(`/${locale}/account/orders/${orderId}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to submit return request');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-gray-500">Order not found.</p>
      </div>
    );
  }

  const items = order.items ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to={`/${locale}/account/orders/${orderId}`}
        className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4">
        ← Back to order
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Request a Return</h1>
      <p className="text-sm text-gray-500 mb-6">Order #{order.order_number}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select items */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">1. Select items to return</h2>
          </div>
          <div className="divide-y">
            {items.map((item) => {
              const name = typeof item.product_name === 'object'
                ? (item.product_name as Record<string, string>)[locale]
                  ?? Object.values(item.product_name as Record<string, string>)[0]
                  ?? item.sku
                : item.sku;
              const variantName = typeof item.variant_name === 'object'
                ? (item.variant_name as Record<string, string>)[locale] ?? ''
                : '';
              const isChecked = selected[item.id] !== undefined;

              return (
                <div key={item.id} className={`flex items-center gap-4 px-4 py-3 ${isChecked ? 'bg-primary-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleItem(item.id, item.quantity)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{name}</p>
                    {variantName && <p className="text-xs text-gray-400">{variantName}</p>}
                    <p className="text-xs text-gray-400">Ordered: {item.quantity} × {formatPrice(item.unit_price, order.currency, locale)}</p>
                  </div>
                  {isChecked && item.quantity > 1 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-gray-500 mr-1">Qty:</span>
                      <button type="button"
                        onClick={() => setQty(item.id, (selected[item.id] ?? 1) - 1, item.quantity)}
                        className="w-6 h-6 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm">
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{selected[item.id]}</span>
                      <button type="button"
                        onClick={() => setQty(item.id, (selected[item.id] ?? 1) + 1, item.quantity)}
                        className="w-6 h-6 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm">
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Reason */}
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">2. Reason for return</h2>
          <select
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a reason…</option>
            {REASON_CODES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <textarea
            value={reasonDetail}
            onChange={(e) => setReasonDetail(e.target.value)}
            placeholder="Additional details (optional)…"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Note */}
        <p className="text-xs text-gray-400">
          After submitting, our team will review your return request within 2–3 business days
          and contact you with the next steps.
        </p>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || Object.keys(selected).length === 0 || !reasonCode}
            className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Return Request'}
          </button>
          <Link to={`/${locale}/account/orders/${orderId}`}
            className="px-4 py-2.5 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
