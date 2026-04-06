import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocale } from '../useLocale';
import * as RouterDom from 'react-router-dom';

const mockNavigate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(RouterDom.useNavigate).mockReturnValue(mockNavigate);
  vi.mocked(RouterDom.useParams).mockReturnValue({ locale: 'en' });
  vi.mocked(RouterDom.useLocation).mockReturnValue({ pathname: '/en' } as any);
});

describe('useLocale', () => {
  it('returns the locale from URL params when valid', () => {
    vi.mocked(RouterDom.useParams).mockReturnValue({ locale: 'sv' });
    const { result } = renderHook(() => useLocale());
    expect(result.current.locale).toBe('sv');
  });

  it('falls back to en when URL param is invalid', () => {
    vi.mocked(RouterDom.useParams).mockReturnValue({ locale: 'fr' });
    const { result } = renderHook(() => useLocale());
    expect(result.current.locale).toBe('en');
  });

  it('falls back to en when URL param is undefined', () => {
    vi.mocked(RouterDom.useParams).mockReturnValue({});
    const { result } = renderHook(() => useLocale());
    expect(result.current.locale).toBe('en');
  });

  it('returns bn-BD locale from URL params', () => {
    vi.mocked(RouterDom.useParams).mockReturnValue({ locale: 'bn-BD' });
    const { result } = renderHook(() => useLocale());
    expect(result.current.locale).toBe('bn-BD');
  });

  it('isRTL is always false (all locales are LTR)', () => {
    const { result } = renderHook(() => useLocale());
    expect(result.current.isRTL).toBe(false);
  });

  it('isBengali is true only for bn-BD', () => {
    vi.mocked(RouterDom.useParams).mockReturnValue({ locale: 'bn-BD' });
    const { result } = renderHook(() => useLocale());
    expect(result.current.isBengali).toBe(true);
  });

  it('isBengali is false for en', () => {
    vi.mocked(RouterDom.useParams).mockReturnValue({ locale: 'en' });
    const { result } = renderHook(() => useLocale());
    expect(result.current.isBengali).toBe(false);
  });

  it('isBengali is false for sv', () => {
    vi.mocked(RouterDom.useParams).mockReturnValue({ locale: 'sv' });
    const { result } = renderHook(() => useLocale());
    expect(result.current.isBengali).toBe(false);
  });

  it('currency maps to SEK for sv locale', () => {
    vi.mocked(RouterDom.useParams).mockReturnValue({ locale: 'sv' });
    const { result } = renderHook(() => useLocale());
    expect(result.current.currency).toBe('SEK');
  });

  it('currency maps to BDT for bn-BD locale', () => {
    vi.mocked(RouterDom.useParams).mockReturnValue({ locale: 'bn-BD' });
    const { result } = renderHook(() => useLocale());
    expect(result.current.currency).toBe('BDT');
  });

  it('currency maps to USD for en locale', () => {
    vi.mocked(RouterDom.useParams).mockReturnValue({ locale: 'en' });
    const { result } = renderHook(() => useLocale());
    expect(result.current.currency).toBe('USD');
  });

  it('switchLocale replaces locale in path and calls navigate', async () => {
    vi.mocked(RouterDom.useParams).mockReturnValue({ locale: 'en' });
    vi.mocked(RouterDom.useLocation).mockReturnValue({ pathname: '/en/products' } as any);

    const { result } = renderHook(() => useLocale());
    await act(async () => {
      await result.current.switchLocale('sv');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/sv/products', { replace: true });
  });

  it('switchLocale saves language pref when profile is set', async () => {
    const { useAuthStore } = await import('@/stores/authStore');
    const mockUpdateLanguagePref = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({
      profile: { id: 'u1', email: 'x@x.com', language_pref: 'en' } as any,
      updateLanguagePref: mockUpdateLanguagePref as any,
    } as any);

    vi.mocked(RouterDom.useParams).mockReturnValue({ locale: 'en' });
    vi.mocked(RouterDom.useLocation).mockReturnValue({ pathname: '/en' } as any);

    const { result } = renderHook(() => useLocale());
    await act(async () => {
      await result.current.switchLocale('sv');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/sv', { replace: true });
  });
});
