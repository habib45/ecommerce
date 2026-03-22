# E-Commerce Platform

**BRD-ECOM-2026-001** — Mid-Range E-Commerce with Stripe + Supabase + i18n (en / bn-BD / sv)

## Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Routing**: React Router v6 (locale-prefixed: `/:locale/...`)
- **i18n**: react-i18next with ICU plural rules
- **Backend**: Supabase (Auth, PostgreSQL, Realtime, Edge Functions, Storage)
- **Payments**: Stripe Payment Intents + Payment Element
- **Locales**: English (default), Bangla (bn-BD), Swedish (sv)

## Quick Start
```bash
npm install
cp .env.example .env        # fill in your Supabase + Stripe keys
npm run dev                  # http://localhost:3000
```

## Database Setup
```bash
supabase login
supabase link --project-ref <your-project-id>
supabase db push             # applies all migrations
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set RESEND_API_KEY=re_...
```

## Deploy Edge Functions
```bash
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
supabase functions deploy send-email
supabase functions deploy issue-refund
supabase functions deploy fx-rate-refresh
supabase functions deploy gdpr-erasure
```

## Project Structure
```
src/
├── App.tsx               # Providers (QueryClient, Helmet, Router)
├── router.tsx            # React Router v6 with /:locale prefix
├── types/domain.ts       # TranslationMap, LocaleCode, all entities
├── lib/
│   ├── supabase/client.ts  # anon key only — callEdgeFunction()
│   ├── stripe/client.ts    # publishable key + locale mapping
│   ├── format.ts           # formatPrice (latn numerals enforced)
│   └── translate.ts        # t() helper for JSONB TranslationMap
├── i18n/
│   ├── config.ts           # react-i18next setup
│   └── locales/{en,bn-BD,sv}.json
├── stores/
│   ├── authStore.ts        # Zustand — Supabase Auth + profile
│   └── cartStore.ts        # Zustand — persistent/guest cart
├── hooks/
│   ├── useLocale.ts        # Active locale from URL
│   └── useProducts.ts      # TanStack Query + locale FTS
├── components/
│   ├── layout/             # Header, Footer, LanguageSwitcher
│   ├── product/            # ProductCard, ProductGrid, Search
│   └── checkout/           # StripePayment, AddressForm
└── pages/
    ├── HomePage.tsx
    ├── ProductListPage.tsx
    ├── ProductDetailPage.tsx
    ├── CartPage.tsx
    ├── CheckoutPage.tsx
    ├── auth/               # Login, Register, Reset
    └── admin/              # Dashboard, Products, Translations

supabase/
├── migrations/             # 8 sequential SQL migrations
└── functions/              # 6 Edge Functions (Deno TS)
    ├── create-payment-intent/
    ├── stripe-webhook/
    ├── send-email/
    ├── issue-refund/
    ├── fx-rate-refresh/
    └── gdpr-erasure/
```

## Key Conventions (from SKILL.md)
- `TranslationMap<T>` for all JSONB translation columns
- `LocaleCode = 'en' | 'bn-BD' | 'sv'` — exhaustiveness checked
- `numberingSystem: 'latn'` on ALL `Intl.NumberFormat` calls
- Stripe locale: `'bn'` for Bangla (not `'bn-BD'`)
- Bengali body text: `line-height >= 1.7`
- Noto Sans Bengali loaded ONLY when locale is `bn-BD`
- Secret keys (Stripe, service_role) NEVER in frontend bundle
- GIN indexes on every JSONB translation column
