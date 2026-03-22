import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { Profile, LocaleCode, CurrencyCode } from '@/types/domain';
import { changeLocale } from '@/i18n/config';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateLanguagePref: (locale: LocaleCode) => Promise<void>;
  updateCurrencyPref: (currency: CurrencyCode) => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    set({ session, user });

    // Fetch profile BEFORE setting loading to false (admin auth check depends on this)
    if (user) {
      await get().fetchProfile();
    }

    set({ loading: false, initialized: true });

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      set({ session, user });

      if (event === 'SIGNED_IN' && user) {
        await get().fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        set({ profile: null });
      }
    });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      set({ profile: data as Profile });
      // BRD §3.2.2 — apply language_pref on login
      changeLocale(data.language_pref as LocaleCode);
    }
  },

  signInWithEmail: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    if (error) throw error;
  },

  signUpWithEmail: async (email, password, fullName) => {
    set({ loading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    set({ loading: false });
    if (error) throw error;
  },

  // BRD §3.4 — OAuth social login: Google and Apple
  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  },

  signInWithApple: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    if (data) set({ profile: data as Profile });
  },

  // BRD §3.2.2 — locale preference saved to profiles.language_pref
  updateLanguagePref: async (locale) => {
    await get().updateProfile({ language_pref: locale });
    changeLocale(locale);
  },

  updateCurrencyPref: async (currency) => {
    await get().updateProfile({ currency_pref: currency });
  },
}));
