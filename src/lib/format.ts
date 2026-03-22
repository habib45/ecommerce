import type { LocaleCode, CurrencyCode } from '@/types/domain';

/**
 * BRD §3.2.3 — numberingSystem: 'latn' prevents Bengali numerals on bn-BD.
 * Use this everywhere. NEVER bare Intl.NumberFormat.
 */
export function formatPrice(
  amount: number,
  currency: CurrencyCode,
  locale: LocaleCode,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    numberingSystem: 'latn',
  }).format(amount / 100);
}

/**
 * Format a number (non-currency) with Latin numerals.
 */
export function formatNumber(value: number, locale: LocaleCode): string {
  return new Intl.NumberFormat(locale, {
    numberingSystem: 'latn',
  }).format(value);
}

/**
 * BRD §3.2.3 — date/time via Intl with active locale.
 */
export function formatDate(
  date: string | Date,
  locale: LocaleCode,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    numberingSystem: 'latn',
    dateStyle: 'medium',
    ...options,
  }).format(d);
}

export function formatDateTime(
  date: string | Date,
  locale: LocaleCode,
): string {
  return formatDate(date, locale, { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Format percentage with Latin numerals.
 */
export function formatPercent(value: number, locale: LocaleCode): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    numberingSystem: 'latn',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
