import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/hooks/useLocale";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { CartDrawer } from "../cart/CartDrawer";
import { supabase } from "@/lib/supabase/client";
import { t as tr } from "@/lib/translate";
import type { Category, TranslationMap } from "@/types/domain";

/* ─── Categories Mega Dropdown ──────────────────────────────────── */
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
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        {t("nav.categories")}
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-soft border border-gray-100 py-2 z-50 animate-scale-in origin-top-left"
        >
          <Link
            to={`/${locale}/categories`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-surface-50 hover:text-gray-900 transition-colors border-b border-gray-100 mb-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
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
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-surface-50 hover:text-accent-600 transition-colors"
              >
                {tr(cat.name as TranslationMap, locale)}
              </Link>
            );
          })}
          {topLevel.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">{t("common.noResults")}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Search Bar ────────────────────────────────────────────────── */
function SearchBar({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/${locale}/products?search=${encodeURIComponent(query.trim())}`);
      onClose?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("search.placeholder")}
        className="w-full h-10 pl-10 pr-4 bg-surface-100 border-0 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-accent-500/20 transition-all"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </form>
  );
}

/* ─── Mobile Menu ───────────────────────────────────────────────── */
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user, profile, signOut } = useAuthStore();
  const prefix = `/${locale}`;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="overlay" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-50 animate-slide-in-left shadow-drawer">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link to={prefix} onClick={onClose} className="text-xl font-bold text-gray-900 tracking-tight">
            Simbolos
          </Link>
          <button onClick={onClose} className="btn-icon hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <SearchBar onClose={onClose} />
        </div>

        {/* Nav links */}
        <nav className="px-4 pb-4 space-y-1">
          <Link to={prefix} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-surface-50 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            {t("nav.home")}
          </Link>
          <Link to={`${prefix}/products`} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-surface-50 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            {t("nav.products")}
          </Link>
          <Link to={`${prefix}/categories`} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-surface-50 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            {t("nav.categories")}
          </Link>
          <Link to={`${prefix}/about`} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-surface-50 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t("nav.about")}
          </Link>
          <Link to={`${prefix}/contact`} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-surface-50 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {t("footer.contact")}
          </Link>
        </nav>

        {/* Divider */}
        <div className="border-t border-gray-100 mx-4" />

        {/* Account section */}
        <div className="p-4 space-y-1">
          {user ? (
            <>
              <Link to={`${prefix}/account`} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-surface-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                {profile?.full_name ?? t("nav.account")}
              </Link>
              <Link to={`${prefix}/account/orders`} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-surface-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                {t("nav.orders")}
              </Link>
              <button
                onClick={() => { signOut(); onClose(); }}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-surface-50 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <Link to={`${prefix}/login`} onClick={onClose} className="btn-primary w-full text-sm justify-center">
              {t("nav.login")}
            </Link>
          )}
        </div>

        {/* Language & Currency */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4">
          <LanguageSwitcher />
          <CurrencySwitcher />
        </div>
      </div>
    </>
  );
}

/* ─── Main Header ───────────────────────────────────────────────── */
export function Header() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { user, profile, signOut } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const prefix = `/${locale}`;

  // Track scroll for backdrop blur effect
  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <>
      {/* Top announcement bar */}
      <div className="bg-primary-900 text-white text-center py-2 px-4 text-xs sm:text-sm font-medium">
        {t("home.announcement", "Free shipping on orders over $50")}
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-nav"
            : "bg-white"
        }`}
      >
        <div className="section">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden btn-icon hover:bg-gray-100"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <Link to={prefix} className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Simbolos
              </Link>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link to={prefix} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                {t("nav.home")}
              </Link>
              <Link to={`${prefix}/products`} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                {t("nav.products")}
              </Link>
              <CategoriesDropdown />
              <Link to={`${prefix}/about`} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                {t("nav.about")}
              </Link>
            </nav>

            {/* Right: Search + Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Desktop search bar */}
              <div className="hidden md:block">
                {searchOpen ? (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <SearchBar onClose={() => setSearchOpen(false)} />
                    <button onClick={() => setSearchOpen(false)} className="btn-icon hover:bg-gray-100">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setSearchOpen(true)} className="btn-icon hover:bg-gray-100" aria-label="Search">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Mobile search icon */}
              <Link to={`${prefix}/products?search=`} className="md:hidden btn-icon hover:bg-gray-100" aria-label="Search">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>

              {/* Language & Currency (desktop only) */}
              <div className="hidden lg:flex items-center gap-1">
                <LanguageSwitcher />
                <CurrencySwitcher />
              </div>

              {/* Account (desktop only) */}
              <div className="hidden sm:block">
                {user ? (
                  <Link to={`${prefix}/account`} className="btn-icon hover:bg-gray-100" aria-label={t("nav.account")}>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                ) : (
                  <Link to={`${prefix}/login`} className="btn-icon hover:bg-gray-100" aria-label={t("nav.login")}>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                )}
              </div>

              {/* Cart button */}
              <button
                onClick={() => setCartOpen(true)}
                className="btn-icon hover:bg-gray-100 relative"
                aria-label={t("nav.cart")}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-600 text-white text-2xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-scale-in">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
