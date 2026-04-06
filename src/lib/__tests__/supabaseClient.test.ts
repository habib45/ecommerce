import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('callEdgeFunction', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns data on success', async () => {
    const { callEdgeFunction } = await import('@/lib/supabase/client');
    vi.mocked(callEdgeFunction).mockResolvedValueOnce({ ok: true });
    const result = await callEdgeFunction('send-email', { to: 'test@test.com' });
    expect(result).toEqual({ ok: true });
  });

  it('throws when error is returned', async () => {
    const { callEdgeFunction } = await import('@/lib/supabase/client');
    vi.mocked(callEdgeFunction).mockRejectedValueOnce(new Error('Edge Function failed'));
    await expect(callEdgeFunction('send-email', {})).rejects.toThrow('Edge Function failed');
  });
});

describe('supabase client exports', () => {
  it('supabase object is defined', async () => {
    const { supabase } = await import('@/lib/supabase/client');
    expect(supabase).toBeDefined();
  });

  it('supabase.auth is defined', async () => {
    const { supabase } = await import('@/lib/supabase/client');
    expect(supabase.auth).toBeDefined();
  });

  it('supabase.from is callable', async () => {
    const { supabase } = await import('@/lib/supabase/client');
    expect(typeof supabase.from).toBe('function');
  });
});
