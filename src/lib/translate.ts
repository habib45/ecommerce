import type { TranslationMap, LocaleCode } from '@/types/domain';

/**
 * Resolve a JSONB TranslationMap to a string for the active locale.
 * Falls back to English (BRD §3.2.3 — never render raw key to customer).
 */
export function t(map: TranslationMap | null | undefined, locale: LocaleCode): string {
  if (!map) return '';
  return map[locale] ?? map['en'] ?? '';
}

/**
 * Check whether a translation exists for a specific locale.
 * Used in admin UI for completeness indicators (BRD §3.2.4).
 */
export function hasTranslation(map: TranslationMap | null | undefined, locale: LocaleCode): boolean {
  if (!map) return false;
  const val = map[locale];
  return val !== undefined && val !== null && val.trim().length > 0;
}

/**
 * Calculate translation completeness for a set of TranslationMap fields.
 * Returns percentage (0–100).
 */
export function translationCompleteness(
  fields: (TranslationMap | null | undefined)[],
  locale: LocaleCode,
): number {
  if (fields.length === 0) return 100;
  const translated = fields.filter((f) => hasTranslation(f, locale)).length;
  return Math.round((translated / fields.length) * 100);
}
