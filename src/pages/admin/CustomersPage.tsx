import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, callEdgeFunction } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/types/domain";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/DataTable";
import toast from "react-hot-toast";

const PAGE_SIZE = 20;

const ROLES: UserRole[] = ["customer", "support_agent", "store_manager", "administrator"];

function roleBadge(role: string) {
  switch (role) {
    case "administrator":  return "bg-red-100 text-red-700";
    case "store_manager":  return "bg-purple-100 text-purple-700";
    case "support_agent":  return "bg-yellow-100 text-yellow-700";
    default:               return "bg-gray-100 text-gray-600";
  }
}

interface CreateForm {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}

const EMPTY_FORM: CreateForm = { full_name: "", email: "", password: "", role: "customer" };

function CreateCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (field: keyof CreateForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setSaving(true);
    try {
      await callEdgeFunction("admin-create-user", {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
      });
      toast.success(`Account created for ${form.email}`);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Create Customer Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <input type="text" placeholder="John Doe" value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input type="email" placeholder="customer@example.com" value={form.email}
              onChange={(e) => update("email", e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters"
                value={form.password} onChange={(e) => update("password", e.target.value)}
                required minLength={8}
                className="w-full px-3 py-2 pr-14 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select value={form.role} onChange={(e) => update("role", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400">
            The account will be created with email confirmed — the customer can log in immediately.
          </p>
          <div className="flex gap-3 pt-2 border-t">
            <button type="submit" disabled={saving}
              className="flex-1 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? "Creating…" : "Create Account"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminCustomers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers", search, page],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.or(
          `email.ilike.%${search.trim()}%,full_name.ilike.%${search.trim()}%`
        );
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { customers: (data ?? []) as Profile[], total: count ?? 0 };
    },
    placeholderData: (prev) => prev,
  });

  const customers = data?.customers ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const columns = useMemo<ColumnDef<Profile, any>[]>(() => [
    {
      id: "customer",
      header: "Customer",
      accessorFn: (c) => c.full_name ?? c.email,
      cell: (info) => {
        const c = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
              {(c.full_name || c.email || "?")[0]!.toUpperCase()}
            </div>
            <span className="font-medium text-gray-900">
              {c.full_name || <span className="text-gray-400 italic">No name</span>}
            </span>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
      enableSorting: true,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: (info) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge(info.getValue())}`}>
          {(info.getValue() as string).replace(/_/g, " ")}
        </span>
      ),
      meta: { className: "text-center" },
      enableSorting: true,
    },
    {
      accessorKey: "language_pref",
      header: "Language",
      cell: (info) => (
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{info.getValue()}</span>
      ),
      meta: { className: "text-center" },
      enableSorting: true,
    },
    {
      accessorKey: "currency_pref",
      header: "Currency",
      cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
      meta: { className: "text-center" },
      enableSorting: true,
    },
    {
      accessorKey: "created_at",
      header: "Joined",
      cell: (info) => (
        <span className="text-xs text-gray-500">
          {new Date(info.getValue()).toLocaleDateString()}
        </span>
      ),
      enableSorting: true,
    },
  ], []);

  return (
    <div>
      {showCreate && (
        <CreateCustomerModal
          onClose={() => setShowCreate(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ["admin-customers"] })}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total customers</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
          + Create Account
        </button>
      </div>

      <DataTable
        data={customers}
        columns={columns}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={handleSearch}
        searchPlaceholder="Search by name or email…"
        emptyMessage={search ? `No customers found for "${search}"` : "No customers yet"}
        pageSize={PAGE_SIZE}
      />

      {/* Server-side pagination footer (when >1 page) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 mt-2 bg-white border rounded-lg text-sm">
          <span className="text-gray-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((i) => Math.abs(i - page) <= 2)
              .map((i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded border text-xs font-medium ${
                    i === page ? "bg-primary-600 text-white border-primary-600" : "border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}>
                  {i + 1}
                </button>
              ))}
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
