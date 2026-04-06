import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ─── Supabase mock ────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase/client', () => {
  const mockSupabase = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/media/test.jpg' } }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    },
  };

  return {
    supabase: mockSupabase,
    callEdgeFunction: vi.fn(),
  };
});

// ─── Stripe mock ──────────────────────────────────────────────────────────────
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({
    elements: vi.fn(),
    confirmPayment: vi.fn(),
  }),
}));

// ─── i18n mock ────────────────────────────────────────────────────────────────
vi.mock('@/i18n/config', () => ({
  SUPPORTED_LOCALES: ['en', 'bn-BD', 'sv'],
  default: {
    changeLanguage: vi.fn(),
    t: vi.fn((key: string) => key),
  },
  changeLocale: vi.fn(),
}));

// ─── react-i18next mock ───────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      t: vi.fn((key: string) => key),
      language: 'en',
    },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── react-router-dom mock ────────────────────────────────────────────────────
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn().mockReturnValue({ locale: 'en' }),
    useNavigate: vi.fn().mockReturnValue(vi.fn()),
    useLocation: vi.fn().mockReturnValue({ pathname: '/en' }),
  };
});

// ─── localStorage mock ────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ─── crypto.randomUUID mock ───────────────────────────────────────────────────
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: vi.fn().mockReturnValue('test-uuid-1234') },
});
