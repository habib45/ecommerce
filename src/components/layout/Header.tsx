import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/hooks/useLocale";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { supabase } from "@/lib/supabase/client";
import { t as tr } from "@/lib/translate";
import type { Category, TranslationMap } from "@/types/domain";

function CategoriesDropdown() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: categories } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      return (data ?? []) as Category[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const topLevel = categories?.filter((c) => !c.parent_id) ?? [];

  return (
    <div ref={ref} className="relative">
      <button
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
      >
        {t("nav.categories")}
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
        >
          <Link
            to={`/${locale}/categories`}
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-b border-gray-100 mb-1"
          >
            {t("nav.allCategories", "All Categories")}
          </Link>
          {topLevel.map((cat) => {
            const slug =
              (cat.slug as TranslationMap)[locale] ??
              (cat.slug as TranslationMap).en ??
              "";
            return (
              <Link
                key={cat.id}
                to={`/${locale}/categories/${slug}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
              >
                {tr(cat.name as TranslationMap, locale)}
              </Link>
            );
          })}
          {topLevel.length === 0 && (
            <p className="px-4 py-2 text-sm text-gray-400">No categories</p>
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { user, profile, signOut } = useAuthStore();

  const prefix = `/${locale}`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={prefix} className="text-xl font-bold text-gray-900">
            Simbolos
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to={`${prefix}/products`}
              className="text-gray-600 hover:text-gray-900"
            >
              {t("nav.products")}
            </Link>
            <CategoriesDropdown />
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <Link
              to={`${prefix}/products?search=`}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </Link>

            {/* BRD §3.2.2 — language switcher visible in header on every page */}
            <LanguageSwitcher />
            <CurrencySwitcher />

            {/* Cart with badge */}
            <Link
              to={`${prefix}/cart`}
              className="relative text-gray-600 hover:text-gray-900"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Account */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={`${prefix}/account`}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  {profile?.full_name ?? t("nav.account")}
                </Link>
                <button
                  onClick={signOut}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <Link
                to={`${prefix}/login`}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
