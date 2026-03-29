import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { useLocale } from "@/hooks/useLocale";
import { useProducts, useFeaturedProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/product/ProductGrid";
import { HeroSlider } from "@/components/home/HeroSlider";
import { ProductCarousel } from "@/components/home/ProductCarousel";

export function HomePage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isLoading } = useProducts({
    locale,
    perPage: 8,
    sortBy: "newest",
  });
  const { data: featuredProducts } =
    useFeaturedProducts(locale, 8);

  return (
    <>
      <Helmet>
        <title>{t("seo.homeTitle")}</title>
        <meta name="description" content={t("seo.homeDescription")} />
      </Helmet>

      {/* Hero Slider */}
      <HeroSlider />

      {/* Featured Products Carousel - Shows admin-selected featured products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {t("product.featured")}
          </h2>
          <ProductCarousel
            products={featuredProducts}
          />
        </section>
      )}

      {/* All Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t("product.relatedProducts")}
        </h2>
        <ProductGrid products={data?.data ?? []} loading={isLoading} />
      </section>
    </>
  );
}
