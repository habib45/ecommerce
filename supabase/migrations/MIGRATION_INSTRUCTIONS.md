# Supabase Database Migration & Demo Data Guide

## Overview

This guide explains how to apply database migrations and insert demo data to your Simbolos e-commerce platform.

**Project**: Simbolos E-Commerce Platform
**Database**: Supabase PostgreSQL
**Status**: Ready for migration
**Total Migrations**: 8 + Demo Data

---

## Automated Migration Script

A complete migration script with demo data has been generated:

- **File**: `migrations-with-demo-data.sql` (507 lines)
- **Location**: `/var/www/html/simbolos/migrations-with-demo-data.sql`
- **Contents**:
  - All 8 database migrations
  - Row-Level Security (RLS) policies
  - Demo data (categories, products, variants, pricing, discount codes)
  - FX rates for 3 currencies (USD, BDT, SEK)
  - Verification queries

---

## 🚀 How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended - Easiest)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **huyfncswshimvzwhomsx**
3. Navigate to: **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Copy the entire content from:
   ```
   /var/www/html/simbolos/migrations-with-demo-data.sql
   ```
6. Paste it into the SQL Editor
7. Click **"Run"** (or press `Ctrl+Enter`)
8. Wait for completion (should take 10-30 seconds)
9. Verify success by checking outputs at bottom

### Option 2: Using Supabase CLI (Advanced)

If you have the Supabase CLI installed:

```bash
cd /var/www/html/simbolos

# Install CLI (if needed)
npm install -g supabase

# Link your project
supabase link --project-ref huyfncswshimvzwhomsx

# Apply migrations
supabase db push
```

### Option 3: Direct PostgreSQL Connection

If you have `psql` configured with Supabase credentials:

```bash
PGPASSWORD="" psql \
  -h huyfncswshimvzwhomsx.supabase.co \
  -U postgres \
  -d postgres \
  -f migrations-with-demo-data.sql
```

---

## 📋 What Gets Created

### Tables (With Sample Data)

| Table              | Purpose                          | Demo Data                          |
| ------------------ | -------------------------------- | ---------------------------------- |
| `locales`          | Language support (EN, BN-BD, SV) | 3 locales                          |
| `profiles`         | User profiles + preferences      | Auto-created on signup             |
| `categories`       | Product categories               | 1 category (Electronics)           |
| `products`         | Product catalog                  | 1 product (Wireless Headphones)    |
| `product_variants` | Product variations + pricing     | 1 variant with USD/BDT/SEK pricing |
| `product_images`   | Product images                   | 1 demo image                       |
| `orders`           | Customer orders                  | Empty (ready for orders)           |
| `order_items`      | Items in orders                  | Empty                              |
| `carts`            | Shopping carts                   | Empty (real-time enabled)          |
| `cart_items`       | Items in carts                   | Empty (real-time enabled)          |
| `discount_codes`   | Promo codes                      | 1 (WELCOME10 - 10% off)            |
| `fx_rates`         | Exchange rates                   | USD/BDT/SEK rates                  |
| `content_blocks`   | CMS blocks (banners, etc)        | Empty                              |
| `email_templates`  | Email templates                  | Empty                              |
| `webhook_events`   | Stripe webhook tracking          | Empty                              |
| `return_requests`  | Return requests                  | Empty                              |
| `slug_redirects`   | URL redirects                    | Empty                              |

### Features Enabled

✅ **Row-Level Security (RLS)** - All tables protected
✅ **Multi-language Support** - English, Bengali, Swedish
✅ **Full-Text Search** - Per-locale search vectors
✅ **Real-time Updates** - Cart & returns sync
✅ **User Profiles** - Auto-created on signup
✅ **Stripe Integration** - Payment intent tracking
✅ **Multi-currency** - USD, BDT, SEK rates

---

## ✅ Verify Success

After running the migration, check the SQL Editor output for verification queries:

```
Locales       | count: 3
Categories    | count: 1
Products      | count: 1
Product Variants | count: 1
Discount Codes | count: 1
```

All should show `count: 1` or more (except initially empty tables).

---

## 🎨 Demo Data Details

### 1. Category Created

- **Name**: Electronics (Multi-language: English, Bengali, Swedish)
- **Slug**: electronics
- **Description**: Electronic devices and gadgets

### 2. Product Created

- **Name**: Premium Wireless Headphones
- **SKU**: SKU-WH-001
- **Price**:
  - USD: $299.99
  - BDT: ৳3,500,000
  - SEK: 2,990 kr
- **Stock**: 100 units
- **Image**: Professional product image from Unsplash

### 3. Discount Code

- **Code**: WELCOME10
- **Type**: 10% percentage discount
- **Min Order**: $10.00
- **Status**: Active

### 4. Exchange Rates

- USD ↔ BDT: 110
- USD ↔ SEK: 10
- Automatically used for price conversion


---

## 📊 Database Schema

### Key Design Patterns

**1. JSONB Translations**

```json
{
  "name": {
    "en": "Electronics",
    "bn-BD": "ইলেকট্রনিক্স",
    "sv": "Elektronik"
  }
}
```

**2. Multi-Currency Pricing**

```json
{
  "prices": {
    "USD": 29999,
    "BDT": 3500000,
    "SEK": 299000
  }
}
```

**3. Full-Text Search Indexes**

- `search_vector_en` - English (via `english` stemmer)
- `search_vector_sv` - Swedish (via `swedish` stemmer)
- `search_vector_bn` - Bengali (via `simple` config - no native Bengali stemmer)

---

## 🔐 Security

All tables have Row-Level Security (RLS) enabled:

- **Public Read**: `locales`, `categories`, `products`, `discount_codes`, `content_blocks`
- **User-Specific**: `profiles`, `orders`, `carts`, `return_requests`
- **Admin-Only**: `email_templates`, `products management`, `categories management`

User roles supported:

- `customer` - Default customer role
- `administrator` - Full access
- `store_manager` - Manage products & categories
- `support_agent` - Customer service role

---

## 🚨 Troubleshooting

### Error: "Table already exists"

**Solution**: The migration has already been applied. Skip to the next step or check in the Dashboard.

### Error: "Foreign key violation"

**Solution**: Don't mix demo data with existing data. Run migrations on a fresh database.

### Error: "Permission denied"

**Solution**: Ensure you're using the **service role key**, not the public key.

```
Service Role Key:
Public Key:
```

---

## 📝 Next Steps

1. **✅ Apply migrations** (this guide)
2. **View data**: Check Supabase Dashboard > Table Editor
3. **Test frontend**: Run the React app with `npm run dev`
4. **Configure Stripe** (if needed):
   - Add Stripe keys to `.env.local`
   - Test payment flow

---

## 📚 Database Files

Migration files (in order):

```
supabase/migrations/
├── 00001_create_locales.sql
├── 00002_create_profiles.sql
├── 00003_create_categories.sql
├── 00004_create_products.sql
├── 00005_create_search_triggers.sql
├── 00006_create_orders.sql
├── 00007_create_cart.sql
└── 00008_create_supporting_tables.sql
```

Combined script:

```
migrations-with-demo-data.sql ← USE THIS ONE
```

---

## 💡 Support

If migrations fail:

1. Check error message in Supabase SQL Editor
2. Review foreign key constraints
3. Ensure service role key is used
4. Try running migrations one section at a time

Questions? Check the Supabase documentation: https://supabase.com/docs

---

**Last Updated**: 2026-03-10
**Created By**: Claude Code
**Project**: Simbolos E-Commerce Platform
