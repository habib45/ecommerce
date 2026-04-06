import { useTranslation } from "react-i18next";

export function TrustSection() {
  const { t } = useTranslation();

  const trustItems = [
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      title: t("home.trustSecure", "Secure Payments"),
      description: t("home.trustSecureDesc", "SSL encrypted with Stripe"),
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      title: t("home.trustShipping", "Free Shipping"),
      description: t("home.trustShippingDesc", "On orders over $50"),
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
      title: t("home.trustReturns", "Easy Returns"),
      description: t("home.trustReturnsDesc", "30-day return policy"),
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: t("home.trustSupport", "24/7 Support"),
      description: t("home.trustSupportDesc", "Always here to help"),
    },
  ];

  return (
    <section className="py-8 sm:py-10">
      <div className="section border-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 lg:gap-6">
          {trustItems.map((item, index) => (
            <div key={index} className="trust-badge text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <div className="text-primary">{item.icon}</div>
              </div>
              <h3 className="font-semibold text-sm mb-1 leading-tight break-words px-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed break-words px-1">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
