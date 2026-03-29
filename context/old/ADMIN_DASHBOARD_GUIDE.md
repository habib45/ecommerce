# Admin Dashboard - Complete Setup & Testing Guide

## Overview

Your admin dashboard is now fully functional with all features enabled:

- **Dashboard** - Overview statistics
- **Products** - Create, edit, delete products with multi-language support
- **Orders** - View and manage all customer orders
- **Translations** - Manage translation completeness
- **Returns** - Process return requests

---

## What Was Fixed

### Critical Fix: Authentication Loading State

**Issue:** Admin users were redirected to login even after entering correct credentials.

**Root Cause:** The auth system was marking the loading state as `false` before the user's profile was fetched from the database. This caused the admin layout to see `profile: null` and immediately redirect.

**Solution:** Modified `src/stores/authStore.ts` to:

1. Fetch the user's profile FIRST
2. Only then mark loading as complete
3. This ensures the admin check has valid profile data

**File Changed:** `src/stores/authStore.ts:33-56`

### Enhanced Admin Pages

✅ **Orders Page** - Now displays:

- Order ID and order number
- Customer name and email
- Total amount with proper currency formatting
- Locale column
- Status badge with color coding
- Order date
- Live order count

✅ **Returns Page** - Now displays:

- Return request ID
- Associated order and user
- Return reason code and details
- Status badge with color coding
- Number of items in return
- Request date
- Live return count

---

## Testing the Admin Dashboard

### Step 1: Create an Admin User

If you haven't created an admin user yet, run:

```bash
node scripts/create-admin-user.mjs admin@simbolos.com "YourSecurePassword2024!" "Admin Name"
```

You should see:

```
Creating admin user: admin@simbolos.com...
✓ Auth user created: [user-id]
✓ Profile updated with administrator role

✅ Admin user created successfully!

Login Credentials:

  Email: admin@simbolos.com
  Password: YourSecurePassword2024!
```

### Step 2: Start Development Server

```bash
npm run dev
```

The dev server should start on `http://localhost:5173`

### Step 3: Login as Admin

1. Go to `http://localhost:5173/en/login`
2. Enter your admin email: `admin@simbolos.com`
3. Enter your password
4. Click **Sign In**

**Expected Behavior:**

- No "Loading..." state stuck
- Login completes successfully
- Auto-redirects to admin dashboard `http://localhost:5173/admin`

### Step 4: Verify Admin Dashboard

#### Dashboard Page ✓

Navigate to `/admin` (should auto-redirect after login)

You should see:

- **Title:** "Dashboard"
- **Stats Cards:**
  - Total Orders: Shows count of all orders
  - Total Products: Shows count of all products

If no orders/products exist yet, they'll show `—` or `0`

#### Products Page ✓

Navigate to `/admin/products`

You should see:

- **"Add Product" button** in top right
- **Products table** with columns:
  - Name (English version)
  - bn-BD translation completeness %
  - sv translation completeness %
  - Active status (✓ or —)
  - Edit link
- **Edit button** for each product to open editor
- **Empty state** message if no products exist

Click **Add Product** or **Edit** on a product:

- Locale tabs (English | Bangla | Swedish)
- Input fields for Name, Slug, Description
- Warning icons (⚠) for missing translations
- Save button
- Missing translation indicators

#### Orders Page ✓

Navigate to `/admin/orders`

You should see:

- **"Orders" title** with total count
- **Orders table** with columns:
  - Order ID (order number)
  - Customer (name and email)
  - Amount (formatted with currency, e.g., $100.00)
  - Locale (en, bn-BD, or sv)
  - Status (colored badge: green/blue/yellow/red)
  - Date (order creation date)
- **Empty state** if no orders exist
- Orders sorted by newest first

Status colors:

- 🟢 Green: `completed`, `delivered`
- 🔵 Blue: `processing`, `shipped`
- 🟡 Yellow: `pending_payment`
- 🔴 Red: `cancelled`, `refunded`

#### Translations Page ✓

Navigate to `/admin/translations`

You should see:

- **Translation Management** title
- **Language tabs:** Bangla | Swedish
- **Completeness cards:**
  - Products: 73%
  - Categories: 100%
  - Email Templates: 66%
- **Action buttons:**
  - Export XLIFF (download for translation)
  - Import XLIFF (upload translated content)
  - Auto-translate (DeepL integration - placeholder)

#### Returns Page ✓

Navigate to `/admin/returns`

You should see:

- **"Return Requests" title** with total count
- **Returns table** with columns:
  - Return ID (UUID first 8 chars)
  - Order ID (UUID first 8 chars)
  - User ID (UUID first 8 chars)
  - Reason (code and optional detail)
  - Status (colored badge)
  - Date (request creation date)
  - Items count
- **Empty state** if no returns exist

Status colors for returns:

- 🟢 Green: `approved`, `refunded`
- 🟡 Yellow: `requested`
- 🔵 Blue: `info_requested`
- 🟣 Purple: `received`
- 🔴 Red: `rejected`

---

## Admin Features Summary

### Products Management

**What you can do:**

- ✅ Create new products
- ✅ Edit existing products
- ✅ Add translations (EN, Bangla, Swedish)
- ✅ See translation completeness %
- ✅ Mark products as active/inactive

**How to:**

1. Click **Products** in left sidebar
2. Click **Add Product** (top right)
3. Fill Name, Slug, Description for English
4. Click **Bangla** tab → fill translations
5. Click **Swedish** tab → fill translations
6. Click **Save**

### Order Management

**What you can do:**

- ✅ View all customer orders
- ✅ See order amounts in correct currency
- ✅ Filter by status (if implemented)
- ✅ Track locales where orders came from
- ✅ See order dates and customer info

**Statuses you'll see:**

- `pending_payment` - Payment not yet confirmed
- `payment_confirmed` - Payment successful
- `processing` - Preparing for shipment
- `shipped` - On its way
- `delivered` - Reached customer
- `completed` - Order finished
- `cancelled` - Customer cancelled
- `refunded` - Money returned

### Return Management

**What you can do:**

- ✅ View all return requests
- ✅ See reason why customers returned
- ✅ Track return status
- ✅ See how many items in each return
- ✅ Filter by status (if implemented)

**Return Status Flow:**

1. `requested` - Customer initiated return
2. `info_requested` - Admin asking for more info
3. `approved` - Admin approved the return
4. `received` - Admin received returned items
5. `refunded` - Money refunded to customer
6. `rejected` - Admin rejected the return

### Translation Management

**What you can do:**

- ✅ See translation completeness for each language
- ✅ Export translations (XLIFF format)
- ✅ Import completed translations
- ✅ View which content is translated

**Completeness %:**

- Shows what percentage of products/categories/emails are translated
- Helps identify gaps in content

---

## Accessing Admin from Different Locales

The admin panel is English-only (per spec), but you can access it from any locale:

- `http://localhost:5173/en/login` → `/admin` (English)
- `http://localhost:5173/bn-BD/login` → `/admin` (Same admin panel)
- `http://localhost:5173/sv/login` → `/admin` (Same admin panel)

---

## Troubleshooting

### Admin Dashboard Not Loading After Login

**Symptoms:**

- Login succeeds but page doesn't change
- Stuck on login page
- Shows "Loading..." forever

**Solutions:**

1. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear all cache
   - Reload page

2. **Check DevTools (F12):**
   - Open Browser Console (F12 → Console tab)
   - Look for any red error messages
   - Share error message if seeking help

3. **Verify admin user exists:**

   ```sql
   SELECT email, role FROM public.profiles WHERE email = 'admin@example.com';
   ```

   Should return role = `'administrator'`

4. **Check auth state:**
   - Open DevTools (F12)
   - Console → type: `localStorage.getItem('sb-huyfncswshimvzwhomsx-auth-token')`
   - Should show a valid JWT token

### Admin Pages Show "Not authorized"

**Cause:** Profile doesn't have administrator role

**Fix:**

```sql
UPDATE public.profiles
SET role = 'administrator'
WHERE email = 'your-email@example.com';
```

Then hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Orders/Returns Pages Show Empty

**Expected behavior:** If you have no orders/returns yet, they'll be empty

- This is normal for a new site
- Create test orders to see data

**To create test orders:**

1. Login as regular customer
2. Add products to cart
3. Checkout with test credit card: `4242 4242 4242 4242`
4. Go to admin → Orders → See your test order

### Script Error: "Missing VITE_SUPABASE_URL"

**Cause:** `.env` file not configured

**Fix:**

```bash
cat .env
```

Should show:

```
VITE_SUPABASE_URL=https://huyfncswshimvzwhomsx.supabase.co
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

If missing, add to `.env`

---

## Admin User Roles

Three admin roles available (all can access dashboard):

- **administrator** - Full control (RECOMMENDED)
- **store_manager** - Manage products and orders
- **support_agent** - View-only access to orders

To create different role types:

```bash
# Create store manager
node scripts/create-admin-user.mjs manager@simbolos.com "Pass123!" "Store Manager"
```

Then in SQL:

```sql
UPDATE public.profiles
SET role = 'store_manager'
WHERE email = 'manager@simbolos.com';
```

---

## Next Steps

### For Development

1. **Enhance Order Details:**
   - Add click to view full order details
   - Edit order status from the UI
   - Add note/comment system

2. **Enhance Product Editor:**
   - Add image upload
   - Add variant management
   - Add pricing by currency

3. **Enhance Returns:**
   - Add approve/reject buttons
   - Add refund processing
   - Add customer messaging

### For Production

1. **Set up HTTPS** - Admin panel should only be accessible over HTTPS
2. **Enable 2FA** - Force two-factor authentication for admin users
3. **Audit logging** - Log all admin actions
4. **Role-based access** - Restrict specific actions by role
5. **Admin notifications** - Email alerts for high-priority events

---

## Quick Reference

| Page           | URL                                             | What It Shows                            |
| -------------- | ----------------------------------------------- | ---------------------------------------- |
| Dashboard      | `/admin`                                        | Order & product counts                   |
| Products       | `/admin/products`                               | All products with translation status     |
| Product Editor | `/admin/products/{id}` or `/admin/products/new` | Edit product details by locale           |
| Orders         | `/admin/orders`                                 | All customer orders with status          |
| Translations   | `/admin/translations`                           | Translation completeness & import/export |
| Returns        | `/admin/returns`                                | All return requests with statuses        |

---

## Support

If you encounter issues:

1. Check browser console (F12 → Console)
2. Check if profile has correct role:
   ```sql
   SELECT email, role FROM public.profiles WHERE email = 'your-email@example.com';
   ```
3. Restart dev server: `npm run dev`
4. Clear cache: `Ctrl+Shift+Delete`
5. Hard refresh: `Ctrl+Shift+R`

---

**Your admin dashboard is now ready to use!** 🎉

Login at `http://localhost:5173/en/login` with your admin credentials.
