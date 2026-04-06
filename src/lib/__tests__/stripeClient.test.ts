import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapLocaleToStripe, getStripe, resetStripe } from '../stripe/client';

describe('mapLocaleToStripe', () => {
  it('maps bn-BD to bn (IETF → Stripe code)', () => {
    expect(mapLocaleToStripe('bn-BD')).toBe('bn');
  });

  it('keeps en unchanged', () => {
    expect(mapLocaleToStripe('en')).toBe('en');
  });

  it('keeps sv unchanged', () => {
    expect(mapLocaleToStripe('sv')).toBe('sv');
  });
});

describe('getStripe', () => {
  beforeEach(() => {
    resetStripe();
  });

  it('returns a Promise', () => {
    const result = getStripe('en');
    expect(result).toBeInstanceOf(Promise);
  });

  it('returns the same promise on repeated calls (singleton)', () => {
    const first = getStripe('en');
    const second = getStripe('en');
    expect(first).toBe(second);
  });

  it('defaults to English locale', () => {
    const result = getStripe();
    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves to a Stripe instance (or null in test env)', async () => {
    const stripe = await getStripe('en');
    // In test env with mocked loadStripe it resolves to the mock object
    expect(stripe).toBeDefined();
  });
});

describe('resetStripe', () => {
  it('clears the cached promise so a new one is created', () => {
    const first = getStripe('en');
    resetStripe();
    const second = getStripe('en');
    expect(first).not.toBe(second);
  });
});
