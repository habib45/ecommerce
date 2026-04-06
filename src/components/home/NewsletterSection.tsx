import { useState } from "react";
import { useTranslation } from "react-i18next";

export function NewsletterSection() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setEmail("");
  };

  return (
    <section className="bg-muted/30">
      <div className="section py-20 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            {t("home.newsletterTitle", "Stay in the Loop")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t("home.newsletterDesc", "Subscribe to get special offers, free giveaways, and new arrivals.")}
          </p>

          {isSubmitted ? (
            <div className="bg-success/10 border border-success/20 rounded-2xl p-6">
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-success mb-2">Successfully subscribed!</h3>
              <p className="text-sm text-muted-foreground">Thank you for joining our newsletter.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("home.newsletterPlaceholder", "Enter your email")}
                className="flex-1 h-12 px-4 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary h-12 px-8 whitespace-nowrap disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t("common.loading", "Loading...")}
                  </div>
                ) : (
                  t("home.newsletterButton", "Subscribe")
                )}
              </button>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            {t("home.newsletterPrivacy", "We respect your privacy. Unsubscribe at any time.")}
          </p>
        </div>
      </div>
    </section>
  );
}