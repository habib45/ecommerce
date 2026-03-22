-- BRD §3.8 — Extend return_requests with items JSONB + admin RLS

-- 1. The return_requests table already exists from 00008.
--    Add missing columns needed by the customer return flow.
ALTER TABLE public.return_requests
  ADD COLUMN IF NOT EXISTS items       JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add direct FK to profiles so PostgREST can join customer info
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'return_requests_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.return_requests
      ADD CONSTRAINT return_requests_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- 2. Create is_admin_user() helper — SECURITY DEFINER avoids RLS recursion on profiles
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT role IN ('administrator', 'store_manager', 'support_agent')
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- 3. Admin RLS policies for return_requests
DROP POLICY IF EXISTS "Admins can view all returns"  ON public.return_requests;
DROP POLICY IF EXISTS "Admins can update returns"    ON public.return_requests;

CREATE POLICY "Admins can view all returns"
  ON public.return_requests FOR SELECT
  USING (public.is_admin_user());

CREATE POLICY "Admins can update returns"
  ON public.return_requests FOR UPDATE
  USING (public.is_admin_user());

-- 4. Fix profiles policy to use is_admin_user() — eliminates recursive RLS
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;

CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin_user());
