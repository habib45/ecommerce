# Feature Document — Mid-Range E-Commerce Platform

> **BRD**: BRD-ECOM-2026-001 v5.0 · **Version**: 1.0 · March 2026
> **Stack**: React JS · TypeScript · Supabase · Stripe · react-i18next

This document lists every feature by module, its implementation status, key files, and notes.

---

## Implementation Status Key
| Symbol | Meaning |
|---|---|
| ✅ | Implemented and working |
| 🔧 | Partially implemented / has known issues |
| 📋 | Planned — not yet built |
| ⚠️ | Implemented with known limitations |

---

## 1. Storefront — Product Discovery

### 1.1 Home Page
**Status:** ✅ Implemented
**File:** `src/pages/HomePage.tsx`

| Feature | Status | Notes |
|---|---|---|
| Hero banner slider (auto-rotating) | ✅ | 5-second interval; prev/next controls; dot pagination |
| Featured products carousel | ✅ | Admin-controlled via `is_featured` flag; shows up to 8 |
| All products grid (8 items) | ✅ | Paginated; sorted newest first |
| Multi-language support | ✅ | Reads locale from URL prefix |
| Multi-currency display | ✅ | USD, BDT, SEK, EUR |

**Components:** `src/components/home/HeroSlider.tsx`, `src/components/home/ProductCarousel.tsx`
**Hook:** `src/hooks/useProducts.ts` → `useFeaturedProducts()`

---

### 1.2 Product List Page
**Status:** ✅ Implemented
**File:** `src/pages/ProductListPage.tsx`

| Feature | Status | Notes |
|---|---|---|
| Grid layout with product cards | ✅ | Image, name, price, sale price |
| Sort: Newest / Name A-Z / Price Low-High / Price High-Low | ✅ | Client-side sorting for name field |
| Category filtering | ✅ | Uses RPC `get_products_by_category_slug()` |
| Pagination | ✅ | 8 items per page |
| Search bar integration | ✅ | Routes to search with query params |
| Locale-aware labels | ✅ | All UI strings via react-i18next |

**Component:** `src/components/product/ProductGrid.tsx`

---

### 1.3 Product Detail Page
**Status:** ✅ Implemented (fixed)
**File:** `src/pages/ProductDetailPage.tsx`

| Feature | Status | Notes |
|---|---|---|
| High-res image gallery | ✅ | First image = thumbnail |
| Product name & description | ✅ | Locale-resolved from JSONB |
| Category breadcrumb | ✅ | |
| Variant selector (size/color/etc.) | ✅ | Updates price and stock display |
| Multi-currency price display | ✅ | |
| Sale price display | ✅ | Shows crossed-out original price |
| Real-time stock indicator | ✅ | |
| Quantity selector (1–N) | ✅ | Validated against stock |
| Add to Cart button | ✅ | Stock-validated; toast on success |
| Related products section | ✅ | Same category; 4 products |

**Fix applied:** Product lookup changed from invalid JSONB operator syntax to RPC function `get_product_by_slug(p_slug, p_locale)`.

---

### 1.4 Search & Full-Text Search
**Status:** ✅ Implemented
**File:** `src/hooks/useProducts.ts`

| Feature | Status | Notes |
|---|---|---|
| English FTS | ✅ | `search_vector_en` — PostgreSQL 'english' config |
| Swedish FTS | ✅ | `search_vector_sv` — PostgreSQL 'swedish' config |
| Bangla FTS | ⚠️ | `search_vector_bn` — 'simple' config (no native dictionary) |
| Faceted category filters | ✅ | |
| Locale-aware search vectors | ✅ | Updated by PostgreSQL trigger |

**Note:** Bangla FTS quality is limited with 'simple' config. Algolia integration is planned for Phase 2.

---

## 2. Shopping Cart

### 2.1 Cart Store
**Status:** ✅ Implemented (fixed)
**File:** `src/stores/cartStore.ts`

| Feature | Status | Notes |
|---|---|---|
| Guest cart (localStorage) | ✅ | Minimal data stored; variant/product data fetched on load |
| Logged-in cart (Supabase) | ✅ | Persistent via `carts` / `cart_items` tables |
| Cart initialization on app load | ✅ | `useInitCart()` hook called in `App.tsx` |
| Guest cart merge on login | ✅ | `mergeGuestCart(userId)` called after auth |
| Real-time sync (Supabase Realtime) | ✅ | Cart updates sync across tabs |
| Stock validation before add | ✅ | |
| Quantity increment (merge existing) | ✅ | |
| Cart badge in header | ✅ | `getItemCount()` |

**Fix applied:** `cartStore.loadCart()` was never called — fixed by adding `useInitCart` hook in App.tsx.

---

### 2.2 Cart Page
**Status:** ✅ Implemented (fixed)
**File:** `src/pages/CartPage.tsx`

| Feature | Status | Notes |
|---|---|---|
| Product image | ✅ | |
| Product name (correct locale) | ✅ | |
| Variant name | ✅ | |
| Price with sale price | ✅ | |
| Quantity −/+ controls | ✅ | |
| Remove item | ✅ | |
| Subtotal calculation | ✅ | Sum(price × quantity) |
| Empty cart state | ✅ | |
| Continue Shopping link | ✅ | |
| Proceed to Checkout button | ✅ | |

**Fix applied:** Data access changed from `item.product` to `item.variant?.product` (correct nested structure).

---

## 3. Checkout & Payment

### 3.1 Checkout Flow
**Status:** ✅ Implemented
**File:** `src/pages/CheckoutPage.tsx`

| Feature | Status | Notes |
|---|---|---|
| Step 1: Shipping address | ✅ | Country-aware: Bangladesh / Sweden / International |
| Bangladesh address fields | ✅ | Division → District → Thana |
| Sweden address fields | ✅ | Postnummer + Postort |
| International address fields | ✅ | City + Postal Code |
| Step 2: Stripe Payment Element | ✅ | Locale-aware (`bn` for Bangla, `sv` for Swedish) |
| Currency-aware payment | ✅ | USD, BDT, SEK, EUR |
| Back to address step | ✅ | |
| Edge Function: create-payment-intent | ✅ | Secret key never exposed to frontend |

**Component:** `src/components/checkout/AddressForm.tsx`, `src/components/checkout/StripePayment.tsx`

---

### 3.2 Stripe Integration
**Status:** ✅ Core implemented · 📋 Webhooks need production testing

| Feature | Status | Notes |
|---|---|---|
| PaymentIntent creation (Edge Function) | ✅ | Idempotency key: `cart-{cartId}-{currency}` |
| Stripe Payment Element | ✅ | Client-side only; PCI-compliant |
| 3D Secure (3DS2) | ✅ | Handled by Stripe automatically |
| Klarna (BNPL — Sweden) | 📋 | Enabled via Stripe; needs production verification |
| Apple Pay / Google Pay | 📋 | Enabled via Stripe; needs production testing |
| Webhook: `payment_intent.succeeded` | ✅ | Order persisted; locale stored |
| Webhook: `payment_intent.payment_failed` | ✅ | |
| Webhook: `payment_intent.canceled` | ✅ | |
| Webhook: `charge.refunded` | ✅ | |
| Webhook: `charge.dispute.created` | ✅ | |
| Webhook signature verification | ✅ | Before any processing |
| Webhook idempotency | ✅ | `webhook_events.stripe_event_id PK` |
| Full refund (admin) | 📋 | Edge Function `issue-refund/` ready; admin UI pending |
| Partial refund (admin) | 📋 | Planned |
| Dispute dashboard | 📋 | Planned — Stripe Radar data |

---

### 3.3 Order Confirmation
**Status:** ✅ Implemented
**File:** `src/pages/OrderConfirmationPage.tsx`

| Feature | Status | Notes |
|---|---|---|
| Success message | ✅ | |
| Order ID display | ✅ | First 8 chars of PaymentIntent ID |
| Cart cleared on success | ✅ | `clearCart()` called |
| Continue Shopping link | ✅ | |
| Multi-language support | ✅ | |

---

## 4. User Accounts & Authentication

### 4.1 Authentication
**Status:** ✅ Implemented
**File:** `src/stores/authStore.ts`

| Feature | Status | Notes |
|---|---|---|
| Email/password sign-up | ✅ | Email verification required |
| Email/password sign-in | ✅ | |
| Google OAuth | 📋 | Configured in Supabase; UI integration needed |
| Apple OAuth | 📋 | Configured in Supabase; UI integration needed |
| JWT session management | ✅ | |
| Language preference stored on profile | ✅ | `profiles.language_pref` |
| Admin login | ✅ | Auth loading bug fixed — profile fetched before loading=false |

**Fix applied:** `authStore.initialize()` was setting `loading: false` before profile fetch — caused admin redirect loop. Now profile is fetched first.

---

### 4.2 User Profile
**Status:** 🔧 Partial

| Feature | Status | Notes |
|---|---|---|
| Language preference | ✅ | Saved to `profiles.language_pref` |
| Currency preference | ✅ | Saved to `profiles.currency_pref` |
| Address book | 📋 | Planned |
| Order history page | 📋 | Planned — RLS protects cross-user access |
| Invoice download | 📋 | Planned — PDF in preferred locale |

---

## 5. Order Management

### 5.1 Order Lifecycle
**Status:** ✅ Implemented

| Status | Description |
|---|---|
| `pending_payment` | Cart created; payment not confirmed |
| `payment_confirmed` | Stripe webhook received |
| `processing` | Being prepared |
| `partially_shipped` | Some items shipped |
| `shipped` | All items shipped |
| `delivered` | Customer confirmed delivery |
| `completed` | Order fully complete |
| `cancelled` | Cancelled by customer or admin |
| `refunded` | Payment refunded |
| `disputed` | Stripe dispute raised |

**Inventory atomicity:** Decrement runs as PostgreSQL stored procedure on `payment_intent.succeeded` — prevents race conditions.

---

## 6. Returns & Refunds

### 6.1 Return Flow
**Status:** ✅ Admin UI implemented · 📋 Customer-facing UI needed

| Feature | Status | Notes |
|---|---|---|
| Admin returns queue | ✅ | Real-time updates via Supabase Realtime |
| Return reason tracking | ✅ | Reason code + optional detail |
| Return status workflow | ✅ | requested → info_requested → approved → received → refunded / rejected |
| Customer return request UI | 📋 | Planned |
| Refund via Stripe (Edge Function) | 📋 | `issue-refund/` function ready; admin button pending |
| Customer notification email | 📋 | Planned |

---

## 7. Admin Dashboard

### 7.1 Dashboard Overview
**Status:** ✅ Implemented
**URL:** `/admin`

| Feature | Status | Notes |
|---|---|---|
| Total Orders count | ✅ | Live from Supabase |
| Total Products count | ✅ | Live from Supabase |
| Sidebar navigation | ✅ | Dashboard / Products / Orders / Translations / Returns |

---

### 7.2 Product Management
**Status:** ✅ Implemented
**URL:** `/admin/products` · `/admin/products/{id}` · `/admin/products/new`

| Feature | Status | Notes |
|---|---|---|
| Product listing table | ✅ | Name, translation %, active status, edit link |
| Create new product | ✅ | |
| Edit existing product | ✅ | |
| Multi-language editor (EN / বাংলা / Svenska tabs) | ✅ | Warning ⚠️ for missing translations |
| Translation completeness % | ✅ | Per locale |
| Product settings (category, type, active, featured) | ✅ | |
| Image URL management | ✅ | Up to 10 images; first = thumbnail |
| Variant management | ✅ | SKU, name, prices (USD/BDT/SEK/EUR), stock |
| Bulk import/export | 📋 | Planned |

---

### 7.3 Order Management
**Status:** ✅ Implemented
**URL:** `/admin/orders`

| Feature | Status | Notes |
|---|---|---|
| Orders listing table | ✅ | ID, customer, amount, locale, status badge, date |
| Status color coding | ✅ | Green/Blue/Yellow/Red |
| Currency-aware formatting | ✅ | |
| Locale column | ✅ | Shows which locale order came from |
| Sort: newest first | ✅ | |
| Order detail view | 📋 | Click to expand — planned |
| Edit order status from UI | 📋 | Planned |
| Note / comment system | 📋 | Planned |
| Bulk CSV export | 📋 | Planned |

---

### 7.4 Translation Management
**Status:** ✅ UI implemented · 📋 XLIFF backend partially implemented
**URL:** `/admin/translations`

| Feature | Status | Notes |
|---|---|---|
| Language tabs (Bangla / Swedish) | ✅ | |
| Completeness cards (Products / Categories / Email Templates) | ✅ | Shown as % |
| Export XLIFF button | ✅ | UI ready; calls Edge Function `export-xliff/` |
| Import XLIFF button | ✅ | UI ready; calls Edge Function `import-xliff/` |
| Auto-translate (DeepL) button | ⚠️ | UI ready; DeepL Edge Function integration is placeholder |
| Translation completeness alerts | 📋 | Admin notified when product published without Bangla/Swedish |

---

### 7.5 Hero Slides Management
**Status:** ✅ Implemented
**URL:** `/admin/hero-slides`
**Hook:** `src/hooks/useHeroSlides.ts`

| Feature | Status | Notes |
|---|---|---|
| Add new slide | ✅ | Image URL, title, description, CTA label/link, overlay, height, sort order |
| Image preview in form | ✅ | Live preview from URL input |
| Show/hide text on slide | ✅ | `show_text` toggle — hides title + description |
| Show/hide button on slide | ✅ | `show_button` toggle — hides CTA button |
| Activate/deactivate slide | ✅ | `is_active` toggle — removes slide from homepage |
| Delete slide | ✅ | Confirmation dialog before delete |
| Edit slide (inline) | ✅ | Expandable edit form per slide |
| Update button link | ✅ | `cta_href` field in edit form |
| Set slider height | ✅ | `height_px` field (200–900px range) |
| Sort order control | ✅ | Numeric `sort_order` — lower = first |
| Overlay color selector | ✅ | 7 preset gradient overlays |
| Quick toggles (Active/Text/Button) | ✅ | One-click toggle on each slide card |
| Storefront auto-refresh | ✅ | TanStack Query 5-min stale time; cache invalidated on mutation |

**Database table:** `hero_slides` (migration `00016_hero_slides.sql`)
**RLS:** Public can read `is_active = true` slides; admins have full access via `is_admin_user()`

---

### 7.6 Media Library
**Status:** ✅ Implemented
**URL:** `/admin/media`
**Hook:** `src/hooks/useMediaLibrary.ts`
**Components:** `src/components/admin/MediaFileGrid.tsx`, `src/pages/admin/MediaLibraryPage.tsx`

| Feature | Status | Notes |
|---|---|---|
| Browse files and folders | ✅ | Folder navigation with breadcrumb path |
| Upload files (multi-select) | ✅ | Any file type; max 50 MB per file |
| Image thumbnail preview | ✅ | Shown for jpg, jpeg, png, gif, webp, svg, avif |
| Copy public URL | ✅ | Copies to clipboard; toast confirmation |
| Create virtual folder | ✅ | Uploads `.keep` placeholder to simulate folder |
| Delete file | ✅ | Confirmation dialog; removes from Supabase Storage |
| Delete folder | ✅ | Lists all children and removes them recursively |
| Breadcrumb navigation | ✅ | Click any segment to jump to that level; Back button |
| File size display | ✅ | Human-readable (B / KB / MB) |
| Non-image file icons | ✅ | Shows file extension badge |

**Storage bucket:** `media` (created in migration `00017_storage_setup.sql`, public)
**RLS:** Public can read; admins (administrator, store_manager) can upload, update, delete
**Bucket limits:** 50 MB per file; all MIME types allowed
**Folder simulation:** Supabase Storage uses path prefixes — folders are created by uploading a `.keep` placeholder file which is hidden from the UI

---

### 7.7 Returns Management
**Status:** ✅ Implemented
**URL:** `/admin/returns`

| Feature | Status | Notes |
|---|---|---|
| Returns listing table | ✅ | Return ID, order ID, user ID, reason, status badge, items count, date |
| Status color coding | ✅ | Green/Yellow/Blue/Purple/Red |
| Sort: newest first | ✅ | |
| Approve / Reject buttons | 📋 | UI placeholders ready |
| Trigger refund from admin | 📋 | Needs `issue-refund/` Edge Function integration |
| Customer messaging | 📋 | Planned |

---

## 8. Multi-Currency

### 8.1 Currency Support
**Status:** ✅ Implemented

| Currency | Symbol | Locale | Notes |
|---|---|---|---|
| USD | $ | en | Stored in cents |
| BDT | ৳ | bn-BD | Stored in paisa |
| SEK | kr | sv | Stored in öre |
| EUR | € | (international) | Stored in cents |

| Feature | Status | Notes |
|---|---|---|
| Per-variant prices per currency | ✅ | JSONB `prices` column on `product_variants` |
| Auto-detection from locale | ✅ | |
| Manual currency switcher | 📋 | Planned |
| FX rate refresh cron (Edge Function) | ✅ | `fx-rate-refresh/` updates `fx_rates` table |
| `Intl.NumberFormat` with `latn` override | ✅ | Prevents Bengali digit display |

---

## 9. SEO & Discoverability

| Feature | Status | Notes |
|---|---|---|
| Locale-specific URL slugs | ✅ | `/en/products/blue-shirt`, `/sv/produkter/bla-skjorta` |
| Locale-specific meta title / description | ✅ | JSONB on products/categories |
| hreflang tags | 📋 | Required for launch — not yet implemented |
| Locale-specific XML sitemaps | 📋 | `/sitemap/en.xml`, `/sitemap/bn-BD.xml`, `/sitemap/sv.xml` |
| 301 redirects on slug change | ✅ | `slug_redirects` table managed by admin |

---

## 10. Notifications & Communications

### 10.1 Email Templates
**Status:** 📋 Infrastructure ready · Templates need content

| Email Type | Status | Notes |
|---|---|---|
| `order_confirmation` | 📋 | Template row needed per locale (en, bn-BD, sv) |
| `payment_failed` | 📋 | |
| `shipping_update` | 📋 | |
| `refund_issued` | 📋 | |
| `return_confirmation` | 📋 | |
| `password_reset` | 📋 | |
| `account_verification` | 📋 | |
| `abandoned_cart` | 📋 | Edge Function cron scheduled |

**Resolution logic:** Edge Function fetches `(type, locale)` → falls back to `(type, 'en')`.
**Bangla emails:** Unicode Bengali text; must be tested in Gmail, Outlook, Apple Mail.

---

## 11. Analytics & Reporting

| Feature | Status | Notes |
|---|---|---|
| Google Analytics 4 (via GTM) | 📋 | `locale` custom dimension on all events |
| GA4 e-commerce events | 📋 | `view_item`, `add_to_cart`, `purchase`, etc. |
| Meta Pixel | 📋 | Via GTM |
| TikTok Pixel | 📋 | Via GTM |
| Sales report by locale | 📋 | Admin native report — planned |
| Translation completeness report | 📋 | Planned |
| Search query report per locale | 📋 | Planned |

---

## 12. Phase 2 / Future Features

| Feature | Priority | Notes |
|---|---|---|
| Algolia search | P2 | Replaces PostgreSQL FTS for Bengali |
| Phrase / Crowdin TMS integration | P2 | XLIFF round-trip workflow |
| Google Places API (address autocomplete) | P2 | Localises address suggestions |
| Mailchimp / Klaviyo | P2 | Locale as contact property |
| ShipStation / EasyPost | P3 | Shipping label generation |
| Twilio SMS | P3 | SMS in customer's language |
| DeepL auto-translate (production) | P3 | Currently a UI placeholder |
| Order detail page (admin) | P2 | Full order view with line items |
| Customer address book | P2 | |
| PDF invoices | P2 | In customer's preferred language; Bengali uses Noto Sans Bengali |
| Quantity tiered pricing | P3 | |
| Stock low-alert notifications | P2 | |
| Admin 2FA enforcement | P2 | |
| Admin activity audit log | P2 | |

---

## 13. Known Bugs & Limitations Fixed

| Bug | Fix Applied | Files Changed |
|---|---|---|
| Admin redirect loop after login | Profile fetched before `loading=false` | `src/stores/authStore.ts` |
| Product detail page 404 | RPC function for JSONB slug lookup | `src/hooks/useProducts.ts` + migration `0002_add_product_lookup_functions.sql` |
| Cart page empty for guests | `loadCart()` now fetches variant/product data | `src/stores/cartStore.ts` |
| Cart page wrong data structure | `item.variant?.product` instead of `item.product` | `src/pages/CartPage.tsx` |
| Cart never initialized on app load | `useInitCart()` hook added to `App.tsx` | `src/hooks/useInitCart.ts`, `src/App.tsx` |
| Orders/Returns admin pages were stubs | Full implementation with real Supabase data | `src/pages/admin/OrdersPage.tsx`, `src/pages/admin/ReturnsPage.tsx` |

---

## 14. Acceptance Criteria — Launch Gates

### Multi-Language & i18n
- **AC-i18n-01:** `/bn-BD/products` renders with `lang="bn"`, Noto Sans Bengali loaded, all labels in Bangla
- **AC-i18n-02:** `/sv/produkter/bla-skjorta` displays product in Swedish; canonical URL is Swedish
- **AC-i18n-03:** Language switcher preserves page path without full reload
- **AC-i18n-04:** Logged-in user with `language_pref = 'bn-BD'` is redirected to `/bn-BD/`
- **AC-i18n-05:** Product missing Swedish translation shows English fallback; admin sees 'Missing translation'
- **AC-i18n-06:** Bangla search returns results using Bengali search vector
- **AC-i18n-07:** New locale row in `locales` table appears in language switcher within 60 seconds

### Bengali Script & Typography
- **AC-bn-01:** Bengali yuktakshar (conjunct consonants) render correctly in Chrome, Firefox, Safari, mobile Safari
- **AC-bn-02:** Noto Sans Bengali present in network requests on `/bn-BD/` homepage; absent on `/en/`
- **AC-bn-03:** All prices on Bangla storefront use Latin numerals (not Bengali digits)
- **AC-bn-04:** Lighthouse CLS score on Bangla homepage < 0.1

### SEO & hreflang
- **AC-seo-01:** `/en/products/blue-shirt` HTML includes hreflang tags for en, bn-BD, sv + x-default
- **AC-seo-02:** `/sitemap/bn-BD.xml` contains bn-BD locale URLs for all published products
- **AC-seo-03:** Changing Swedish slug creates 301 redirect from old to new URL within 60 seconds

### Localised Emails
- **AC-email-01:** Order on Bangla storefront sends confirmation with Bengali Unicode text; renders in Gmail and Apple Mail
- **AC-email-02:** User with `language_pref = 'sv'` receives order confirmation in Swedish
- **AC-email-03:** Guest order on Swedish storefront sends confirmation in Swedish

### Translation Management
- **AC-xliff-01:** Admin can export Bangla translations as XLIFF with correct source (English) and target segments
- **AC-xliff-02:** Admin can import translated Swedish XLIFF; storefront reflects changes within 60 seconds
- **AC-xliff-03:** Auto-translate calls DeepL; output marked as 'Machine-translated — needs review'

### Payment Processing
- **AC-pay-01:** Test payment on Bangla storefront completes; Stripe Payment Element rendered with `locale: 'bn'`
- **AC-pay-02:** Test payment on Swedish storefront completes; order confirmation email in Swedish
- **AC-pay-03:** Declined card on any locale shows error in active locale (Stripe built-in localisation)

### Auth & RLS
- **AC-rls-01:** Logged-in customer querying another customer's orders via Supabase API returns 0 rows
- **AC-rls-02:** Supabase `service_role` key absent from any client-side bundle across all three locale builds

### Performance
- **AC-perf-01:** Google Lighthouse performance score ≥ 80 on Bangla homepage with Noto Sans Bengali loaded
- **AC-perf-02:** Load test at 500 concurrent users across all locales; error rate < 0.1%; p95 API response < 300ms

---

_Last updated: March 2026 · Source: BRD-ECOM-2026-001 v5.0 + Implementation guides_
