import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://test.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('test-anon-key'),
    'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify('pk_test_placeholder'),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/lib/format.ts',
        'src/lib/translate.ts',
        'src/stores/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/types/domain.ts',
      ],
      exclude: [
        // Infrastructure/client files — fully mocked in tests; real code requires
        // live external services (Supabase, Stripe) and can't be unit tested.
        'src/lib/supabase/client.ts',
        'src/lib/stripe/client.ts',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
      ],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
