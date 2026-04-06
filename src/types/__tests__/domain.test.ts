import { describe, it, expect } from 'vitest';
import {
  LOCALE_CODES,
  DEFAULT_LOCALE,
  LOCALE_CURRENCY_MAP,
} from '../domain';

describe('LOCALE_CODES', () => {
  it('contains exactly three locales', () => {
    expect(LOCALE_CODES).toHaveLength(3);
  });

  it('includes en, bn-BD and sv', () => {
    expect(LOCALE_CODES).toContain('en');
    expect(LOCALE_CODES).toContain('bn-BD');
    expect(LOCALE_CODES).toContain('sv');
  });
});

describe('DEFAULT_LOCALE', () => {
  it('is English', () => {
    expect(DEFAULT_LOCALE).toBe('en');
  });
});

describe('LOCALE_CURRENCY_MAP', () => {
  it('maps en to USD', () => {
    expect(LOCALE_CURRENCY_MAP['en']).toBe('USD');
  });

  it('maps bn-BD to BDT', () => {
    expect(LOCALE_CURRENCY_MAP['bn-BD']).toBe('BDT');
  });

  it('maps sv to SEK', () => {
    expect(LOCALE_CURRENCY_MAP['sv']).toBe('SEK');
  });

  it('has an entry for every locale code', () => {
    for (const locale of LOCALE_CODES) {
      expect(LOCALE_CURRENCY_MAP[locale]).toBeDefined();
    }
  });
});
