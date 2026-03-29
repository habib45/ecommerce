# 🚀 Run Migrations in 3 Easy Steps

Your database migrations have been split into **3 smaller parts** to avoid timeouts.

## 📋 The Three Migration Files

```
migrations-part-1.sql  (134 lines) - Core tables: locales, categories, products
migrations-part-2.sql  (72 lines)  - Orders and shopping cart
migrations-part-3.sql  (137 lines) - Supporting tables and demo data
```

---

## ✅ Step-by-Step Instructions

### **Step 1: Run Part 1 (Core Tables)**

1. Open: https://app.supabase.com
2. Select project: **huyfncswshimvzwhomsx**
3. Click **SQL Editor** → **New Query**
4. Copy entire file: `/var/www/html/simbolos/migrations-part-1.sql`
5. Paste into editor
6. Click **Run** ▶️
7. **Wait for completion** (should see ✅ green checkmark)

**This creates:**

- ✅ `locales` (3 languages)
- ✅ `profiles` (user profiles)
- ✅ `categories` (with demo category)
- ✅ `products` (with demo product)
- ✅ `product_variants` (pricing)
- ✅ `product_images` (images)

---

### **Step 2: Run Part 2 (Orders & Cart)**

1. Still in SQL Editor
2. Click **New Query** again (fresh query)
3. Copy entire file: `/var/www/html/simbolos/migrations-part-2.sql`
4. Paste and click **Run** ▶️
5. Wait for completion

**This creates:**

- ✅ `orders` (customer orders)
- ✅ `order_items` (items in orders)
- ✅ `carts` (shopping carts)
- ✅ `cart_items` (items in carts)

---

### **Step 3: Run Part 3 (Supporting Tables)**

1. Click **New Query** again
2. Copy entire file: `/var/www/html/simbolos/migrations-part-3.sql`
3. Paste and click **Run** ▶️
4. Wait for results

**This creates:**

- ✅ `email_templates`
- ✅ `webhook_events`
- ✅ `fx_rates` (with demo rates)
- ✅ `content_blocks`
- ✅ `discount_codes` (WELCOME10 code)
- ✅ `slug_redirects`
- ✅ `return_requests`

**At the bottom, you'll see verification counts:**

```
Locales       | 3
Categories    | 1
Products      | 1
Product Variants | 1
Discount Codes | 1
FX Rates      | 4
```

---

## ✨ Demo Data Included

After completing all 3 parts:

✅ **3 Languages**

- English (en)
- Bengali (bn-BD)
- Swedish (sv)

✅ **1 Product Category**

- Electronics

✅ **1 Demo Product**

- Premium Wireless Headphones
- Price: $299.99 USD / ৳3,500,000 BDT / 2,990 SEK
- Stock: 100 units
- Image: Professional product image

✅ **1 Discount Code**

- Code: `WELCOME10`
- Type: 10% percentage discount
- Min Order: $10.00

✅ **Exchange Rates**

- USD ↔ BDT (110)
- USD ↔ SEK (10)

---

## 🎯 What Happens Next

Once all 3 parts are done:

1. **Your database is fully set up** ✅
2. **Frontend can connect** ✅
3. **Demo data is ready** ✅
4. **You can start selling!** ✅

---

## 🔍 How to Verify

After each part:

1. Go to Supabase Dashboard
2. Click **Table Editor** (left sidebar)
3. You should see new tables appearing

After all 3 parts, you'll see:

- locales
- profiles
- categories
- products
- product_variants
- product_images
- orders
- order_items
- carts
- cart_items
- email_templates
- webhook_events
- fx_rates
- content_blocks
- discount_codes
- slug_redirects
- return_requests
- return_items

---

## ⚠️ Common Issues

**Q: Got a "constraint violation" error?**
A: This means the table already exists. Just move to the next part.

**Q: Got a "relation does not exist" error?**
A: You need to run the parts in order. Start with Part 1.

**Q: The query timed out?**
A: Refresh the page and try again. Or run just one table at a time.

---

## 📝 Files Reference

- **Part 1**: `/var/www/html/simbolos/migrations-part-1.sql`
- **Part 2**: `/var/www/html/simbolos/migrations-part-2.sql`
- **Part 3**: `/var/www/html/simbolos/migrations-part-3.sql`
- **Original**: `/var/www/html/simbolos/migrations-with-demo-data.sql` (all-in-one)
- **Documentation**: `/var/www/html/simbolos/MIGRATION_INSTRUCTIONS.md`

---

## ✅ That's It!

**3 copy-pastes = Complete database setup!**

Your app at http://localhost:3002 will automatically connect once migrations are done.

---

_Need help? Check the error message in SQL Editor - it usually tells you exactly what went wrong._
