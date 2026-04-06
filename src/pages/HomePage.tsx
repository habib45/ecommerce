import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useLocale } from "@/hooks/useLocale";
import { useProducts, useFeaturedProducts, useCategories } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/product/ProductGrid";
import { HeroSlider } from "@/components/home/HeroSlider";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { t as tr } from "@/lib/translate";
import type { Category, TranslationMap } from "@/types/domain";

export function HomePage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isLoading } = useProducts({
    locale,
    perPage: 8,
    sortBy: "newest",
  });
  const { data: featuredProducts } = useFeaturedProducts(locale, 8);
  const { data: categories } = useCategories(locale);

  const prefix = `/${locale}`;
  const topCategories = categories?.filter((c) => !c.parent_id).slice(0, 6) ?? [];

  return (
    <>
      <Helmet>
        <title>{t("seo.homeTitle")}</title>
        <meta name="description" content={t("seo.homeDescription")} />
      </Helmet>

      {/* Hero Slider */}
      <HeroSlider />

      {/* Categories Grid */}
      {topCategories.length > 0 && (
        <section className="section section-padding">
          <div className="section-header">
            <div>
              <h2 className="section-title">{t("home.shopByCategory", "Shop by Category")}</h2>
              <p className="section-subtitle">{t("home.shopByCategoryDesc", "Browse our curated collections")}</p>
            </div>
            <Link to={`${prefix}/categories`} className="hidden sm:flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors">
              {t("common.viewAll")}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {topCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Carousel */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="section section-padding bg-surface-50 -mx-[calc((100vw-100%)/2)] px-[calc((100vw-100%)/2)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="section-header">
              <div>
                <h2 className="section-title">{t("product.featured")}</h2>
                <p className="section-subtitle">{t("home.featuredDesc", "Hand-picked just for you")}</p>
              </div>
              <Link to={`${prefix}/products`} className="hidden sm:flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors">
                {t("common.viewAll")}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <ProductCarousel products={featuredProducts} />
          </div>
        </section>
      )}

      {/* New Arrivals Grid */}
      <section className="section section-padding">
        <div className="section-header">
          <div>
            <h2 className="section-title">{t("home.newArrivals", "New Arrivals")}</h2>
            <p className="section-subtitle">{t("home.newArrivalsDesc", "The latest additions to our collection")}</p>
          </div>
          <Link to={`${prefix}/products`} className="hidden sm:flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors">
            {t("common.viewAll")}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <ProductGrid products={data?.data ?? []} loading={isLoading} />
      </section>

      {/* Value Propositions */}
      <section className="bg-primary-900 text-white">
        <div className="section py-16 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-12">
            <ValueProp
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />}
              title={t("home.valueGlobal", "Global Reach")}
              description={t("home.valueGlobalDesc", "Serving customers in English, Bangla, and Swedish with localized experiences.")}
            />
            <ValueProp
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
              title={t("home.valueSecure", "Secure & Trusted")}
              description={t("home.valueSecureDesc", "SSL-encrypted payments with Stripe. Your data is safe with us.")}
            />
            <ValueProp
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />}
              title={t("home.valueQuality", "Quality First")}
              description={t("home.valueQualityDesc", "Curated products from trusted brands with hassle-free returns.")}
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section section-padding">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="section-title">{t("home.testimonials", "What Our Customers Say")}</h2>
          <p className="section-subtitle mt-2">{t("home.testimonialsDesc", "Real reviews from real customers")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <TestimonialCard
            name="Sarah J."
            rating={5}
            text={t("home.testimonial1", "Amazing quality and fast shipping. The multilingual support is a game-changer for my family.")}
          />
          <TestimonialCard
            name="Rahman K."
            rating={5}
            text={t("home.testimonial2", "Finally an e-commerce platform that supports Bangla! The shopping experience feels truly local.")}
          />
          <TestimonialCard
            name="Erik L."
            rating={4}
            text={t("home.testimonial3", "Great product selection and the Swedish language support with local currency is very convenient.")}
          />
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-surface-50">
        <div className="section py-16 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {t("home.newsletterTitle", "Stay in the Loop")}
          </h2>
          <p className="mt-3 text-gray-500 max-w-md mx-auto">
            {t("home.newsletterDesc", "Subscribe to get special offers, free giveaways, and new arrivals.")}
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder={t("home.newsletterPlaceholder", "Enter your email")}
              className="flex-1 h-12 px-5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all"
            />
            <button type="submit" className="btn-accent h-12 px-8 whitespace-nowrap">
              {t("home.newsletterButton", "Subscribe")}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

/* ─── Sub-components ────────────────────���───────────────────────── */

function CategoryCard({ category, locale }: { category: Category; locale: string }) {
  const slug =
    (category.slug as TranslationMap)[locale as keyof TranslationMap] ??
    (category.slug as TranslationMap).en ??
    "";
  const name = tr(category.name as TranslationMap, locale as 'en' | 'bn-BD' | 'sv');

  return (
    <Link
      to={`/${locale}/categories/${slug}`}
      className="group relative flex flex-col items-center text-center p-6 rounded-2xl bg-surface-50 hover:bg-surface-100 transition-all duration-300 hover:shadow-soft"
    >
      <div className="w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center mb-3 group-hover:bg-accent-100 group-hover:scale-110 transition-all duration-300">
        <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-gray-900 group-hover:text-accent-600 transition-colors">
        {name}
      </h3>
    </Link>
  );
}

function ValueProp({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center sm:text-left">
      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto sm:mx-0 mb-4">
        <svg className="w-6 h-6 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function TestimonialCard({ name, rating, text }: { name: string; rating: number; text: string }) {
  return (
    <div className="card p-6 sm:p-8">
      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-gray-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {/* Text */}
      <p className="text-sm text-gray-600 leading-relaxed mb-4">"{text}"</p>
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-accent-100 flex items-center justify-center">
          <span className="text-sm font-semibold text-accent-600">
            {name.charAt(0)}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-900">{name}</span>
      </div>
    </div>
  );
}
