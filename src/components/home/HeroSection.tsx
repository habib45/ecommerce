import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useLocale } from "@/hooks/useLocale";

export function HeroSection() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const prefix = `/${locale}`;

  return (
    <section className="relative overflow-hidden hero-gradient">
      <div className="section py-20 sm:py-28 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground tracking-tight mb-6">
              <span className="block text-balance">
                {t("home.heroTitle", "Discover Amazing")}
              </span>
              <span className="block text-primary text-balance">
                {t("home.heroTitle2", "Products")}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 text-balance">
              {t(
                "home.heroDescription",
                "Shop the latest trends with fast, secure delivery and exceptional customer service.",
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to={`${prefix}/products`} className="btn-primary btn-lg">
                {t("home.shopNow", "Shop Now")}
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
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link to={`${prefix}/categories`} className="btn-outline btn-lg">
                {t("home.browseCategories", "Browse Categories")}
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative aspect-square max-w-md mx-auto lg:max-w-none">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-card rounded-3xl p-8 shadow-2xl hover-lift">
                <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10"></div>
    </section>
  );
}
