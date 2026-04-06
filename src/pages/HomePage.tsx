import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useLocale } from "@/hooks/useLocale";
import { useProducts, useFeaturedProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/product/ProductGrid";
import { HeroSlider } from "@/components/home/HeroSlider";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { TrustSection } from "@/components/home/TrustSection";

export function HomePage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isLoading } = useProducts({
    locale,
    perPage: 12,
    sortBy: "newest",
  });
  const { data: featuredProducts } = useFeaturedProducts(locale, 12);

  const prefix = `/${locale}`;

  return (
    <>
      <Helmet>
        <title>{t("seo.homeTitle")}</title>
        <meta name="description" content={t("seo.homeDescription")} />
      </Helmet>

      {/* Hero Section */}
      <HeroSlider />

      {/* Trust Badges */}
      <div className="hidden sm:block">
        <TrustSection />
      </div>

      {/* Featured Products Carousel */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="section-padding bg-muted/30">
          <div className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title text-balance">{t("product.featured")}</h2>
              </div>
              <Link to={`${prefix}/products`} className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group w-full sm:w-auto justify-center sm:justify-start mt-3 sm:mt-0 px-4 py-2 sm:px-0 sm:py-0 ">
                {t("common.viewAll")}
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <h2 className="section-title text-balance">{t("home.newArrivals", "New Arrivals")}</h2>
            {/* <p className="section-subtitle">{t("home.newArrivalsDesc", "The latest additions to our collection")}</p> */}
          </div>
          <Link to={`${prefix}/products`} className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group w-full sm:w-auto justify-center sm:justify-start mt-3 sm:mt-0 px-4 py-2 sm:px-0 sm:py-0">
            {t("common.viewAll")}
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <ProductGrid products={data?.data ?? []} loading={isLoading} />
      </section>

      {/* Customer Testimonials */}
      <TestimonialsSection />
    </>
  );
}
