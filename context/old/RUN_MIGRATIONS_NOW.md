# 🚀 Quick Migration Guide - Copy & Paste Method

## The Problem

Direct database connections and CLI are not available in this environment. The easiest solution is to use the Supabase Dashboard SQL Editor.

## The Solution - 5 Simple Steps

### Step 1: Open Supabase Dashboard

Go to: https://app.supabase.com

### Step 2: Select Your Project

- Click on project: **huyfncswshimvzwhomsx**

### Step 3: Open SQL Editor

- Click **SQL Editor** in the left sidebar
- Click **"New Query"** button

### Step 4: Copy & Paste Migration Script

The complete migration script is ready at:

```
/var/www/html/simbolos/migrations-with-demo-data.sql
```

**In your terminal**, run this to copy the script:

```bash
cat /var/www/html/simbolos/migrations-with-demo-data.sql | pbcopy  # macOS
cat /var/www/html/simbolos/migrations-with-demo-data.sql | xclip -selection clipboard  # Linux
type /var/www/html/simbolos/migrations-with-demo-data.sql | clip  # Windows
```

Or simply open the file and copy its entire contents.

### Step 5: Execute

1. Paste the SQL into the Supabase SQL Editor
2. Click **"Run"** button (or press `Ctrl+Enter`)
3. Wait 10-30 seconds for completion
4. See green checkmarks ✅ confirming success

---

## ✅ Verify Success

After running the migration, you should see these results at the bottom of the SQL Editor:

```
Locales       | 3
Categories    | 1
Products      | 1
Product Variants | 1
Discount Codes | 1
```

If you see these counts, everything worked!

---

## 📋 What Gets Installed

✅ **Database Tables (8)**

- locales, profiles, categories, products, product_variants, product_images
- orders, order_items, carts, cart_items, discount_codes, fx_rates
- content_blocks, email_templates, webhook_events, return_requests, slug_redirects

✅ **Demo Data**

- 3 locales (English, Bengali, Swedish)
- 1 product category (Electronics)
- 1 product (Premium Wireless Headphones) with pricing
- 1 discount code (WELCOME10)
- Exchange rates (USD, BDT, SEK)

✅ **Features**

- Row-Level Security (RLS)
- Full-text search indexes
- Real-time updates for cart
- Multi-language support
- Multi-currency pricing

---

## 🎯 Quick Start After Migration

1. **Verify in Dashboard**
   - Go to Supabase Dashboard > **Table Editor**
   - You should see all new tables listed

2. **Test Frontend Connection**

   ```bash
   cd /var/www/html/simbolos
   npm run dev
   ```

   App will run on http://localhost:3000

3. **Browse Products**
   - Navigate to products page
   - Should see the demo "Wireless Headphones" product
   - Should support English, Bengali, and Swedish

---

## ⚠️ Troubleshooting

**Q: "Table already exists" error?**
A: Migration was already applied. You can ignore this.

**Q: "Foreign key violation" error?**
A: Try this fix - run this query first to clear existing data:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT CREATE ON SCHEMA public TO postgres, authenticated, service_role;
```

Then run the migration again.

**Q: Still having issues?**
A: Run migrations one section at a time (scroll through the SQL file and copy each `CREATE TABLE` section separately).

---

## 📂 Files Reference

**Migration File**: `/var/www/html/simbolos/migrations-with-demo-data.sql`
**Documentation**: `/var/www/html/simbolos/MIGRATION_INSTRUCTIONS.md`
**Your Project**: `https://app.supabase.com/project/huyfncswshimvzwhomsx`

---

## ✨ That's It!

Once the migration runs successfully:

- Your database is fully set up
- You have demo data to work with
- The frontend is ready to use
- You can start building features!

**Next**: Follow frontend setup in README.md

---

_Need help? Check the error message in the SQL Editor - it usually tells you exactly what went wrong._
