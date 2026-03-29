import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { supabase } from "@/lib/supabase/client";
import { t as tr } from "@/lib/translate";
import type { Category, TranslationMap } from "@/types/domain";

export function CategoriesListPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      return (data ?? []) as Category[];
    },
  });

  // Top-level categories only
  const topLevel = categories?.filter((c) => !c.parent_id) ?? [];

  // Group children by parent_id
  const childrenOf = (parentId: string) =>
    categories?.filter((c) => c.parent_id === parentId) ?? [];

  return (
    <>
      <Helmet>
        <title>{t("nav.categories", "Categories")}</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          {t("nav.categories", "Categories")}
        </h1>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && topLevel.length === 0 && (
          <p className="text-gray-500">{t("categories.empty", "No categories available.")}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {topLevel.map((cat) => {
            const slug = (cat.slug as TranslationMap)[locale] ?? (cat.slug as TranslationMap).en ?? "";
            const name = tr(cat.name as TranslationMap, locale);
            const desc = tr(cat.description as TranslationMap, locale);
            const children = childrenOf(cat.id);

            return (
              <div key={cat.id} className="group">
                <Link
                  to={`/${locale}/categories/${slug}`}
                  className="block bg-white border rounded-xl p-5 hover:border-primary-400 hover:shadow-md transition-all"
                >
                  <h2 className="font-semibold text-gray-900 group-hover:text-primary-600 mb-1">
                    {name}
                  </h2>
                  {desc && (
                    <p className="text-sm text-gray-500 line-clamp-2">{desc}</p>
                  )}
                </Link>

                {/* Sub-categories */}
                {children.length > 0 && (
                  <ul className="mt-1 pl-2 space-y-0.5">
                    {children.map((child) => {
                      const childSlug =
                        (child.slug as TranslationMap)[locale] ??
                        (child.slug as TranslationMap).en ??
                        "";
                      return (
                        <li key={child.id}>
                          <Link
                            to={`/${locale}/categories/${childSlug}`}
                            className="text-sm text-gray-500 hover:text-primary-600 hover:underline"
                          >
                            {tr(child.name as TranslationMap, locale)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
