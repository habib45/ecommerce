import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/domain";
import { DataTable } from "@/components/admin/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

function statusColor(status: string) {
  switch (status) {
    case "completed":
    case "delivered":      return "bg-green-100 text-green-700";
    case "processing":
    case "shipped":
    case "partially_shipped":
    case "payment_confirmed": return "bg-blue-100 text-blue-700";
    case "pending_payment":   return "bg-yellow-100 text-yellow-700";
    case "cancelled":
    case "refunded":
    case "disputed":          return "bg-red-100 text-red-700";
    default:                  return "bg-gray-100 text-gray-600";
  }
}

const STATUS_FILTERS: OrderStatus[] = [
  "payment_confirmed", "processing", "shipped", "delivered", "cancelled", "refunded",
];

export function AdminOrders() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  // Apply status filter before passing to DataTable
  const filtered = useMemo(() =>
    statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter),
    [orders, statusFilter]
  );

  const columns = useMemo<ColumnDef<Order, any>[]>(() => [
    {
      accessorKey: "order_number",
      header: "Order #",
      cell: (info) => (
        <span className="font-mono text-xs text-gray-700">{info.getValue()}</span>
      ),
      enableSorting: true,
    },
    {
      id: "customer",
      header: "Customer",
      accessorFn: (o) => `${o.shipping_address?.full_name ?? ""} ${o.email}`,
      cell: (info) => {
        const o = info.row.original;
        return (
          <div>
            <p className="font-medium text-gray-900">{o.shipping_address?.full_name || "—"}</p>
            <p className="text-xs text-gray-400">{o.email}</p>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: (info) => {
        const o = info.row.original;
        return <span className="font-semibold">{formatPrice(o.total, o.currency, o.locale)}</span>;
      },
      meta: { className: "text-right" },
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(info.getValue())}`}>
          {(info.getValue() as string).replace(/_/g, " ")}
        </span>
      ),
      meta: { className: "text-center" },
      enableSorting: true,
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: (info) => (
        <span className="text-xs text-gray-500">
          {new Date(info.getValue()).toLocaleDateString()}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: "arrow",
      header: "",
      cell: () => <span className="text-gray-400">→</span>,
      meta: { className: "text-right" },
      enableSorting: false,
    },
  ], []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} orders</p>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            statusFilter === "all"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
          }`}
        >
          All
        </button>
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
            }`}>
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        clientSearch
        searchPlaceholder="Search by order #, email or name…"
        emptyMessage="No orders found"
        onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
        pageSize={20}
      />
    </div>
  );
}
