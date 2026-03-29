# Creating an Admin User

This guide shows two methods to create an admin user for your e-commerce platform.

## Method 1: Using Node.js Script (Recommended)

This is the easiest method - the script automatically creates both the auth user and updates the profile.

### Prerequisites

- Node.js installed
- `.env` file configured with Supabase credentials

### Steps

1. **Run the script:**

   ```bash
   node scripts/create-admin-user.mjs admin@example.com "YourSecurePassword123!" "Admin User Name"
   ```

   Replace:
   - `admin@example.com` - The admin's email address
   - `YourSecurePassword123!` - A secure password (contains uppercase, lowercase, numbers, symbols)
   - `Admin User Name` - The admin's full name

2. **Example:**

   ```bash
   node scripts/create-admin-user.mjs admin@simbolos.com "MySecurePass2024!" "Site Administrator"
   ```

3. **Success Output:**

   You'll see:

   ```
   Creating admin user: admin@example.com...
   ✓ Auth user created: [user-id]
   ✓ Profile updated with administrator role

   ✅ Admin user created successfully!

   Login Credentials:

     Email: admin@example.com
     Password: YourSecurePassword123!

   Access the admin panel at: http://localhost:5173/admin
   ```

4. **Login:**
   - Go to `http://localhost:5173/en/login`
   - Enter the email and password you created
   - You'll be redirected to the admin dashboard at `/admin`

---

## Method 2: Manual Supabase Dashboard

If you prefer to do it manually in Supabase:

### Step 1: Create Auth User

1. Go to your **Supabase Project Dashboard**
2. Click **Authentication** → **Users**
3. Click **"Add user"** button
4. Enter:
   - **Email:** `admin@example.com`
   - **Password:** A secure password (min 6 chars, recommended: mixed case + numbers)
5. Click **Save user**
6. Find your new user in the list and copy their **User ID** (UUID)

### Step 2: Update Profile to Administrator

1. Go to **SQL Editor** in Supabase
2. Create a new query
3. Replace `USER_ID` in this SQL with your actual user ID:

   ```sql
   UPDATE public.profiles
   SET role = 'administrator'
   WHERE id = 'USER_ID';
   ```

   **Example:**

   ```sql
   UPDATE public.profiles
   SET role = 'administrator'
   WHERE id = '123e4567-e89b-12d3-a456-426614174000';
   ```

4. Click **Run**
5. You should see `"Execution result: 1 row affected"`

### Step 3: Verify

Run this query to verify your admin user was created:

```sql
SELECT id, email, full_name, role, created_at
FROM public.profiles
WHERE role = 'administrator'
ORDER BY created_at DESC;
```

---

## Accessing the Admin Panel

Once your admin user is created:

1. **Start your dev server:**

   ```bash
   npm run dev
   ```

2. **Go to login page:**
   - Visit `http://localhost:5173/en/login`
   - Or `http://localhost:5173/bn-BD/login` or `http://localhost:5173/sv/login`

3. **Log in with your admin credentials:**
   - Email: `admin@example.com`
   - Password: The password you set

4. **Access admin panel:**
   - Automatic redirect to `http://localhost:5173/admin` after login
   - You'll see admin navigation: Dashboard, Products, Orders, Translations, Returns

---

## Admin Features

The admin panel includes:

- **Dashboard** (`/admin`) - Overview and statistics
- **Products** (`/admin/products`) - Manage product catalog
- **Orders** (`/admin/orders`) - View and manage orders
- **Translations** (`/admin/translations`) - Manage multi-language content
- **Returns** (`/admin/returns`) - Manage return requests

---

## Troubleshooting

### "Permission denied" when running script

```bash
chmod +x scripts/create-admin-user.mjs
node scripts/create-admin-user.mjs admin@example.com "password" "name"
```

### "Missing VITE_SUPABASE_URL" error

Make sure your `.env` file has:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Cannot login as admin

1. Verify the profile has `role = 'administrator'`:

   ```sql
   SELECT email, role FROM public.profiles WHERE email = 'admin@example.com';
   ```

2. Clear browser cache and try again

3. Check browser console for auth errors (F12 → Console tab)

### Admin page shows "Not authorized"

- Make sure you're logged in (check header)
- Verify your profile has `role = 'administrator'` via SQL
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

---

## Security Notes

- **Use strong passwords:** Mix uppercase, lowercase, numbers, and symbols
- **Never commit credentials:** Don't add plaintext passwords to version control
- **Limit admin access:** Only create admin users for trusted personnel
- **Audit access:** Check order and product changes regularly
- **Change default password:** Ask new admins to change their password on first login

---

## Multiple Admins

To create multiple admin users, simply run the script again with different emails:

```bash
node scripts/create-admin-user.mjs admin1@simbolos.com "Pass123!" "Admin One"
node scripts/create-admin-user.mjs admin2@simbolos.com "Pass456!" "Admin Two"
```

All users with `role = 'administrator'` can access the admin panel.
