import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

// Get the mocked supabase
const getSupabaseMock = async () => {
  const { supabase } = await import('@/lib/supabase/client');
  return supabase;
};

beforeEach(() => {
  // Reset store state between tests
  useAuthStore.setState({
    user: null,
    session: null,
    profile: null,
    loading: true,
    initialized: false,
  });
  vi.clearAllMocks();
});

describe('initial state', () => {
  it('has null user', () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('has null session', () => {
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('has null profile', () => {
    expect(useAuthStore.getState().profile).toBeNull();
  });

  it('loading is true initially', () => {
    expect(useAuthStore.getState().loading).toBe(true);
  });

  it('initialized is false initially', () => {
    expect(useAuthStore.getState().initialized).toBe(false);
  });
});

describe('initialize', () => {
  it('sets loading=false and initialized=true after init with no session', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
    } as any);

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().loading).toBe(false);
    expect(useAuthStore.getState().initialized).toBe(true);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('fetches profile when session has a user', async () => {
    const supabase = await getSupabaseMock();
    const mockUser = { id: 'user-123', email: 'test@test.com' };
    const mockSession = { user: mockUser, access_token: 'abc' };
    const mockProfile = {
      id: 'user-123',
      email: 'test@test.com',
      full_name: 'Test User',
      language_pref: 'en',
      currency_pref: 'USD',
      role: 'customer',
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
    } as any);

    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: mockProfile, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().profile).toEqual(mockProfile);
    expect(useAuthStore.getState().loading).toBe(false);
  });
});

describe('signInWithEmail', () => {
  it('calls supabase signInWithPassword', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: null,
    } as any);

    await useAuthStore.getState().signInWithEmail('test@test.com', 'password123');
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    });
  });

  it('throws when supabase returns an error', async () => {
    const supabase = await getSupabaseMock();
    const authError = new Error('Invalid credentials');
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: authError,
    } as any);

    await expect(
      useAuthStore.getState().signInWithEmail('bad@test.com', 'wrong'),
    ).rejects.toThrow('Invalid credentials');
  });

  it('sets loading=false even on error', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: new Error('fail'),
    } as any);

    try {
      await useAuthStore.getState().signInWithEmail('x@x.com', 'x');
    } catch {
      // expected
    }
    expect(useAuthStore.getState().loading).toBe(false);
  });
});

describe('signUpWithEmail', () => {
  it('calls supabase signUp with full_name in metadata', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: null,
    } as any);

    await useAuthStore.getState().signUpWithEmail('new@test.com', 'pass', 'John Doe');
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@test.com',
      password: 'pass',
      options: { data: { full_name: 'John Doe' } },
    });
  });

  it('throws when supabase returns an error', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: new Error('Email taken'),
    } as any);

    await expect(
      useAuthStore.getState().signUpWithEmail('taken@test.com', 'pass', 'Name'),
    ).rejects.toThrow('Email taken');
  });
});

describe('signInWithGoogle', () => {
  it('calls signInWithOAuth with google provider', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
      data: { provider: 'google', url: null },
      error: null,
    } as any);

    await useAuthStore.getState().signInWithGoogle();
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' }),
    );
  });

  it('throws when OAuth returns error', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
      data: { provider: 'google', url: null },
      error: new Error('OAuth failed'),
    } as any);

    await expect(useAuthStore.getState().signInWithGoogle()).rejects.toThrow('OAuth failed');
  });
});

describe('signInWithApple', () => {
  it('calls signInWithOAuth with apple provider', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
      data: { provider: 'apple', url: null },
      error: null,
    } as any);

    await useAuthStore.getState().signInWithApple();
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'apple' }),
    );
  });
});

describe('signOut', () => {
  it('clears user, session and profile', async () => {
    useAuthStore.setState({
      user: { id: 'u1' } as any,
      session: { access_token: 'tok' } as any,
      profile: { id: 'u1', email: 'x@x.com' } as any,
    });

    const supabase = await getSupabaseMock();
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null } as any);

    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().profile).toBeNull();
  });
});

describe('updateProfile', () => {
  it('does nothing when user is null', async () => {
    useAuthStore.setState({ user: null });
    await useAuthStore.getState().updateProfile({ full_name: 'Test' });
    // No throw, no state change
    expect(useAuthStore.getState().profile).toBeNull();
  });

  it('updates profile in store on success', async () => {
    const supabase = await getSupabaseMock();
    const mockUser = { id: 'user-1' };
    useAuthStore.setState({ user: mockUser as any, profile: null });

    const updatedProfile = { id: 'user-1', full_name: 'Updated Name', email: 'x@x.com' };
    const fromMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: updatedProfile, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    await useAuthStore.getState().updateProfile({ full_name: 'Updated Name' });
    expect(useAuthStore.getState().profile).toEqual(updatedProfile);
  });

  it('throws on error', async () => {
    const supabase = await getSupabaseMock();
    useAuthStore.setState({ user: { id: 'u1' } as any });

    const fromMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('DB error') }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    await expect(
      useAuthStore.getState().updateProfile({ full_name: 'X' }),
    ).rejects.toThrow('DB error');
  });
});

describe('updateLanguagePref', () => {
  it('calls updateProfile and changeLocale', async () => {
    const supabase = await getSupabaseMock();
    useAuthStore.setState({ user: { id: 'u1' } as any });

    const fromMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: { id: 'u1', language_pref: 'sv' },
        error: null,
      }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    const { changeLocale } = await import('@/i18n/config');
    await useAuthStore.getState().updateLanguagePref('sv');
    expect(changeLocale).toHaveBeenCalledWith('sv');
  });
});

describe('updateCurrencyPref', () => {
  it('calls updateProfile with currency_pref', async () => {
    const supabase = await getSupabaseMock();
    useAuthStore.setState({ user: { id: 'u1' } as any });

    const fromMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: { id: 'u1', currency_pref: 'SEK' },
        error: null,
      }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    await useAuthStore.getState().updateCurrencyPref('SEK');
    expect(fromMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ currency_pref: 'SEK' }),
    );
  });
});

describe('fetchProfile', () => {
  it('does nothing when user is null', async () => {
    useAuthStore.setState({ user: null });
    await useAuthStore.getState().fetchProfile();
    expect(useAuthStore.getState().profile).toBeNull();
  });

  it('sets profile when data returned', async () => {
    const supabase = await getSupabaseMock();
    const mockProfile = {
      id: 'u1',
      email: 'u@u.com',
      language_pref: 'en',
    };
    useAuthStore.setState({ user: { id: 'u1' } as any });

    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: mockProfile, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    await useAuthStore.getState().fetchProfile();
    expect(useAuthStore.getState().profile).toEqual(mockProfile);
  });
});

describe('signInWithApple', () => {
  it('throws when OAuth returns error', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
      data: { provider: 'apple', url: null },
      error: new Error('Apple OAuth failed'),
    } as any);
    await expect(useAuthStore.getState().signInWithApple()).rejects.toThrow('Apple OAuth failed');
  });
});

describe('updateProfile (data=null branch)', () => {
  it('does not update store when data is null after update', async () => {
    const supabase = await getSupabaseMock();
    useAuthStore.setState({ user: { id: 'u1' } as any, profile: null });

    const fromMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    await useAuthStore.getState().updateProfile({ full_name: 'X' });
    // profile stays null when data is null
    expect(useAuthStore.getState().profile).toBeNull();
  });
});

describe('fetchProfile (data=null branch)', () => {
  it('does not update profile when data is null', async () => {
    const supabase = await getSupabaseMock();
    useAuthStore.setState({ user: { id: 'u1' } as any, profile: null });

    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    await useAuthStore.getState().fetchProfile();
    expect(useAuthStore.getState().profile).toBeNull();
  });
});

describe('onAuthStateChange callback', () => {
  const captureCallback = async (supabase: Awaited<ReturnType<typeof getSupabaseMock>>) => {
    let cb: ((event: string, session: unknown) => Promise<void>) | null = null;
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: null } } as any);
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementationOnce((fn: any) => {
      cb = fn;
      return { data: { subscription: { unsubscribe: vi.fn() } } } as any;
    });
    await useAuthStore.getState().initialize();
    return cb!;
  };

  it('fetches profile on SIGNED_IN with user', async () => {
    const supabase = await getSupabaseMock();
    const cb = await captureCallback(supabase);

    const mockUser = { id: 'user-signin' };
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { id: 'user-signin', language_pref: 'en' }, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    await cb('SIGNED_IN', { user: mockUser });
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('does not fetch profile on SIGNED_IN without user', async () => {
    const supabase = await getSupabaseMock();
    const cb = await captureCallback(supabase);

    await cb('SIGNED_IN', { user: null });
    // No fetchProfile call — from() should not be called
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('clears profile on SIGNED_OUT event', async () => {
    const supabase = await getSupabaseMock();
    const cb = await captureCallback(supabase);

    useAuthStore.setState({ profile: { id: 'u1', email: 'x@x.com' } as any });
    await cb('SIGNED_OUT', null);
    expect(useAuthStore.getState().profile).toBeNull();
  });
});
