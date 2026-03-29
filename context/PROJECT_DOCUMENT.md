# Project Document — Mid-Range E-Commerce Platform

> **BRD**: BRD-ECOM-2026-001 v5.0 · **Status**: Awaiting Approval · March 2026
> **Classification**: Confidential — Internal Use Only

---

## 1. Executive Summary

A B2C e-commerce platform serving English, Bangla (Bengali), and Swedish markets from a single React JS codebase. Built on Supabase (PostgreSQL + Auth + Realtime + Edge Functions) with Stripe payment integration. The client previously had no dedicated storefront — only third-party marketplaces with no branding control or multi-language capability.

**Business Objectives:**
- Deliver a fully functional B2C storefront within 5 months
- Stripe-only PCI-DSS-compliant payment processing (cards, wallets, BNPL)
- Native language experience for Bangla and Swedish customers
- Self-service admin dashboard for product, order, and translation management
- Page load under 2 seconds and 99.9% uptime SLA

---

## 2. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend Framework | React JS + TypeScript (Vite) | SPA; Vite build tool |
| i18n Library | react-i18next | Locale routing, typed message keys, ICU plurals |
| UI & Styling | Tailwind CSS + shadcn/ui | Utility-first CSS; accessible typed components |
| Bengali Typography | Noto Sans Bengali (Google Fonts CDN) | Conditional load for bn-BD locale only |
| State Management | Zustand + TanStack Query | Cart/auth state; server-state caching for Supabase |
| Backend Platform | Supabase (Cloud — Pro plan) | PostgreSQL, Auth, Realtime, Edge Functions, Storage, Vault |
| Database | Supabase PostgreSQL + GIN indexes | JSONB translation columns; per-locale tsvector FTS |
| Search | Supabase Full-Text Search (Phase 1) | Per-locale tsvector columns; Algolia Phase 2 |
| Server-Side Logic | Supabase Edge Functions (Deno TypeScript) | Stripe API, webhooks, email dispatch, FX cron, GDPR |
| Authentication | Supabase Auth | JWT; email/password; Google and Apple OAuth |
| Payment | Stripe (Payment Intents API) | Payment Element with locale: 'bn' / 'sv' |
| Email Delivery | Resend (primary) / SendGrid (fallback) | Locale-resolved templates; called from Edge Functions |
| Frontend Hosting | Vercel (Pro plan) | Global Edge Network; CDN for static assets |
| Monitoring | Sentry (frontend + Edge Functions) | Error tracking with locale dimension |
| Translation Mgmt (P2) | Phrase or Crowdin | TMS supporting Bangla and Swedish XLIFF workflows |
| Machine Translation (P3) | DeepL API | Supports Bangla and Swedish; output marked as machine-translated |
| CI/CD | GitHub Actions | Lint, type-check, test, deploy; Supabase migrations in pipeline |
| Secrets Management | Supabase Vault + Vercel Environment Variables | Secret keys in Vault; public keys in Vercel env vars |

---

## 3. Architecture

```
Browser (React JS / TypeScript SPA)
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

### Frontend Folder Structure
```
src/
  components/       — UI components (display only; no business logic)
    home/           — HeroSlider, ProductCarousel
    product/        — ProductCard, ProductGrid
    admin/          — AdminLayout, admin-specific UI
  pages/            — Route-level page components
    admin/          — AdminDashboard, OrdersPage, ReturnsPage, TranslationsPage
  hooks/            — Reusable React hooks (useProducts, useInitCart, etc.)
  stores/           — Zustand state slices (authStore, cartStore, localeStore)
  services/         — API layer — one file per domain (product, order, cart)
  lib/              — Pure utilities (format.ts, translate.ts)
  types/
    domain.ts       — Hand-authored domain types (TranslationMap, Product, etc.)
    supabase.ts     — Auto-generated — DO NOT EDIT
  messages/         — i18n JSON files (en.json, bn-BD.json, sv.json)
```

### Supabase Storage Buckets
| Bucket | Public | Max File Size | Purpose |
|---|---|---|---|
| `media` | Yes | 50 MB | Admin-managed images and files for hero slides, product images, and general assets |

Storage policies use `is_admin_user()` from migration 00015.
Folders are virtual (path prefixes); `.keep` placeholder files are used to persist empty folders and are hidden in the admin UI.

### Edge Function Locations
```
supabase/functions/
  create-payment-intent/   — Stripe PaymentIntent creation
  stripe-webhook/          — Stripe webhook event handling
  send-email/              — Transactional emails via Resend
  issue-refund/            — Admin-triggered Stripe refunds
  fx-rate-refresh/         — Scheduled cron: BDT and SEK exchange rates
  export-xliff/            — Admin translation export
  import-xliff/            — Admin translation import
  gdpr-erasure/            — GDPR right-to-erasure
```

---

## 4. Multi-Language & i18n Design

### Supported Locales

| Locale Code | Language | Script | Direction | Notes |
|---|---|---|---|---|
| `en` | English | Latin | LTR | Default locale — required at all times |
| `bn-BD` | Bangla | Bengali | LTR | Bangladesh region; requires Noto Sans Bengali |
| `sv` | Swedish | Latin | LTR | Sweden; European number/date formatting |

### URL Structure
- Every customer-facing URL: `/en/`, `/bn-BD/`, `/sv/` prefix
- Root `/` → 302 redirect to detected locale
- Detection order: URL prefix → user `language_pref` → `locale` cookie → `Accept-Language` → `en`

### Stripe Locale Mapping (Critical)
```typescript
const stripeLocale = locale === 'bn-BD' ? 'bn' : locale;
// NEVER pass 'bn-BD' to Stripe — falls back to English silently
```

### Bengali Typography Rules (Mandatory)
- Font: Noto Sans Bengali via Google Fonts CDN `<link>` — only when `locale === 'bn-BD'`
- `font-display: swap` required to avoid invisible text
- Line-height minimum **1.7** for all Bengali body text (matra + shirorekha)
- `<html lang="bn">` — NOT `lang="bn-BD"` (ISO 639-1 required)
- `Intl.NumberFormat` ALWAYS with `{ numberingSystem: 'latn' }` to prevent Bengali digits

### Swedish Rules
- Standard Latin font stack — no extra font loading
- Number format: `1 234,50 kr` (space thousands separator, comma decimal)
- Currency: SEK (symbol `kr`)
- Klarna enabled via Stripe (dominant BNPL in Sweden)

---

## 5. Database Schema — Key Tables

| Table | Purpose | Key i18n Columns |
|---|---|---|
| `locales` | Active locales source of truth | `code`, `name`, `direction`, `is_active`, `is_default` |
| `profiles` | Extends auth.users | `language_pref FK locales.code`, `currency_pref`, `stripe_customer_id` |
| `products` | Product catalog | `name JSONB`, `description JSONB`, `slug JSONB`, `meta_title JSONB`, `meta_description JSONB`, `search_vector_en`, `search_vector_sv`, `search_vector_bn`, `is_featured BOOLEAN`, `is_active BOOLEAN` |
| `categories` | Category tree | Same JSONB pattern as products |
| `product_variants` | SKUs with pricing | `sku`, `name TEXT`, `prices JSONB`, `sale_prices JSONB`, `stock_quantity INT` |
| `product_images` | Product image gallery | `url`, `sort_order`, `product_id FK` |
| `content_blocks` | Banners, homepage sections | `name JSONB`, `body JSONB`, `cta_label JSONB`, `cta_url JSONB` |
| `email_templates` | One row per (type × locale) | `type`, `locale FK`, `subject TEXT`, `body_html TEXT` |
| `orders` | Purchase records | `locale FK locales.code`, `currency`, `stripe_payment_intent_id` |
| `order_items` | Line items per order | `product_variant_id FK`, `quantity`, `unit_price` |
| `carts` | Persistent user carts | `user_id FK auth.users` |
| `cart_items` | Items in cart | `cart_id FK`, `variant_id FK`, `quantity` |
| `returns` / `return_requests` | Return requests | `order_id FK`, `reason_code`, `status`, `items JSONB` |
| `webhook_events` | Stripe event log | `stripe_event_id PK` (idempotency) |
| `slug_redirects` | 301 redirects on slug change | `from_path`, `to_path`, `locale FK` |
| `fx_rates` | Exchange rates | `base_currency`, `target_currency`, `rate` |
| `ui_translations` | Admin-editable UI strings | `locale FK`, `namespace`, `key`, `value` |
| `hero_slides` | Homepage banner carousel | `image_url`, `title`, `description`, `cta_label`, `cta_href`, `show_text`, `show_button`, `is_active`, `height_px`, `sort_order`, `bg_overlay` |
| `discount_codes` | Promo codes | `code`, `discount_type`, `value`, `is_active` |

### RPC Functions (Supabase)
| Function | Purpose |
|---|---|
| `get_product_by_slug(p_slug, p_locale)` | Locale-specific slug lookup via JSONB |
| `get_products_by_category_slug(p_category_slug, p_locale, p_limit, p_offset)` | Category-filtered product listing with pagination |

### RLS Policy Pattern
```sql
-- Customer-owned data
create policy "own read" on orders for select using (auth.uid() = user_id);

-- Admin roles via JWT custom claim
create policy "admin all" on orders for all
  using ((auth.jwt() ->> 'role') in ('administrator', 'store_manager', 'support_agent'));

-- Public read
create policy "public read" on products for select using (is_active = true);
```

---

## 6. Security Rules

| Secret | Where It Lives | Where It Must NEVER Appear |
|---|---|---|
| `STRIPE_SECRET_KEY` | Supabase Vault | `src/` · Vercel env · `.env*` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Vault | `src/` · Vercel env · `.env*` |
| `STRIPE_WEBHOOK_SECRET` | Supabase Vault | `src/` · Vercel env · `.env*` |
| `RESEND_API_KEY` | Supabase Vault | `src/` · Vercel env · `.env*` |
| `DEEPL_API_KEY` | Supabase Vault | `src/` · Vercel env · `.env*` |

**Public variables** (Vite `.env`):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLISHABLE_KEY
```

---

## 7. Environment Strategy

| Environment | Supabase Project | Stripe Mode | Hosting | Access |
|---|---|---|---|---|
| Development | ecom-dev | Test mode | localhost:5173 | Engineering only |
| Staging | ecom-staging | Test mode | Vercel preview | Engineering + Product + QA |
| Production | ecom-prod | Live mode | Vercel production | Deploy pipeline only |

**Migration workflow:**
```bash
supabase migration new <description>
supabase db push                        # local
supabase db push --db-url $STAGING_URL  # staging first
supabase db push --db-url $PROD_URL     # production
supabase gen types typescript --project-id <id> > src/types/supabase.ts
```
Always: **Staging → Production**. Never production first.

---

## 8. Admin User Roles

| Role | Access Level |
|---|---|
| `administrator` | Full access — recommended for store owners |
| `store_manager` | Manage products and orders |
| `support_agent` | View-only access to orders |

**Create admin user:**
```bash
node scripts/create-admin-user.mjs admin@example.com "SecurePass123!" "Admin Name"
```

**Admin panel URL:** `/admin` (English only — no i18n of admin interface)

---

## 9. Performance Targets

| Metric | Target | Notes |
|---|---|---|
| Homepage LCP | < 2.0s | Bangla with Noto Sans Bengali loaded |
| Product page LCP | < 2.5s | Locale-specific JSONB content |
| Checkout page load | < 1.5s | Stripe Payment Element with locale param |
| CLS | < 0.1 | Bengali font swap must not cause layout shift |
| INP | < 200ms | Locale switcher + Bengali text input |
| Supabase query p95 | < 100ms | GIN-indexed JSONB queries |
| Edge Function cold start | < 500ms | |
| API response p95 | < 300ms | End-to-end |
| Concurrent users | 500 | Distributed across all locales |
| Order throughput | 200/min peak | Load tested at 2× expected peak |
| Platform uptime SLA | 99.9% | Supabase Pro + Vercel Pro |

---

## 10. Project Timeline

| Phase | Weeks | Status |
|---|---|---|
| Phase 1 — Discovery & Design | 1–3 | BRD finalised; schema designed; font strategy |
| Phase 2 — Core Platform Build | 4–8 | React JS scaffold, locale routing, Auth, en+sv catalog |
| Phase 3 — Bangla i18n Completion | 9–10 | bn-BD end-to-end, Bengali FTS, hreflang, email templates |
| Phase 4 — Payment Integration | 11–12 | Stripe Edge Functions, BDT/SEK checkout, webhooks, refunds |
| Phase 5 — Admin & Translation Mgmt | 13–15 | Full admin, XLIFF, completeness dashboard, notifications |
| Phase 6 — QA & Security | 16–18 | RLS audit, Playwright E2E, Bengali QA (4 browsers), pen test |
| Phase 7 — Staging & UAT | 19–20 | Client UAT, translation team review, go-live checklist |
| Phase 8 — Launch & Stabilisation | 21+ | Production deploy, 30-day hypercare, SEO review |

---

## 11. Stakeholders

| Stakeholder | Role | Primary Concern |
|---|---|---|
| Business Owner / Sponsor | Project Sponsor | ROI, international reach, go-live date |
| Product Manager | Requirements Owner | Feature completeness, localisation scope |
| Development Team | Technical Delivery | Architecture, Supabase schema, TypeScript safety, i18n |
| UX / Design Team | Experience Design | Usability across locales; Bengali script readability |
| Content / Translation Team | Localisation | Translation workflow, content coverage, XLIFF tooling |
| Finance / Accounting | Payment Compliance | PCI DSS, reconciliation, multi-currency reporting |
| Customer Support | Post-Launch Operations | Order management tools, localised communications |
| End Customers (B2C) | Platform Users | Native-language experience, purchase ease, security |

---

## 12. Active Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Bengali script renders as boxes in email clients | Medium | High | Test Litmus/Email on Acid before Phase 8 |
| Bengali font causes CLS regression | Medium | Medium | Lighthouse CI check on every bn-BD build |
| Bengali FTS quality poor ('simple' config) | Medium | Medium | Benchmark Phase 6; Algolia Phase 2 |
| Bangla translations not ready at launch | **High** | Medium | Track completeness dashboard weekly; DeepL fallback |
| JSONB queries slow at 50k SKUs | Medium | High | GIN indexes + read replica + load test Phase 6 |
| Stripe secret key in frontend bundle | Low | **Critical** | Bundle analysis in every CI run |
| RLS misconfiguration | Low | **Critical** | Automated RLS tests in CI; pen test Phase 6 |
| Machine-translated Bangla published unreviewed | Medium | Medium | Admin blocks publish until manually approved |
| i18n scope creep delays MVP | **High** | **High** | Scope frozen: 3 locales, no RTL, XLIFF only |

---

## 13. Compliance

- **GDPR** (Sweden/EU) — Right to erasure via `gdpr-erasure` Edge Function; consent banner in active locale
- **CCPA** — Data access and deletion flows
- **PCI DSS Level 3** — All card capture via Stripe Payment Element; secret key never in frontend
- **Data Processing Agreements** — Executed with Supabase, Stripe, Vercel, Resend, TMS providers before go-live
- **WCAG 2.1 Level AA** — All customer-facing pages; `lang="bn"` for Bangla; screen reader tested

---

_Last updated: March 2026 · Source: BRD-ECOM-2026-001 v5.0 + Implementation guides_
