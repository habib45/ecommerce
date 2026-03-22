import { loadStripe, type Stripe } from '@stripe/stripe-js';
import type { LocaleCode } from '@/types/domain';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;

if (!publishableKey) {
  throw new Error('Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
}

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * BRD §3.6.2 — Stripe Payment Element initialised with customer locale.
 * Stripe uses 'bn' for Bangla (NOT 'bn-BD'). See SKILL.md common mistakes.
 */
export function mapLocaleToStripe(locale: LocaleCode): string {
  return locale === 'bn-BD' ? 'bn' : locale;
}

export function getStripe(locale: LocaleCode = 'en'): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey, {
      locale: mapLocaleToStripe(locale) as 'en' | 'bn' | 'sv',
    });
  }
  return stripePromise;
}

/**
 * Force re-init with a different locale (e.g., when user switches language).
 */
export function resetStripe(): void {
  stripePromise = null;
}
