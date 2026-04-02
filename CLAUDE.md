# CLAUDE.md
# E-Commerce Platform — Project Memory

> **BRD**: BRD-ECOM-2026-001 v5.0 · **Status**: Awaiting Approval · March 2026
> **Stack**: React JS · React TypeScript · Supabase · Stripe · react-i18next
> **Locales**: `en` (default) · `bn-BD` (Bangla/Bengali) · `sv` (Swedish) — all LTR, no RTL

Read this file fully before writing any code, running any migration, or proposing
any architecture change. It is the single source of truth for decisions on this project.

## Companion Documents
- [context/PROJECT_DOCUMENT.md](context/PROJECT_DOCUMENT.md) — Full project brief: tech stack, architecture diagram, DB schema, RLS patterns, environment strategy, admin roles, performance targets, timeline, stakeholders, compliance, risks
- [context/FEATURE_DOCUMENT.md](context/FEATURE_DOCUMENT.md) — Feature-by-feature implementation status (✅/🔧/📋/⚠️), known bugs fixed, acceptance criteria, Phase 2 backlog

---

## 1. What This Project Is
Project name Simbolos, 
A mid-range B2C e-commerce platform serving English, Bangla, and Swedish markets
from a single codebase. The client had no dedicated storefront — only third-party
marketplaces with no branding control and no multi-language support.

**Hard constraints that shape every decision:**

| Constraint | Value |
|---|---|
| SKUs at launch | Up to 50,000 active |
| Order volume | Up to 10,000/month at launch |
| Locales | `en`, `bn-BD`, `sv` — all three ship simultaneously, no phased rollout |
| Payment processor | Stripe only — no alternatives in scope |
| Backend | Supabase only — no separate API server, no NestJS, no Express |
| Admin UI language | English only — no i18n of the admin interface |
| Timeline | MVP in 5 months |
| Hosting | Vercel Pro (frontend) + Supabase Pro (backend) |
| Compliance | GDPR (Sweden/EU), CCPA, PCI DSS Level 3 |

---

## 2. Architecture — The Non-Negotiable Map

```
Browser (React JS / React TypeScript)
  │
  ├── supabase-js (anon key) ──► Supabase DB       — RLS-enforced reads/writes
  ├── supabase-js (anon key) ──► Supabase Auth      — JWT, Google/Apple OAuth
  ├── supabase-js (anon key) ──► Supabase Realtime  — cart sync, live order feed
  │
  └── fetch()  ─────────────► Supabase Edge Functions (Deno TypeScript)
                                    │
                                    ├── SUPABASE_SERVICE_ROLE_KEY  (Vault)
                                    ├── STRIPE_SECRET_KEY           (Vault)
                                    ├── STRIPE_WEBHOOK_SECRET       (Vault)
                                    ├── RESEND_API_KEY              (Vault)
                                    ├── DEEPL_API_KEY               (Vault)
                                    └── FX_API_KEY                  (Vault)

Stripe ──── webhooks ────────► supabase/functions/stripe-webhook/
```

### Use `supabase-js` (anon key + RLS) for:
- Reading products, categories, locales, fx_rates (public data)
- Reading/writing the authenticated user's own cart, orders, profile, returns
- Auth: sign-in, sign-up, OAuth, token refresh
- Realtime subscriptions (cart sync, order status)

### Use a Supabase Edge Function for:
- **All** Stripe API calls (PaymentIntent, refunds, customer create)
- **All** outbound emails (Resend/SendGrid)
- Stripe webhook processing
- GDPR erasure and data anonymisation
- XLIFF translation import/export
- FX rate refresh (scheduled cron)
- Abandoned cart recovery emails (scheduled cron)
- Any write that requires `service_role` to bypass RLS

### Edge Function locations
```
supabase/functions/
  create-payment-intent/   ← all Stripe PaymentIntent creation
  stripe-webhook/          ← all webhook event handling
  send-email/              ← all transactional emails
  issue-refund/            ← admin-triggered Stripe refunds
  fx-rate-refresh/         ← scheduled cron (BDT, SEK rates)
  export-xliff/            ← admin translation export
  import-xliff/            ← admin translation import + cache revalidation
  gdpr-erasure/            ← GDPR right-to-erasure
```

---

## 3. Security Rules — Immediate Rejection on Violation

These are hard stops. Flag any violation before proceeding.

```
SECRET / KEY                    WHERE IT LIVES              WHERE IT MUST NEVER APPEAR
──────────────────────────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY               Supabase Vault              src/  |  Vercel env vars  |  .env*
SUPABASE_SERVICE_ROLE_KEY       Supabase Vault              src/  |  Vercel env vars  |  .env*
STRIPE_WEBHOOK_SECRET           Supabase Vault              src/  |  Vercel env vars  |  .env*
RESEND_API_KEY                  Supabase Vault              src/  |  Vercel env vars  |  .env*
DEEPL_API_KEY                   Supabase Vault              src/  |  Vercel env vars  |  .env*
```

Inside an Edge Function, access via:
```typescript
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
```
Set via CLI: `supabase secrets set STRIPE_SECRET_KEY=sk_live_...`

**Public variables** (safe to expose in browser):
```
VITE_SUPABASE_URL                 → Vercel env
VITE_SUPABASE_ANON_KEY            → Vercel env
VITE_STRIPE_PUBLISHABLE_KEY       → Vercel env
```

**CI enforcement**: Secret scanning on every commit + Vercel bundle analysis confirms
no secret key leaks into the React JS client bundle across all three locale builds.

---

## 4. TypeScript — Core Types (Use Everywhere)

```typescript
// src/types/domain.ts — never auto-generated, always hand-authored

// Locale union — TypeScript exhaustiveness catches unhandled locales at compile time
type LocaleCode = 'en' | 'bn-BD' | 'sv';

// All JSONB translation columns from Supabase are typed with this
type TranslationMap<T = string> = Partial<Record<LocaleCode, T>>;

// Canonical translation resolver — use everywhere, never inline
function t(map: TranslationMap, locale: LocaleCode): string {
  return map[locale] ?? map['en'] ?? '';
}

// Product shape (Supabase JSONB columns override the auto-generated Json type)
interface Product {
  id: string;
  status: 'draft' | 'active' | 'archived';
  name: TranslationMap;             // { en: 'Blue Shirt', 'bn-BD': 'নীল শার্ট', sv: 'Blå Skjorta' }
  description: TranslationMap;
  short_description: TranslationMap;
  slug: TranslationMap;
  meta_title: TranslationMap;
  meta_description: TranslationMap;
  search_vector_en?: unknown;       // tsvector — never read on frontend
  search_vector_sv?: unknown;
  search_vector_bn?: unknown;
}
```

**Rules:**
- `src/types/supabase.ts` is **auto-generated** — DO NOT EDIT. Run after every schema change:
  ```bash
  supabase gen types typescript --project-id <id> > src/types/supabase.ts
  ```
- Override generated `Json` JSONB columns with `TranslationMap` in `domain.ts`
- Adding a new locale **requires** updating `LocaleCode` first — compile errors will
  surface every unhandled case automatically
- `strict: true` in `tsconfig.json` — no exceptions
- No `any` unless explicitly justified with a comment
- No untested complex logic — Edge Functions need ≥70% unit test coverage

---

## 5. i18n Rules

### URL structure
- Every customer-facing URL has a locale prefix: `/en/`, `/bn-BD/`, `/sv/`
- Root `/` → 302 redirect to preferred locale (never serve content at root)
- Locale detection order: **URL prefix → `profiles.language_pref` → `locale` cookie → `Accept-Language` header → `en`**
- **Always** validate locale param from URL against `locales` table before any DB query
  — prevents injection via crafted locale codes

### UI strings — zero hard-coded text
- All static strings in `messages/en.json`, `messages/bn-BD.json`, `messages/sv.json`
- `messages/en.json` is the source of truth — TypeScript types generated from it
- A missing key reference = compile error, not a runtime missing-key string
- ICU plural format: both Bangla and Swedish have 2 forms (`one` / `other`) — same as English

### Product & catalog content (JSONB)
- All translatable fields stored as JSONB: `{ "en": "...", "bn-BD": "...", "sv": "..." }`
- Missing translation for active locale → silently fall back to `en` on storefront;
  show "Missing translation" badge in admin editor only
- Translation completeness shown as % per locale in admin (e.g., "Bangla: 73%")
- **Every new JSONB translation column needs a GIN index** — add it in the migration

### Bangla-specific rules (all mandatory)
```
Font            → Noto Sans Bengali via Google Fonts CDN <link> tag
                  ONLY when locale === 'bn-BD'. Never for en or sv.
                  font-display: swap required — no invisible text during load

Line-height     → minimum 1.7 for all Bangla body text
                  (matra diacritics + shirorekha stroke are clipped below 1.6)

lang attribute  → <html lang="bn">  NOT lang="bn-BD"
                  (browsers, Stripe, and screen readers expect ISO 639-1)

Numerals        → ALWAYS pass { numberingSystem: 'latn' } to Intl.NumberFormat
                  Intl.NumberFormat('bn-BD') produces ০১২৩ by default — not acceptable

FTS config      → search_vector_bn uses PostgreSQL 'simple' config
                  (no native Bengali dictionary exists; known limitation; Algolia is Phase 2)

Script shaping  → HarfBuzz (browser built-in) handles yuktakshar conjunct consonants
                  No custom shaping engine needed or in scope
```

### Swedish-specific rules
- Standard Latin font stack — no additional font loading
- Swedish number format: `1 234,50 kr` (space as thousands separator, comma as decimal)
- Currency: SEK (`kr` symbol)
- Klarna is the dominant BNPL option in Sweden — ensure it is enabled via Stripe

### FTS column map
| Column | PostgreSQL config | Rationale |
|---|---|---|
| `search_vector_en` | `'english'` | Native stemmer and stop-words |
| `search_vector_sv` | `'swedish'` | Native stemmer and stop-words |
| `search_vector_bn` | `'simple'` | No native Bengali dictionary |

All three columns updated automatically by a trigger on `products.name` / `products.description` change.

---

## 6. Stripe Rules

```typescript
// Stripe locale code mapping — Stripe uses different codes from IETF tags
const stripeLocale = locale === 'bn-BD' ? 'bn' : locale;
// 'bn-BD' → 'bn'    (NEVER pass 'bn-BD' to Stripe — it falls back to English silently)
// 'sv'    → 'sv'    (direct match)
// 'en'    → 'en'    (direct match)
```

- **Idempotency keys are mandatory** on every Stripe API call:
  - PaymentIntent: `cart-{cartId}-{currency}`
  - Full refund: `refund-{orderId}-full`
  - Partial refund: `refund-{orderId}-{amountCents}`
- Currency amounts always in **smallest unit** — cents (USD), paisa (BDT), öre (SEK)
- Webhook handler: verify `stripe-signature` header **before any other processing**
- Webhook idempotency: check `webhook_events.stripe_event_id` PK before handling;
  upsert the event row before processing; set `processed = true` after success
- Webhook handler returns **200 even on handler error** — log the error, never let
  Stripe trigger its own retry loop; use internal alerting for failures
- Webhooks to handle: `payment_intent.succeeded`, `payment_intent.payment_failed`,
  `payment_intent.canceled`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`
- Environment isolation: test-mode keys in dev/staging; live-mode keys in production **only**

---

## 7. Database & RLS

### RLS is always on — every user-scoped table

```sql
-- Canonical pattern for customer-owned data
create policy "own read" on orders
  for select using (auth.uid() = user_id);

-- Admin roles via JWT custom claim
create policy "admin all" on orders
  for all using ((auth.jwt() ->> 'role') in ('admin', 'manager', 'support'));

-- Public read (products, categories, locales, fx_rates)
create policy "public read" on products
  for select using (status = 'active');
```

Tables with RLS enabled: `profiles`, `orders`, `order_items`, `carts`, `returns`,
`products`, `categories`

Tables that are public read: `locales`, `fx_rates`, `categories`, `products` (active only)

### Inventory atomicity
Inventory decrements on payment confirmation run as a **PostgreSQL stored procedure**
— not application-level code — to prevent race conditions at concurrent checkout.

### GIN indexes — mandatory for all JSONB translation columns
```sql
-- Add for every new translatable JSONB column
create index idx_products_name on products using gin(name);
create index idx_products_slug on products using gin(slug);
-- etc.
```

### Migration workflow
```bash
supabase migration new <description>    # create
supabase db push                        # apply local
supabase db push --db-url $STAGING_URL  # apply staging first
supabase db push --db-url $PROD_URL     # then production
supabase gen types typescript --project-id <id> > src/types/supabase.ts
```
Migrations applied: **Staging → Production** always. Never Production first.

---

## 8. Code Review Standards

These standards apply to every PR. Reject anything that violates them.

### Automatic rejection conditions
| Condition | Action |
|---|---|
| Hardcoded secret or API key anywhere | Immediate rejection |
| `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` in `src/` | Immediate rejection |
| Stripe API call in frontend code | Immediate rejection |
| Business logic inside a UI component | Reject |
| Architecture rule violation | Reject |
| Component over 300 lines | Reject — split it |
| Critical feature with no tests | Reject |
| Duplicate logic added | Reject |
| Hard-coded UI string (not in messages/) | Reject |
| `Intl.NumberFormat` without `numberingSystem: 'latn'` | Reject |
| Bangla body text with `line-height` below `1.7` | Reject |
| `locale: 'bn-BD'` passed to Stripe | Reject — must be `'bn'` |
| New JSONB column without GIN index in same migration | Reject |
| Direct `fetch`/`axios` in a component (use services/) | Reject |
| `any` type without justification comment | Reject |
| `console.log` in production code | Reject |

### Separation of concerns
```
UI components     → display logic only; no business logic, no direct API calls
services/         → all API calls; one service per domain (product, order, cart, etc.)
store/            → all state mutations (Zustand slices, modular)
supabase/functions/ → all privileged server-side logic
hooks/            → reusable React logic (data fetching, side effects)
lib/              → pure utilities (format.ts, translate.ts, etc.)
```

### Logic & maintainability
- Functions must be small and single-purpose
- Use early returns over nested conditionals
- No magic numbers — extract to named constants
- Reusable logic extracted to hooks or services before it appears twice
- Meaningful names: `formatPrice()`, `resolveLocale()`, not `doStuff()`, `handleData()`

### Performance
- Avoid unnecessary re-renders — use `useMemo`, `useCallback`, `React.memo` where needed
- Large lists (product grids, order history) use virtualisation
- No heavy computation inside render functions
- Pagination required for any dataset that can exceed 50 items
- API calls deduplicated — TanStack Query handles caching; do not duplicate fetches

### State management (Zustand)
- Store slices are modular — one slice per domain (cart, auth, locale)
- No direct state mutation — always use store actions
- Async logic in store actions, not in components
- Selectors used to prevent unnecessary re-renders

### Testing
- Edge Functions: minimum 70% unit test coverage
- Critical user flows (checkout `en`, checkout `bn-BD`) covered by Playwright E2E
- Business logic in hooks and services has unit tests
- No untested complex logic ships to production

### The senior review questions
Before approving, ask:
- Can a new developer understand this in 6 months?
- Will this survive 3+ years and 10x traffic?
- Is it production-grade?
- Does it align with the architecture above?
- Is it secure, typed, tested, and readable?

If any answer is no → request changes.

---

## 9. Performance Targets

All targets apply to all three locales. Bangla (`bn-BD`) must be measured with
Noto Sans Bengali font loaded — not with fallback fonts substituted.

| Metric | Target | Notes |
|---|---|---|
| Homepage LCP | < 2.0s | Bangla with Noto Sans Bengali loaded |
| Product page LCP | < 2.5s | Locale-specific JSONB content loaded |
| Checkout page load | < 1.5s | Stripe Payment Element with locale param |
| CLS | < 0.1 | Bengali font swap must not shift layout |
| INP | < 200ms | Locale switcher + Bengali text input |
| Supabase query p95 | < 100ms | GIN-indexed JSONB queries |
| Edge Function cold start | < 500ms | |
| API response p95 | < 300ms | End-to-end |
| Concurrent users | 500 | Distributed across all locales |
| Order throughput | 200/min peak | Load tested at 2× expected peak |

---

## 10. Data Schema — Key Tables

| Table | Purpose | Key i18n columns |
|---|---|---|
| `locales` | Source of truth for active locales | `code`, `name`, `direction`, `is_active`, `is_default` |
| `profiles` | Extends `auth.users` | `language_pref FK locales.code`, `currency_pref`, `stripe_customer_id` |
| `products` | Product catalog | `name JSONB`, `description JSONB`, `slug JSONB`, `meta_title JSONB`, `meta_description JSONB`, `search_vector_en`, `search_vector_sv`, `search_vector_bn` |
| `categories` | Category tree | Same JSONB pattern as products |
| `content_blocks` | Banners, homepage sections | `name JSONB`, `body JSONB`, `cta_label JSONB`, `cta_url JSONB` |
| `email_templates` | One row per (type × locale) | `type`, `locale FK`, `subject`, `body_html` |
| `orders` | Purchase records | `locale FK locales.code`, `currency`, `stripe_payment_intent_id` |
| `webhook_events` | Stripe event log | `stripe_event_id PK` (idempotency key) |
| `slug_redirects` | 301s when slugs change | `from_path`, `to_path`, `locale FK` |
| `fx_rates` | Exchange rates | `base_currency`, `target_currency`, `rate` — refreshed by cron |
| `ui_translations` | Admin-editable strings | `locale FK`, `namespace`, `key`, `value` |
| `hero_slides` | Homepage banner carousel | `image_url`, `title`, `description`, `cta_label`, `cta_href`, `show_text BOOL`, `show_button BOOL`, `is_active BOOL`, `height_px INT`, `sort_order INT`, `bg_overlay` |

**Supabase Storage** — bucket `media` (public, 50 MB limit):
- Admin manages via `/admin/media` — upload, create folders, copy URL, delete
- RLS: public read; admin write (uses `is_admin_user()`)
- Folders are path prefixes; `.keep` placeholders persist empty directories (hidden in UI)
- Public URLs: `{SUPABASE_URL}/storage/v1/object/public/media/{path}`

---

## 11. Email Templates

- One row per `(type, locale)` in `email_templates`
- Types at launch: `order_confirmation`, `payment_failed`, `shipping_update`,
  `refund_issued`, `return_confirmation`, `password_reset`, `account_verification`,
  `abandoned_cart`
- Edge Function resolution: fetch by `(type, locale)` → fall back to `(type, 'en')` if missing
- Bangla emails: Unicode Bengali text in subject and body; tested in Gmail, Outlook, Apple Mail
- Guest orders: use `orders.locale` (locale active at time of purchase) not user profile

---

## 12. Integrations — Priority Reference

| Integration | Priority | Called from | i18n note |
|---|---|---|---|
| Stripe Payments + Webhooks | P0 Critical | Edge Function | locale `'bn'` / `'sv'` at Element init |
| Supabase Auth | P0 Critical | Frontend | `language_pref` on profiles |
| react-i18next | P0 Critical | React JS build + runtime | Core i18n library |
| Supabase Realtime | P1 High | Frontend | Cart sync, order feed |
| Resend / SendGrid | P1 High | Edge Function | Locale-resolved template |
| Google Analytics 4 | P1 High | Frontend (GTM) | `locale` custom dimension |
| Stripe Tax | P1 High | Edge Function | BDT and SEK supported |
| Open Exchange Rates | P2 Medium | Edge Function cron | BDT + SEK rates |
| Phrase / Crowdin (TMS) | P2 Medium | Edge Function | XLIFF export/import |
| Google Places API | P2 Medium | Frontend | Localises suggestions |
| Mailchimp / Klaviyo | P2 Medium | Edge Function | Locale as contact property |
| DeepL API | P3 Low | Edge Function | Auto-translate; mark for review |
| Twilio SMS | P3 Low | Edge Function | SMS in customer's language |
| ShipStation / EasyPost | P3 Low | Edge Function | Phase 2 |

---

## 13. Acceptance Criteria — Quick Reference

These are the launch gates. Every AC must pass before go-live.

**i18n**: AC-i18n-01 through AC-i18n-07 (locale routing, fallbacks, cache revalidation)
**Bengali typography**: AC-bn-01 through AC-bn-04 (ligatures, font load, Latin numerals, CLS)
**SEO**: AC-seo-01 through AC-seo-03 (hreflang, sitemaps, 301 redirects)
**Emails**: AC-email-01 through AC-email-03 (Bangla Unicode, Swedish templates, guest orders)
**Translation mgmt**: AC-xliff-01 through AC-xliff-03 (export, import, DeepL marking)
**Payment**: AC-pay-01 through AC-pay-03 (bn Stripe locale, sv email, localised errors)
**RLS**: AC-rls-01 (cross-user data isolation), AC-rls-02 (no service_role key in bundle)
**Performance**: AC-perf-01 (Lighthouse ≥80 on Bangla), AC-perf-02 (500 concurrent, p95 <300ms)

---


## 14. Risks — Active Watch Items

| Risk | Likelihood | Impact | Owner action |
|---|---|---|---|
| Bengali script renders as boxes in email clients | Medium | High | Test Litmus/Email on Acid before Phase 8 |
| Bengali font causes CLS regression | Medium | Medium | Lighthouse CI check on every bn-BD build |
| Bengali FTS quality poor ('simple' config) | Medium | Medium | Benchmark Phase 6; Algolia ready for Phase 2 |
| Bangla translations not ready at launch | **High** | Medium | Track completeness dashboard weekly; DeepL fallback |
| JSONB queries slow at 50k SKUs | Medium | High | GIN indexes + read replica + load test at Phase 6 |
| hreflang misconfigured | Medium | High | Playwright hreflang check in CI from Phase 3 |
| Stripe secret key in frontend bundle | Low | **Critical** | Bundle analysis in every CI run |
| RLS misconfiguration | Low | **Critical** | Automated RLS tests in CI; pen test Phase 6 |
| Machine-translated Bangla published unreviewed | Medium | Medium | Admin setting blocks publish until reviewed |
| i18n scope creep delays MVP | **High** | **High** | Scope frozen: 3 locales, no RTL, XLIFF only |

---

## 15. Common Mistakes — Never Do These

```
MISTAKE                                          FIX
──────────────────────────────────────────────────────────────────────────────
Stripe API call in src/ (frontend)               Move to supabase/functions/
service_role key in src/ or Vercel env           Supabase Vault only
Intl.NumberFormat('bn-BD') without latn          Add numberingSystem: 'latn'
line-height < 1.7 on Bangla body text            Set minimum 1.7
locale: 'bn-BD' in loadStripe()                  Use locale: 'bn'
New JSONB column without GIN index               Add GIN index in same migration
Editing src/types/supabase.ts by hand            Run supabase gen types instead
Adding a locale without updating LocaleCode      Update type first; let TS guide you
supabase gen types not run after migration       Run it; commit the output
Hard-coded UI string in a component              Add to messages/en.json first
Business logic inside a React component          Move to services/ or hooks/
API call directly in a component                 Move to services/
No idempotency key on Stripe API call            Add idempotencyKey option
Webhook returns 4xx/5xx on handler error         Return 200; log error internally
Missing GIN index on JSONB translation column    Add in migration — required for p95 <100ms
console.log() in committed code                  Remove before PR
```

---

## 16. Glossary — Frequently Used Terms

| Term | Meaning |
|---|---|
| `bn-BD` | IETF tag for Bangla (Bangladesh); locale code used throughout; NOT the same as Stripe's `'bn'` |
| `sv` | IETF tag for Swedish; locale code |
| `TranslationMap<T>` | `Partial<Record<LocaleCode, T>>` — the type for all JSONB translation columns |
| `LocaleCode` | `'en' \| 'bn-BD' \| 'sv'` — union type; update when adding a locale |
| `t()` | `(map, locale) => map[locale] ?? map['en'] ?? ''` — canonical translation resolver |
| GIN index | Generalised Inverted Index; required on every JSONB translation column |
| tsvector | PostgreSQL FTS pre-processed column; one per language per indexed table |
| shirorekha | Bengali headline stroke; reason `line-height: 1.7` is the minimum |
| matra | Bengali vowel diacritic; clips at `line-height` below ~1.6 |
| yuktakshar | Bengali conjunct consonant ligature; rendered by HarfBuzz automatically |
| HarfBuzz | Browser text-shaping engine; handles Bengali ligatures natively |
| latn | `numberingSystem: 'latn'` — forces ASCII digits `0–9` in `Intl.NumberFormat` |
| SWR | Stale-While-Revalidate; TanStack Query cache strategy used to revalidate content |
| Edge Function | Supabase Deno serverless function; home of all privileged operations |
| Supabase Vault | Encrypted secret store inside Supabase; accessed via `Deno.env.get()` |
| XLIFF | Translation exchange file format; used for agency/TMS workflows |
| BDT | Bangladeshi Taka — currency for bn-BD market; symbol ৳ |
| SEK | Swedish Krona — currency for sv market; symbol kr |
| RLS | Row Level Security — PostgreSQL per-row access control; always enabled |
| PITR | Point-in-Time Recovery; Supabase Pro; RPO = 5 minutes |
| PgBouncer | Connection pooler built into Supabase; handles traffic spikes |
