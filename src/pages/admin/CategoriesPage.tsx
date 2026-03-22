import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { t } from "@/lib/translate";
import type { Category } from "@/types/domain";

/** BRD §6.1 — category management list. */
export function AdminCategories() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      return (data ?? []) as Category[];
    },
  });

  const parentMap = Object.fromEntries(
    (categories ?? []).map((c) => [c.id, t(c.name, "en")])
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Link
          to="/admin/categories/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          Add Category
        </Link>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name (EN)</th>
                <th className="text-left px-4 py-3 font-medium">Slug</th>
                <th className="text-left px-4 py-3 font-medium">Parent</th>
                <th className="text-center px-4 py-3 font-medium">Order</th>
                <th className="text-center px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories?.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t(c.name, "en")}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {t(c.slug, "en")}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.parent_id ? parentMap[c.parent_id] ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">{c.sort_order}</td>
                  <td className="px-4 py-3 text-center">
                    {c.is_active ? "✓" : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/categories/${c.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {categories?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No categories yet. Click "Add Category" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
