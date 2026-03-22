#!/usr/bin/env node

/**
 * Create Admin User Script
 *
 * Usage:
 *   node scripts/create-admin-user.mjs <email> <password> <fullname>
 *
 * Example:
 *   node scripts/create-admin-user.mjs admin@example.com "SecurePassword123!" "Admin User"
 */

import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);

if (args.length < 3) {
  console.error(
    "Usage: node scripts/create-admin-user.mjs <email> <password> <fullname>",
  );
  console.error(
    "Example: node scripts/create-admin-user.mjs admin@example.com SecurePass123 'Admin User'",
  );
  process.exit(1);
}

const [email, password, fullName] = args;

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env",
  );
  process.exit(1);
}

// Create Supabase client with service role key (admin privileges)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  try {
    console.log(`Creating admin user: ${email}...`);

    // 1. Create user in auth.users
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name: fullName },
      });

    if (authError) {
      console.error("Error creating auth user:", authError.message);
      process.exit(1);
    }

    console.log(`✓ Auth user created: ${authUser.user.id}`);

    // 2. Update profile to set role as administrator
    // (The trigger should have already created the profile, but we need to update it)
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .update({ role: "administrator" })
      .eq("id", authUser.user.id)
      .select()
      .single();

    if (profileError) {
      console.error("Error updating profile:", profileError.message);
      console.error("Note: You may need to manually update the profile:");
      console.error(
        `  UPDATE public.profiles SET role = 'administrator' WHERE id = '${authUser.user.id}';`,
      );
      process.exit(1);
    }

    console.log("✓ Profile updated with administrator role");
    console.log("\n✅ Admin user created successfully!");
    console.log(`\nLogin Credentials:\n`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(
      `\nAccess the admin panel at: ${supabaseUrl.replace("https://", "https://localhost:5173/").split(".supabase")[0]}/admin`,
    );
    console.log("  (Replace localhost:5173 with your actual dev URL)");
  } catch (err) {
    console.error("Unexpected error:", err.message);
    process.exit(1);
  }
}

createAdminUser();
