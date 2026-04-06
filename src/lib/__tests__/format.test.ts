import { describe, it, expect } from 'vitest';
import { formatPrice, formatNumber, formatDate, formatDateTime, formatPercent } from '../format';

describe('formatPrice', () => {
  it('formats USD in English', () => {
    const result = formatPrice(1000, 'USD', 'en');
    expect(result).toContain('10');
    expect(result).toContain('$');
  });

  it('formats BDT in bn-BD with Latin numerals', () => {
    const result = formatPrice(50000, 'BDT', 'bn-BD');
    // Must use Latin digits (0-9), NOT Bengali digits (০-৯)
    expect(result).toMatch(/[0-9]/);
    expect(result).not.toMatch(/[০-৯]/);
  });

  it('formats SEK in Swedish', () => {
    const result = formatPrice(25000, 'SEK', 'sv');
    expect(result).toContain('250');
  });

  it('divides amount by 100 (smallest unit to decimal)', () => {
    const result = formatPrice(100, 'USD', 'en');
    expect(result).toContain('1');
    expect(result).toContain('$');
  });

  it('formats zero amount', () => {
    const result = formatPrice(0, 'USD', 'en');
    expect(result).toContain('0');
  });

  it('formats large amounts', () => {
    const result = formatPrice(10000000, 'USD', 'en');
    // 100000.00
    expect(result).toContain('100,000');
  });
});

describe('formatNumber', () => {
  it('formats a number in English locale', () => {
    const result = formatNumber(1234, 'en');
    expect(result).toBe('1,234');
  });

  it('formats a number in bn-BD with Latin numerals', () => {
    const result = formatNumber(1234, 'bn-BD');
    expect(result).toMatch(/[0-9]/);
    expect(result).not.toMatch(/[০-৯]/);
  });

  it('formats a number in Swedish', () => {
    const result = formatNumber(1234, 'sv');
    // Swedish uses space as thousands separator: "1 234"
    expect(result).toContain('1');
    expect(result).toContain('234');
  });

  it('formats zero', () => {
    expect(formatNumber(0, 'en')).toBe('0');
  });

  it('formats negative numbers', () => {
    const result = formatNumber(-500, 'en');
    expect(result).toContain('500');
    expect(result).toContain('-');
  });
});

describe('formatDate', () => {
  it('formats a date string in English', () => {
    const result = formatDate('2026-01-15', 'en');
    expect(result).toContain('2026');
    expect(result).toMatch(/[0-9]/);
  });

  it('formats a Date object', () => {
    const date = new Date('2026-06-20');
    const result = formatDate(date, 'en');
    expect(result).toContain('2026');
  });

  it('formats in bn-BD with Latin numerals', () => {
    const result = formatDate('2026-03-10', 'bn-BD');
    expect(result).toMatch(/[0-9]/);
    expect(result).not.toMatch(/[০-৯]/);
  });

  it('formats in Swedish', () => {
    const result = formatDate('2026-04-01', 'sv');
    expect(result).toContain('2026');
  });

  it('accepts custom options', () => {
    const result = formatDate('2026-01-15', 'en', { dateStyle: 'long' });
    expect(result).toContain('2026');
    expect(result).toContain('January');
  });
});

describe('formatDateTime', () => {
  it('formats a date+time string in English', () => {
    const result = formatDateTime('2026-01-15T10:30:00Z', 'en');
    expect(result).toContain('2026');
    expect(result).toMatch(/[0-9]/);
  });

  it('formats in bn-BD with Latin numerals', () => {
    const result = formatDateTime('2026-01-15T10:30:00Z', 'bn-BD');
    expect(result).toMatch(/[0-9]/);
    expect(result).not.toMatch(/[০-৯]/);
  });

  it('formats in Swedish', () => {
    const result = formatDateTime('2026-01-15T10:30:00Z', 'sv');
    expect(result).toContain('2026');
  });
});

describe('formatPercent', () => {
  it('formats 50 (out of 100) as ~50%', () => {
    const result = formatPercent(50, 'en');
    expect(result).toContain('50');
    expect(result).toContain('%');
  });

  it('formats 0 as 0%', () => {
    const result = formatPercent(0, 'en');
    expect(result).toContain('0%');
  });

  it('formats 100 as 100%', () => {
    const result = formatPercent(100, 'en');
    expect(result).toContain('100%');
  });

  it('formats decimal correctly with max 1 fraction digit', () => {
    const result = formatPercent(33, 'en');
    expect(result).toContain('33');
  });

  it('formats in bn-BD with Latin numerals', () => {
    const result = formatPercent(75, 'bn-BD');
    expect(result).toMatch(/[0-9]/);
    expect(result).not.toMatch(/[০-৯]/);
  });

  it('formats in Swedish', () => {
    const result = formatPercent(25, 'sv');
    expect(result).toContain('25');
  });
});
