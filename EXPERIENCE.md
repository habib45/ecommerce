# EXPERIENCE.md — AI Tool Usage Report

> **Project**: Simbolos E-Commerce Platform
> **Date**: 2026-04-15
> **AI Tool**: Claude Code (Claude Opus 4.6) — Anthropic CLI for software engineering
> **Branch**: `vercel`

---

## 1. Project Overview

Simbolos is a mid-range B2C e-commerce platform built with **React 18 + TypeScript**, **Supabase** (auth, database, storage, edge functions), **Stripe** (payments), and **react-i18next** (three locales: English, Bangla, Swedish). The codebase spans **~17,700 lines of TypeScript** across 108 source files, with 19 pages, an admin panel, and full multi-currency/multi-language support.

---

## 2. How AI Was Used

### 2.1 Test Writing & Coverage Improvement

The primary AI-assisted task was **writing and improving unit tests** to achieve 100% code coverage across all hooks, stores, libraries, and type modules.

**Files created or significantly expanded with AI assistance:**

| Test File | Tests | What It Covers |
|---|---|---|
| `src/hooks/__tests__/useProducts.test.ts` | 34 | Product listing, search, categories, related products, price sorting |
| `src/hooks/__tests__/useStoreSettings.test.ts` | 16 | Delivery fee, free shipping threshold, service charge, announcement bar |
| `src/hooks/__tests__/useProductReviews.test.ts` | 18 | Product review CRUD, rating aggregation |
| `src/hooks/__tests__/useVisitorTracking.test.ts` | 2 | Page view tracking, cleanup on unmount |
| `src/hooks/__tests__/useContentBlocks.test.ts` | 12 | CMS content block fetching |
| `src/hooks/__tests__/useHeroSlides.test.ts` | 12 | Homepage hero slider management |
| `src/hooks/__tests__/useMediaLibrary.test.ts` | 28 | Media upload, folder management, deletion |
| `src/hooks/__tests__/useShippingAddresses.test.ts` | 23 | Address CRUD, default address selection |
| `src/hooks/__tests__/useSavedAddress.test.ts` | 6 | Saved address retrieval |
| `src/hooks/__tests__/useLocale.test.ts` | 13 | Locale detection, switching, currency mapping |
| `src/hooks/__tests__/useInitCart.test.ts` | 3 | Cart initialization from Supabase |
| `src/stores/__tests__/cartStore.test.ts` | 45 | Cart state management, subtotals, order summary |
| `src/stores/__tests__/authStore.test.ts` | 29 | Authentication state, sign-in/out, profile management |
| `src/lib/__tests__/format.test.ts` | 25 | Price formatting, date formatting, locale-aware numerals |
| `src/lib/__tests__/translate.test.ts` | — | Translation resolver (`t()` function) |
| `src/lib/__tests__/stripeClient.test.ts` | 8 | Stripe client initialization, locale mapping |
| `src/lib/__tests__/supabaseClient.test.ts` | 5 | Supabase client exports validation |
| `src/types/__tests__/domain.test.ts` | 7 | Type constants, locale codes, currency map |
| `src/i18n/__tests__/config.test.ts` | 4 | i18n configuration, supported locales |

**Total: 19 test files, 308 tests, 4,168 lines of test code**

### 2.2 Coverage Pragmas for Unreachable Branches

AI identified defensive code branches (null coalescing fallbacks, exhaustive switch defaults) that are structurally unreachable in production but lower coverage metrics. Rather than removing safety code, `/* v8 ignore next */` pragmas were added with explanatory comments:

```typescript
// Example from useProducts.ts
/* v8 ignore next 2 -- unreachable: sortBy is typed to 4 values, all handled above */
default:
  query = query.order('created_at', { ascending: false });
```

### 2.3 Bug Fixes Identified During Testing

- **`useProductSearch` error test**: The `rpc` mock was using `vi.mocked(supabase.rpc).mockResolvedValueOnce(...)` which didn't correctly simulate Supabase RPC error objects. AI fixed it to use a direct property assignment with the correct `{ message: string }` error shape.

### 2.4 Code Review & Architecture Guidance

AI was used to validate adherence to project architecture rules defined in `CLAUDE.md`:
- No direct API calls in components (all through `services/` and `hooks/`)
- No business logic in UI components
- Zustand store slices are modular (one per domain)
- All Supabase mocks follow the chainable builder pattern (`select().eq().single()`)

---

## 3. Final Coverage Results

```
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |     100 |      100 |     100 |     100 |
 hooks/            |     100 |      100 |     100 |     100 |
 lib/              |     100 |      100 |     100 |     100 |
 stores/           |     100 |      100 |     100 |     100 |
 types/            |     100 |      100 |     100 |     100 |
-------------------|---------|----------|---------|---------|
```

**100% coverage** across all statements, branches, functions, and lines for every tested module.

---

## 4. What Worked Well

1. **Rapid test scaffolding** — AI generated comprehensive test suites for complex hooks (e.g., `useProducts` with 34 tests covering sorting, filtering, pagination, search, and error branches) significantly faster than manual writing.

2. **Edge case discovery** — AI systematically identified untested branches: null coalescing fallbacks (`?? []`), missing currency keys, empty variant arrays, and error propagation paths that a human might overlook.

3. **Mock pattern consistency** — Every Supabase mock follows the same chainable pattern (`from().select().eq().single()`), making tests readable and maintainable. AI maintained this convention across all 19 test files.

4. **Architecture enforcement** — AI flagged when test patterns would violate project rules (e.g., testing Stripe calls in frontend code, or putting business logic assertions in component-level tests).

5. **Coverage pragma strategy** — Instead of writing brittle tests for structurally unreachable code, AI added targeted `v8 ignore` pragmas with clear justification comments, keeping the test suite meaningful rather than inflated.

---

## 5. What Required Human Judgment

1. **Deciding what to test** — AI could write tests for anything, but deciding which modules warranted 100% coverage vs. which could be deferred required human prioritization based on business criticality.

2. **Mock fidelity decisions** — Supabase's chainable API has many possible shapes. Humans decided when mocks should closely mirror real Supabase responses vs. when simplified mocks were acceptable.

3. **v8 ignore placement** — Deciding which branches are truly unreachable (safe to ignore) vs. which represent real risk required understanding the runtime type guarantees that TypeScript provides.

4. **Feature implementation** — All page-level features (hero slider, product detail, checkout flow, admin panel, visitor analytics, FAQ, etc.) were implemented by the development team. AI assisted with the testing layer, not the feature code itself.

5. **Supabase schema and RLS** — Database migrations, Row Level Security policies, and stored procedures were authored by the team based on domain requirements.

---

## 6. Lessons Learned

| Lesson | Detail |
|---|---|
| Start with architecture rules | Having `CLAUDE.md` with explicit rejection criteria meant AI never proposed code that violated project conventions |
| Test hooks, not components, first | Hooks contain the business logic; testing them gives the highest coverage-per-effort ratio |
| Mock at the boundary | Mocking `supabase.from()` at the module level kept tests fast (~4.2s for 308 tests) and isolated |
| Pragmas over fake tests | `v8 ignore` on truly unreachable branches is more honest than tests that exercise code through impossible states |
| AI needs project context | Without the BRD, feature doc, and architecture rules, AI output would have been generic; project-specific context made the output production-grade |

---

## 7. Tool & Environment

| Item | Value |
|---|---|
| AI Tool | Claude Code (CLI) — Claude Opus 4.6 |
| IDE | VS Code with Claude Code extension |
| Test Runner | Vitest 2.1.9 |
| Coverage | V8 (via Vitest) |
| Framework | React 18.3 + TypeScript 5.6 |
| State Management | Zustand 4.5 |
| Data Fetching | TanStack React Query |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Payments | Stripe |
| i18n | react-i18next (en, bn-BD, sv) |
| Hosting | Vercel Pro (frontend) + Supabase Pro (backend) |
