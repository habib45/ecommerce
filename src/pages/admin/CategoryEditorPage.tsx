import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  LOCALE_CODES,
  type LocaleCode,
  type TranslationMap,
  type Category,
} from "@/types/domain";
import toast from "react-hot-toast";

/** BRD §6.1 — category editor: create or edit a category. */
export function AdminCategoryEditor() {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !categoryId || categoryId === "new";
  const [activeTab, setActiveTab] = useState<LocaleCode>("en");

  const [name, setName] = useState<TranslationMap>({});
  const [slug, setSlug] = useState<TranslationMap>({});
  const [description, setDescription] = useState<TranslationMap>({});
  const [metaTitle, setMetaTitle] = useState<TranslationMap>({});
  const [metaDescription, setMetaDescription] = useState<TranslationMap>({});
  const [parentId, setParentId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  // Load existing category
  const { data: categoryData } = useQuery({
    queryKey: ["admin-category", categoryId],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("id", categoryId)
        .single();
      return data as Category | null;
    },
    enabled: !isNew,
  });

  // Populate form when data loads (works with cached data too)
  useEffect(() => {
    if (!categoryData) return;
    setName(categoryData.name as TranslationMap);
    setSlug(categoryData.slug as TranslationMap);
    setDescription(categoryData.description as TranslationMap);
    setMetaTitle(categoryData.meta_title as TranslationMap);
    setMetaDescription(categoryData.meta_description as TranslationMap);
    setParentId(categoryData.parent_id);
    setIsActive(categoryData.is_active);
    setSortOrder(categoryData.sort_order ?? 0);
  }, [categoryData]);

  // Load categories for parent dropdown (exclude self)
  const { data: allCategories } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .order("sort_order", { ascending: true });
      return (data ?? []) as Pick<Category, "id" | "name">[];
    },
  });

  const parentOptions = allCategories?.filter((c) => c.id !== categoryId) ?? [];

  const handleSave = async () => {
    if (!name.en?.trim()) {
      toast.error("Category name (English) is required");
      return;
    }
    if (!slug.en?.trim()) {
      toast.error("Category slug (English) is required");
      return;
    }

    const payload = {
      name,
      slug,
      description,
      meta_title: metaTitle,
      meta_description: metaDescription,
      parent_id: parentId,
      is_active: isActive,
      sort_order: sortOrder,
    };

    if (isNew) {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Category created");
    } else {
      const { error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", categoryId);
      if (error) { toast.error(error.message); return; }
      toast.success("Category saved");
    }

    await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    navigate("/admin/categories");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this category? Products in this category will become uncategorized.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", categoryId);
    if (error) { toast.error(error.message); return; }
    toast.success("Category deleted");
    await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    navigate("/admin/categories");
  };

  const TAB_LABELS: Record<LocaleCode, string> = { en: "English", "bn-BD": "বাংলা", sv: "Svenska" };

  const setField = (
    setter: React.Dispatch<React.SetStateAction<TranslationMap>>,
    locale: LocaleCode,
    value: string
  ) => setter((prev) => ({ ...prev, [locale]: value }));

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? "New Category" : "Edit Category"}
        </h1>
        <div className="flex gap-2">
          {!isNew && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700"
          >
            {isNew ? "Create Category" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg border p-6 mb-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Settings</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent Category
          </label>
          <select
            value={parentId ?? ""}
            onChange={(e) => setParentId(e.target.value || null)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— No parent (top-level) —</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {(c.name as TranslationMap).en ?? c.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort Order
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-32 border rounded-lg px-3 py-2 text-sm"
            min={0}
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">Active (visible to customers)</span>
        </label>
      </div>

      {/* Translations */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex gap-2 mb-6">
          {LOCALE_CODES.map((locale) => (
            <button
              key={locale}
              onClick={() => setActiveTab(locale)}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                activeTab === locale
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {TAB_LABELS[locale]}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name {activeTab === "en" && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={name[activeTab] ?? ""}
              onChange={(e) => setField(setName, activeTab, e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder={activeTab === "en" ? "Category name" : "Translation…"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug {activeTab === "en" && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={slug[activeTab] ?? ""}
              onChange={(e) =>
                setField(setSlug, activeTab, e.target.value.toLowerCase().replace(/\s+/g, "-"))
              }
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="url-friendly-slug"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description[activeTab] ?? ""}
              onChange={(e) => setField(setDescription, activeTab, e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Short description of this category…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              value={metaTitle[activeTab] ?? ""}
              onChange={(e) => setField(setMetaTitle, activeTab, e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="SEO title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
            </label>
            <textarea
              value={metaDescription[activeTab] ?? ""}
              onChange={(e) => setField(setMetaDescription, activeTab, e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="SEO description…"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
