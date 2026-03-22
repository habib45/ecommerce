import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, callEdgeFunction } from "@/lib/supabase/client";
import type { ReturnStatus } from "@/types/domain";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/format";

const STATUS_OPTIONS: ReturnStatus[] = [
  "requested", "approved", "info_requested", "received", "refunded", "rejected",
];

function statusBadge(status: string) {
  switch (status) {
    case "approved":        return "bg-green-100 text-green-700";
    case "requested":       return "bg-yellow-100 text-yellow-700";
    case "info_requested":  return "bg-blue-100 text-blue-700";
    case "received":        return "bg-purple-100 text-purple-700";
    case "refunded":        return "bg-teal-100 text-teal-700";
    case "rejected":        return "bg-red-100 text-red-700";
    default:                return "bg-gray-100 text-gray-600";
  }
}

type ReturnRow = {
  id: string;
  order_id: string;
  user_id: string;
  status: ReturnStatus;
  reason_code: string;
  reason_detail: string | null;
  items: Array<{ order_item_id: string; quantity: number; condition: string }>;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  orders: { order_number: string; total: number; currency: string; stripe_payment_intent_id: string | null } | null;
  profiles: { email: string; full_name: string | null } | null;
};

export function AdminReturns() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);

  const { data: returns, isLoading } = useQuery({
    queryKey: ["admin-returns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("return_requests")
        .select("*, orders(order_number, total, currency, stripe_payment_intent_id), profiles!return_requests_user_id_profiles_fkey(email, full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReturnRow[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReturnStatus }) => {
      const { error } = await supabase
        .from("return_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      toast.success("Status updated");
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to update status"),
  });

  const handleRefund = async (r: ReturnRow, refundAll: boolean) => {
    if (!r.orders?.stripe_payment_intent_id) {
      toast.error("No Stripe payment on this order");
      return;
    }
    const confirmed = window.confirm(
      refundAll
        ? `Issue full refund of ${formatPrice(r.orders.total, r.orders.currency as any, "en")} for order #${r.orders.order_number}?`
        : `Issue partial refund for returned items on order #${r.orders.order_number}?`
    );
    if (!confirmed) return;

    setRefunding(r.id);
    try {
      await callEdgeFunction("process-refund", {
        returnRequestId: r.id,
        refundAll,
      });
      toast.success("Refund issued successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
    } catch (err: any) {
      toast.error(err.message ?? "Refund failed");
    } finally {
      setRefunding(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Return Requests</h1>
          <p className="text-sm text-gray-500 mt-1">{returns?.length ?? 0} total requests</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !returns || returns.length === 0 ? (
        <div className="bg-white border rounded-lg p-10 text-center text-gray-400">
          No return requests yet
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Reason</th>
                <th className="text-center px-4 py-3">Items</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {returns.map((r) => (
                <Fragment key={r.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        #{r.orders?.order_number ?? r.order_id.slice(0, 8)}
                      </p>
                      {r.orders && (
                        <p className="text-xs text-gray-400">
                          {formatPrice(r.orders.total, r.orders.currency as any, "en")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-xs">
                        {r.profiles?.full_name || r.profiles?.email || "—"}
                      </p>
                      {r.profiles?.full_name && (
                        <p className="text-xs text-gray-400">{r.profiles.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800">{r.reason_code.replace(/_/g, " ")}</p>
                      {r.reason_detail && (
                        <p className="text-xs text-gray-400 truncate max-w-xs">{r.reason_detail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {r.items?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(r.status)}`}>
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {expandedId === r.id ? "Hide" : "Manage"}
                      </button>
                    </td>
                  </tr>

                  {expandedId === r.id && (
                    <tr key={`${r.id}-detail`}>
                      <td colSpan={7} className="bg-gray-50 px-4 py-4 border-t">
                        <div className="flex items-start gap-8 flex-wrap">
                          {/* Items */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-600 mb-2">Returned Items</p>
                            <div className="space-y-1">
                              {r.items?.map((item, i) => (
                                <div key={i} className="text-xs text-gray-600 bg-white border rounded px-3 py-1.5">
                                  Item: <span className="font-mono">{item.order_item_id.slice(0, 8)}…</span>
                                  {" · "} Qty: <strong>{item.quantity}</strong>
                                  {" · "} Condition: {item.condition}
                                </div>
                              ))}
                            </div>
                            {r.reason_detail && (
                              <p className="text-xs text-gray-500 mt-2 italic bg-white border rounded px-3 py-1.5">
                                "{r.reason_detail}"
                              </p>
                            )}
                          </div>

                          {/* Status update */}
                          <div className="shrink-0">
                            <p className="text-xs font-semibold text-gray-600 mb-2">Update Status</p>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {STATUS_OPTIONS.filter((s) => s !== "refunded").map((s) => (
                                <button
                                  key={s}
                                  onClick={() => updateStatus.mutate({ id: r.id, status: s })}
                                  disabled={r.status === s || updateStatus.isPending}
                                  className={`px-2 py-1 rounded text-xs font-medium border transition-colors disabled:opacity-40 ${
                                    r.status === s
                                      ? "bg-gray-900 text-white border-gray-900"
                                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-600"
                                  }`}
                                >
                                  {s.replace(/_/g, " ")}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Refund actions */}
                          {r.status !== "refunded" && r.status !== "rejected" && r.orders?.stripe_payment_intent_id && (
                            <div className="shrink-0">
                              <p className="text-xs font-semibold text-gray-600 mb-2">Issue Refund</p>
                              <div className="flex flex-col gap-1.5">
                                <button
                                  onClick={() => handleRefund(r, false)}
                                  disabled={refunding === r.id}
                                  className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 disabled:opacity-50"
                                >
                                  {refunding === r.id ? "Processing…" : "Partial Refund (items)"}
                                </button>
                                <button
                                  onClick={() => handleRefund(r, true)}
                                  disabled={refunding === r.id}
                                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                  {refunding === r.id ? "Processing…" : "Full Refund"}
                                </button>
                              </div>
                              <p className="text-xs text-gray-400 mt-1.5">
                                Total: {formatPrice(r.orders.total, r.orders.currency as any, "en")}
                              </p>
                            </div>
                          )}

                          {r.status === "refunded" && (
                            <div className="shrink-0">
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Refund issued
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
