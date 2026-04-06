import { describe, it, expect } from 'vitest';
import { t, hasTranslation, translationCompleteness } from '../translate';
import type { TranslationMap } from '@/types/domain';

describe('t (translation resolver)', () => {
  const map: TranslationMap = {
    en: 'Blue Shirt',
    'bn-BD': 'নীল শার্ট',
    sv: 'Blå Skjorta',
  };

  it('returns the value for the active locale', () => {
    expect(t(map, 'en')).toBe('Blue Shirt');
    expect(t(map, 'bn-BD')).toBe('নীল শার্ট');
    expect(t(map, 'sv')).toBe('Blå Skjorta');
  });

  it('falls back to English when locale key is missing', () => {
    const partialMap: TranslationMap = { en: 'Fallback English' };
    expect(t(partialMap, 'bn-BD')).toBe('Fallback English');
    expect(t(partialMap, 'sv')).toBe('Fallback English');
  });

  it('returns empty string when map is null', () => {
    expect(t(null, 'en')).toBe('');
  });

  it('returns empty string when map is undefined', () => {
    expect(t(undefined, 'en')).toBe('');
  });

  it('returns empty string when both locale and English are missing', () => {
    const emptyMap: TranslationMap = {};
    expect(t(emptyMap, 'bn-BD')).toBe('');
  });

  it('returns empty string for empty map', () => {
    expect(t({}, 'en')).toBe('');
  });
});

describe('hasTranslation', () => {
  it('returns true when translation exists and is non-empty', () => {
    const map: TranslationMap = { en: 'Hello', 'bn-BD': 'হ্যালো' };
    expect(hasTranslation(map, 'en')).toBe(true);
    expect(hasTranslation(map, 'bn-BD')).toBe(true);
  });

  it('returns false when locale key is missing', () => {
    const map: TranslationMap = { en: 'Hello' };
    expect(hasTranslation(map, 'sv')).toBe(false);
  });

  it('returns false when value is empty string', () => {
    const map: TranslationMap = { en: '' };
    expect(hasTranslation(map, 'en')).toBe(false);
  });

  it('returns false when value is whitespace only', () => {
    const map: TranslationMap = { en: '   ' };
    expect(hasTranslation(map, 'en')).toBe(false);
  });

  it('returns false for null map', () => {
    expect(hasTranslation(null, 'en')).toBe(false);
  });

  it('returns false for undefined map', () => {
    expect(hasTranslation(undefined, 'en')).toBe(false);
  });
});

describe('translationCompleteness', () => {
  it('returns 100 for an empty fields array', () => {
    expect(translationCompleteness([], 'en')).toBe(100);
  });

  it('returns 100 when all fields are translated', () => {
    const fields: TranslationMap[] = [
      { en: 'Name', 'bn-BD': 'নাম', sv: 'Namn' },
      { en: 'Desc', 'bn-BD': 'বিবরণ', sv: 'Beskrivning' },
    ];
    expect(translationCompleteness(fields, 'bn-BD')).toBe(100);
    expect(translationCompleteness(fields, 'sv')).toBe(100);
  });

  it('returns 0 when no fields are translated for the locale', () => {
    const fields: TranslationMap[] = [
      { en: 'Name' },
      { en: 'Desc' },
    ];
    expect(translationCompleteness(fields, 'sv')).toBe(0);
  });

  it('returns 50 when half the fields are translated', () => {
    const fields: TranslationMap[] = [
      { en: 'Name', sv: 'Namn' },
      { en: 'Desc' },
    ];
    expect(translationCompleteness(fields, 'sv')).toBe(50);
  });

  it('handles null/undefined entries in the array', () => {
    const fields = [
      { en: 'Name', sv: 'Namn' },
      null,
      undefined,
    ] as (TranslationMap | null | undefined)[];
    // 1 out of 3 has sv translation
    expect(translationCompleteness(fields, 'sv')).toBe(33);
  });

  it('rounds to nearest integer', () => {
    const fields: TranslationMap[] = [
      { en: 'A', sv: 'Aa' },
      { en: 'B', sv: 'Bb' },
      { en: 'C' },
    ];
    // 2/3 = 0.666… → 67
    expect(translationCompleteness(fields, 'sv')).toBe(67);
  });
});
