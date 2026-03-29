import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { t as translate } from "@/lib/translate";
import type { Order, OrderItem, OrderStatus } from "@/types/domain";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending_payment",
  "payment_confirmed",
  "processing",
  "partially_shipped",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "refunded",
  "disputed",
];

function statusColor(status: string) {
  switch (status) {
    case "completed":
    case "delivered":
      return "bg-green-100 text-green-800";
    case "processing":
    case "shipped":
    case "partially_shipped":
    case "payment_confirmed":
      return "bg-primary-100 text-primary-800";
    case "pending_payment":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
    case "refunded":
    case "disputed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

interface OrderItemWithStock extends OrderItem {
  variant?: { stock_quantity: number };
}

interface OrderWithItems extends Order {
  order_items?: OrderItemWithStock[];
}

export function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["admin-order-detail", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, variant:product_variants(stock_quantity))")
        .eq("id", orderId!)
        .single();
      if (error) throw error;
      return data as OrderWithItems;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: OrderStatus) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">Loading order…</div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-16 text-red-500">Order not found.</div>
    );
  }

  const addr = order.shipping_address;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/orders")}
          className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
        >
          ← Back to Orders
        </button>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(order.status)}`}>
            {order.status.replace(/_/g, " ")}
          </span>
          <select
            value={order.status}
            onChange={(e) => updateStatus.mutate(e.target.value as OrderStatus)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Products + Payment */}
        <div className="lg:col-span-2 space-y-6">

          {/* Order Items Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">
                Products ({order.order_items?.length ?? 0})
              </h2>
            </div>
            {!order.order_items?.length ? (
              <p className="px-5 py-6 text-sm text-gray-400">No items found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left px-5 py-3">Product</th>
                    <th className="text-center px-4 py-3">Qty</th>
                    <th className="text-center px-4 py-3">Stock</th>
                    <th className="text-right px-4 py-3">Unit Price</th>
                    <th className="text-right px-5 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.order_items.map((item) => {
                    const stock = item.variant?.stock_quantity ?? null;
                    const lowStock = stock !== null && stock <= 5;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">
                            {translate(item.product_name, "en") || "Product"}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {translate(item.variant_name, "en") || item.sku}
                          </p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            SKU: {item.sku}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {stock === null ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              stock === 0
                                ? "bg-red-100 text-red-700"
                                : lowStock
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                            }`}>
                              {stock === 0 ? "Out of stock" : `${stock} left`}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700">
                          {formatPrice(item.unit_price, order.currency, order.locale)}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-gray-900">
                          {formatPrice(item.total, order.currency, order.locale)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Payment</h2>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm">
              {order.stripe_payment_intent_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment ID</span>
                  <span className="font-mono text-xs text-gray-700 break-all text-right max-w-[240px]">
                    {order.stripe_payment_intent_id}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Currency</span>
                <span className="text-gray-900">{order.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(order.subtotal, order.currency, order.locale)}</span>
              </div>
              {order.shipping > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>{formatPrice(order.shipping, order.currency, order.locale)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatPrice(order.tax, order.currency, order.locale)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t font-bold text-base">
                <span>Total</span>
                <span>{formatPrice(order.total, order.currency, order.locale)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Customer + Shipping */}
        <div className="space-y-6">

          {/* Customer */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Customer</h2>
            </div>
            <div className="px-5 py-4 text-sm space-y-1">
              <p className="font-medium text-gray-900">{addr?.full_name || "—"}</p>
              <p className="text-gray-500">{order.email || "—"}</p>
              {addr?.phone && <p className="text-gray-500">{addr.phone}</p>}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Shipping Address</h2>
            </div>
            <div className="px-5 py-4 text-sm text-gray-700 space-y-1">
              {addr?.line1 ? (
                <>
                  <p>{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  {addr.thana && <p>{addr.thana}</p>}
                  {addr.district && <p>{addr.district}</p>}
                  <p>
                    {[addr.city, addr.state_province, addr.postal_code]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>{addr.country}</p>
                </>
              ) : (
                <p className="text-gray-400">No address provided</p>
              )}
            </div>
          </div>

          {/* Order Meta */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Details</h2>
            </div>
            <div className="px-5 py-4 text-xs text-gray-500 space-y-2">
              <div className="flex justify-between">
                <span>Order ID</span>
                <span className="font-mono text-gray-700">{order.id.slice(0, 8)}…</span>
              </div>
              <div className="flex justify-between">
                <span>Locale</span>
                <span className="bg-gray-100 px-2 py-0.5 rounded">{order.locale}</span>
              </div>
              <div className="flex justify-between">
                <span>Created</span>
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>{new Date(order.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
