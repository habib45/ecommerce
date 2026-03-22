# Product Management - Complete Guide

## Product Editor Features

The Product Editor in `/admin/products` now has comprehensive features for managing products, images, variants, and pricing.

### What You Can Do

#### 1. Basic Product Information

**Product Name** (Required)

- Multi-language support (English, Bangla, Swedish)
- Shown on product page and listings

**Slug** (URL-friendly identifier)

- Auto-generated from product name (recommendation: `my-product-name`)
- Used in product links: `/en/products/my-product-name`
- Must be unique per language

**Short Description**

- Brief description for product listings
- Character limit for preview truncation

**Full Description**

- Detailed information shown on product detail page
- Can be as long as needed
- Supports HTML (in future versions)

**Meta Title & Description** (SEO)

- Used for search engine listings
- Meta Title: appears as page title in browser
- Meta Description: appears in search results under link

---

#### 2. Product Settings

**Category**

- Select which category product belongs to
- Affects product listing filters
- Optional (can have no category)

**Product Type**

- `Physical` - Ships to customers (default for your store)
- `Digital` - Delivered via email/download

**🌟 Featured Product**

- ✅ Marks product to show in homepage carousel
- Limited slots available, so choose bestsellers/seasonal items
- Displays prominently on home page

**Active**

- ✅ Product is visible to customers
- ❌ Product hidden (draft/inactive)

---

#### 3. Product Images

**Add Images**

1. Paste image URL in text field
2. Click **Add** button
3. Image appears in gallery below

**Important Notes:**

- Images must be valid image URLs (JPG, PNG, WebP)
- First image becomes the primary/thumbnail
- Up to 10 images per product recommended
- Images can be removed by clicking **✕** on thumbnail

**Image URL Example:**

```
https://cdn.example.com/products/shirt-red-1.jpg
```

**Where to Host Images:**

- Use CDN services (Cloudinary, Imgix, AWS S3, etc.)
- Or your own image hosting
- Must be HTTPS for security

---

#### 4. Variants & Pricing

**What are Variants?**

Variants are different versions of the same product:

- **Size:** Small, Medium, Large
- **Color:** Red, Blue, Green
- **Material:** Cotton, Polyester
- **Edition:** Standard, Premium, Deluxe

**Adding a Variant:**

1. Click **"Add Variant"** button
2. Fill in:
   - **SKU** - Stock Keeping Unit (unique identifier)
     - Example: `SHIRT-RED-M` or `T001-M`
   - **Variant Name** - Display name
     - Example: `Red - Medium` or `Cotton - Size M`
   - **Prices** - For each currency:
     - USD (in cents, so $19.99 = 1999)
     - BDT (in smallest unit)
     - SEK (in öre)
     - EUR (in cents)
   - **Stock** - Units available for this variant
3. Click **"Save Variant"**

**Example for T-Shirt:**

Variant 1:

- SKU: `SHIRT-001-S`
- Name: `Red - Small`
- USD: 1999 ($19.99)
- BDT: 1800
- SEK: 199
- EUR: 1895
- Stock: 50

Variant 2:

- SKU: `SHIRT-001-M`
- Name: `Red - Medium`
- USD: 1999
- BDT: 1800
- SEK: 199
- EUR: 1895
- Stock: 75

Variant 3:

- SKU: `SHIRT-001-L`
- Name: `Red - Large`
- USD: 1999
- BDT: 1800
- SEK: 199
- EUR: 1895
- Stock: 40

---

## Step-by-Step: Create a New Product

### Example: Premium Cotton T-Shirt

1. **Go to Admin:**
   - Navigate to `/admin/products`
   - Click **"Add Product"** button
   - Page shows "New Product" form

2. **Fill English Information:**
   - Name: `Premium Cotton T-Shirt`
   - Slug: `premium-cotton-tshirt`
   - Short Description: `Comfortable 100% organic cotton t-shirt`
   - Full Description: `Our premium t-shirt is made from 100% organic cotton...`
   - Meta Title: `Premium Cotton T-Shirt | Simbolos`
   - Meta Description: `High-quality organic cotton t-shirt available in multiple colors and sizes`

3. **Set Settings:**
   - Category: Select "Apparel" or relevant category
   - Product Type: Physical
   - ✅ Check "Featured Product" (if it's a bestseller)
   - ✅ Check "Active"

4. **Add Images:**
   - Paste first image URL: `https://cdn.example.com/tshirt-1.jpg`
   - Click **Add**
   - Paste second image URL: `https://cdn.example.com/tshirt-2.jpg`
   - Click **Add**
   - (Repeat for 3-5 images for good product display)

5. **Add Variants - Red Color:**
   - Click **"Add Variant"**
   - SKU: `SHIRT-RED-S`
   - Variant Name: `Red - Small`
   - Prices: USD 1999, BDT 1800, SEK 199, EUR 1895
   - Stock: 50
   - Click **"Save Variant"**

6. **Add Variants - More Sizes:**
   - Click **"Add Variant"** again
   - SKU: `SHIRT-RED-M`
   - Name: `Red - Medium`
   - Same prices
   - Stock: 75
   - Save

   - Click **"Add Variant"** again
   - SKU: `SHIRT-RED-L`
   - Name: `Red - Large`
   - Same prices
   - Stock: 40
   - Save

7. **Add Bangla Translation (Optional):**
   - Click **বাংলা** tab
   - Name: `প্রিমিয়াম কটন টি-শার্ট`
   - Short Description: `আরামদায়ক ১০০% জৈব সুতি টি-শার্ট`
   - Full Description: `আমাদের প্রিমিয়াম টি-শার্ট ১০০% জৈব সুতি থেকে তৈরি...`

8. **Save Product:**
   - Click **"Create Product"** button
   - Wait for success notification: "Product created successfully"

9. **Verify:**
   - Go to `/en/products`
   - Search for your product
   - Click to view details
   - Verify images, variants, and pricing

---

## Edit Existing Product

1. Go to `/admin/products`
2. Find product in table
3. Click **Edit** link on that row
4. Make changes
5. Click **"Save Changes"**

---

## Translation Workflow

### Adding Translations

1. **English (Default):**
   - Complete all English fields first
   - This is the fallback language

2. **Bangla (বাংলা):**
   - Click **বাংলা** tab
   - Translate:
     - Name
     - Short Description
     - Full Description
     - Meta Title (optional)
     - Meta Description (optional)
   - Also translate variant names:
     - Example: `লাল - মাঝারি` instead of `Red - Medium`

3. **Swedish (Svenska):**
   - Click **Svenska** tab
   - Translate all fields to Swedish

**Note:** Orange warning ⚠️ shows next to incomplete languages

---

## Pricing Strategy

### Multi-Currency Pricing

Your products sell in 4 currencies:

- **USD** (USA) - Enter in cents (1999 = $19.99)
- **BDT** (Bangladesh) - Bangladeshi Taka
- **SEK** (Sweden) - Swedish Krona
- **EUR** (Europe) - Euro (cents)

**Example Pricing for $19.99 Product:**

- USD: 1999 (cents)
- BDT: ~1700 (depends on exchange rate)
- SEK: ~199 (depends on exchange rate)
- EUR: ~1895 (depends on exchange rate)

**How Prices Display:**

- In US: Shows as $19.99
- In Bangladesh: Shows as ৳1700
- In Sweden: Shows as 199kr
- In Europe: Shows as €18.95

---

## Images Best Practices

### Image Quality

- **Minimum resolution:** 800×800 pixels
- **Recommended:** 1200×1200 pixels or larger
- **Format:** JPG or PNG (JPG smaller file size)
- **Alt text:** Descriptive for accessibility

### Image Organization

1. First image = Product main/thumbnail
2. Subsequent images = Product angles/details
3. Order: Front → Back → Side → Detail shots

### Image Hosting

You need to host images on a CDN or server:

**Free Options:**

- Cloudinary (free tier available)
- Imgur
- Google Drive (public link)
- Amazon S3 (paid but cheap)

**Format:** Always use HTTPS URLs for security

---

## Featured Products Section

**How Featured Works:**

1. Check "🌟 Featured Product" in settings
2. Product appears in homepage carousel
3. Limited slots (8-10 products recommended)
4. Rotates automatically

**Best Practices:**

- Feature bestsellers
- Feature seasonal items
- Feature new products
- Feature high-margin items
- Rotate monthly/quarterly

**Uncheck to Remove from Featured:**

- Open product editor
- Uncheck "Featured Product"
- Save changes

---

## Stock Management

**Updating Stock:**

1. Go to `/admin/products`
2. Click **Edit** on product
3. Scroll to "Variants & Pricing"
4. Find variant that needs restock
5. Check current stock
6. To update:
   - Remove old variant (click Delete)
   - Add new variant with same SKU/name but new stock
   - Or just note approximate count

**Low Stock Alerts** (Future feature):

- Notifications when stock < 10
- Automatic reorder alerts

**Out of Stock:**

- Set stock to 0
- Product still visible but marked "Out of Stock"
- Customers can't purchase

---

## Common Issues & Solutions

### Products Not Showing in Search

- **Fix:** Make sure `Active` checkbox is checked
- **Fix:** Make sure product has at least one variant with pricing

### Images Not Loading

- **Check:** URL is valid (test in new tab)
- **Check:** URL is HTTPS (secure)
- **Check:** Image file actually exists
- **Fix:** Use CDN like Cloudinary instead of direct URL

### Featured Products Not Showing on Home

- **Fix:** Check "🌟 Featured Product"
- **Fix:** Product must have `Active` checked
- **Fix:** Product must be visible (is_active = true)

### Can't Add Variants

- **Check:** Product name is filled in
- **Check:** SKU is not duplicate
- **Check:** All prices are entered
- **Fix:** Save product first, then add variants

### Prices Showing Wrong in Frontend

- **Check:** Prices entered are in correct units
  - USD: cents (1999 = $19.99)
  - BDT: smallest unit (paisa)
  - SEK: öre
  - EUR: cents
- **Check:** Currency is correct for user's locale

---

## Advanced Features

### Variant Pricing Strategy

**Same Price Across Sizes:**

- Enter same price for all size variants
- Good for: standard products

**Different Prices by Color:**

- Premium colors cost more
- Example: Basic Red $19.99 vs Premium Gold $24.99

**Quantity Tiered Pricing** (Future):

- Buy 1: $19.99
- Buy 10+: $18.99
- Buy 50+: $16.99

---

## Product Visibility

| Setting        | Effect                             |
| -------------- | ---------------------------------- |
| `Active: ✅`   | Shows in all pages, searchable     |
| `Active: ❌`   | Hidden from customers (draft mode) |
| `Featured: ✅` | Shows in homepage carousel         |
| `Featured: ❌` | Normal product (still searchable)  |

---

## Quick Reference: Form Fields

### Required Fields (marked with \*)

- Product Name (English)
- Product Slug (English)

### Optional Fields

- Category
- Short Description
- Full Description
- Meta fields
- Images (but recommend at least 1)
- Variants (at least 1 variant recommended)

### Translations

- Complete in at least English
- Other languages are optional
- Orange ⚠️ shows incomplete translations

---

## Testing Your Product

1. **Create test product** with all features
2. **Go to home page:** Check featured carousel
3. **Go to products page:** Search for product
4. **Click product:** View details, variants, images
5. **Try variant selector:** Switch between variants
6. **Check pricing:** Verify currency formatting
7. **Add to cart:** Make sure variant price is correct
8. **Proceed to checkout:** Verify cart displays all details

---

## Next Steps

1. ✅ Go to `/admin/products`
2. ✅ Click **"Add Product"**
3. ✅ Fill in test product details
4. ✅ Add 2-3 images with URLs
5. ✅ Add 2-3 variants with pricing
6. ✅ Check Featured and Active
7. ✅ Click **"Create Product"**
8. ✅ Go to home page and verify featured carousel
9. ✅ Go to products listing and find your product
10. ✅ Click product and verify all details display correctly

---

**Your product management is now complete and ready to use!** 🎉

You can now manage a full catalog with multi-language support, multiple images, and variant pricing in 4 currencies.
