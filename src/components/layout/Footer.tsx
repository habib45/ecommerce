import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';

// BRD §3.2.2 — language switcher also in footer
export function Footer() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const prefix = `/${locale}`;

  return (
    <footer className="bg-primary-900 text-white mt-auto">
      {/* Trust bar */}
      <div className="border-b border-white/10">
        <div className="section py-8 sm:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <TrustItem
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />}
              title={t('footer.trustFreeShipping', 'Free Shipping')}
              description={t('footer.trustFreeShippingDesc', 'On orders over $50')}
            />
            <TrustItem
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
              title={t('footer.trustSecure', 'Secure Payments')}
              description={t('footer.trustSecureDesc', 'SSL encrypted checkout')}
            />
            <TrustItem
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />}
              title={t('footer.trustReturns', 'Easy Returns')}
              description={t('footer.trustReturnsDesc', '30-day return policy')}
            />
            <TrustItem
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />}
              title={t('footer.trustSupport', '24/7 Support')}
              description={t('footer.trustSupportDesc', 'Dedicated help center')}
            />
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="section py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to={prefix} className="text-2xl font-bold tracking-tight">
              Simbolos
            </Link>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed max-w-xs">
              {t('footer.brandDescription', 'Your destination for quality products across English, Bangla, and Swedish markets.')}
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3 mt-5">
              <SocialLink href="#" label="Facebook">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
              </SocialLink>
              <SocialLink href="#" label="Instagram">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </SocialLink>
              <SocialLink href="#" label="Twitter">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </SocialLink>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              {t('footer.shop', 'Shop')}
            </h3>
            <ul className="space-y-3">
              <FooterLink to={`${prefix}/products`}>{t('nav.products')}</FooterLink>
              <FooterLink to={`${prefix}/categories`}>{t('nav.categories')}</FooterLink>
              <FooterLink to={`${prefix}/products?sort=newest`}>{t('footer.newArrivals', 'New Arrivals')}</FooterLink>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              {t('footer.company', 'Company')}
            </h3>
            <ul className="space-y-3">
              <FooterLink to={`${prefix}/about`}>{t('footer.about')}</FooterLink>
              <FooterLink to={`${prefix}/contact`}>{t('footer.contact')}</FooterLink>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              {t('footer.help', 'Help')}
            </h3>
            <ul className="space-y-3">
              <FooterLink to={`${prefix}/shipping`}>{t('footer.shipping')}</FooterLink>
              <FooterLink to={`${prefix}/returns`}>{t('footer.returns')}</FooterLink>
              <FooterLink to={`${prefix}/contact`}>{t('footer.faq', 'FAQ')}</FooterLink>
            </ul>
          </div>

          {/* Settings */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              {t('footer.settings', 'Settings')}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1.5">{t('common.language')}</p>
                <LanguageSwitcher />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">{t('common.currency')}</p>
                <CurrencySwitcher />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="section py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Simbolos. {t('footer.allRightsReserved')}.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link to={`${prefix}/terms`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to={`${prefix}/privacy`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to={`${prefix}/cookies`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              {t('footer.cookiePolicy')}
            </Link>
          </div>
          {/* Payment icons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">{t('footer.weAccept', 'We accept')}</span>
            <PaymentIcon label="Visa">
              <rect x="1" y="4" width="22" height="16" rx="2" fill="#1434CB" />
              <text x="12" y="14" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">VISA</text>
            </PaymentIcon>
            <PaymentIcon label="Mastercard">
              <rect x="1" y="4" width="22" height="16" rx="2" fill="#2D2D2D" />
              <circle cx="9" cy="12" r="4" fill="#EB001B" />
              <circle cx="15" cy="12" r="4" fill="#F79E1B" />
            </PaymentIcon>
            <PaymentIcon label="Stripe">
              <rect x="1" y="4" width="22" height="16" rx="2" fill="#635BFF" />
              <text x="12" y="14" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">Stripe</text>
            </PaymentIcon>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Sub-components ────────────────────────────────────────────── */

function TrustItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
        <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
    >
      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        {children}
      </svg>
    </a>
  );
}

function PaymentIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <svg className="w-8 h-6" viewBox="0 0 24 24" aria-label={label}>
      {children}
    </svg>
  );
}
