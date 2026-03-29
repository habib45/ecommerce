# Featured Products Setup Guide

## ✅ What Was Changed

I've set up the system to show **admin-selected featured products** in the home page carousel section.

### Changes Made:

#### 1. **Database Migration**

- File: `supabase/migrations/0001_add_featured_products.sql`
- Adds `is_featured` BOOLEAN column to products table
- Creates an index for fast featured product queries

#### 2. **New Hook**

- File: `src/hooks/useProducts.ts`
- New `useFeaturedProducts()` hook fetches only featured products
- Shows up to 8 featured products, sorted by newest first

#### 3. **Updated Home Page**

- File: `src/pages/HomePage.tsx`
- Imports `useFeaturedProducts`
- Featured Products section only shows if there are featured products
- Admin can mark products as featured in the admin panel

---

## 🗄️ How to Run the Migration

### Step 1: Apply the Migration in Supabase

1. Go to **Supabase Dashboard**: https://app.supabase.com
2. Select your project: **huyfncswshimvzwhomsx**
3. Click **SQL Editor** → **New Query**
4. Copy and paste this SQL:

```sql
-- Add is_featured column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Create an index for faster featured product queries
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;
```

5. Click **Run** ▶️

### Step 2: Test It Works

The migration should complete in seconds. You'll see ✅ green checkmark.

---

## 🎯 How Admins Mark Products as Featured

### Option 1: SQL (Quick Method)

```sql
-- Mark a product as featured by ID
UPDATE public.products
SET is_featured = true
WHERE id = 'product-uuid-here';

-- Mark multiple products as featured by slug
UPDATE public.products
SET is_featured = true
WHERE slug->>'en' LIKE 'premium-product-%';
```

### Option 2: Admin Panel (When Built)

You can later build an admin interface that includes:

- Checkbox for `is_featured` on each product
- Bulk action to mark multiple products as featured
- Preview of featured products section

---

## 📱 Home Page Behavior

**Featured Products Section:**

- ✅ Only shows if there are featured products (featured count > 0)
- ✅ Displays up to 8 featured products
- ✅ Shows in a carousel (scrollable slider)
- ✅ Displays **above** the all-products grid

**If No Featured Products:**

- The carousel section is hidden
- Only the all-products grid shows below the hero slider

---

## 🚀 Test It Live

### Mark Some Products as Featured:

```sql
-- Mark your demo product as featured
UPDATE public.products
SET is_featured = true
WHERE slug->>'en' = 'premium-wireless-headphones';

-- If you have 100 products, mark some as featured
UPDATE public.products
SET is_featured = true
WHERE slug->>'en' LIKE 'premium-product-%' AND id IN (
  SELECT id FROM public.products
  WHERE slug->>'en' LIKE 'premium-product-%'
  LIMIT 8
);
```

### View Your Home Page:

1. Restart dev server:

   ```bash
   npm run dev
   ```

2. Visit: `http://localhost:3002/`

3. You should see:
   - Hero Slider (rotating banners)
   - **Featured Products Carousel** (with your marked products)
   - All Products Grid (below)

---

## Database Schema

```sql
-- New column in products table
is_featured BOOLEAN NOT NULL DEFAULT false

-- New index for performance
idx_products_is_featured ON public.products(is_featured)
```

---

## 📊 Query Examples

### Get Featured Products Count:

```sql
SELECT COUNT(*) FROM public.products WHERE is_featured = true;
```

### Get Featured Products with Details:

```sql
SELECT
  id, name->>'en' as name, slug->>'en' as slug, is_featured
FROM public.products
WHERE is_featured = true
ORDER BY created_at DESC;
```

### Unmark a Product as Featured:

```sql
UPDATE public.products
SET is_featured = false
WHERE id = 'product-uuid-here';
```

---

## 🎨 Customization

### Change Number of Featured Products Shown

In `src/pages/HomePage.tsx`:

```tsx
// Change the number (currently 8)
const { data: featuredProducts } = useFeaturedProducts(locale, 12); // Shows 12 instead
```

### Change the Carousel Breakpoints

In `src/components/home/ProductCarousel.tsx`:

```tsx
breakpoints={{
  320: { slidesPerView: 1 },
  640: { slidesPerView: 2 },
  1024: { slidesPerView: 3 }, // Adjust these numbers
  1280: { slidesPerView: 4 },
}}
```

---

## ✅ Summary

✅ Migration file created
✅ `useFeaturedProducts` hook added
✅ HomePage updated to show featured products
✅ Admin can mark products as featured via SQL
✅ Carousel only shows if there are featured products
✅ Fully responsive design

**Your home page is now ready to showcase featured products!** 🎉
