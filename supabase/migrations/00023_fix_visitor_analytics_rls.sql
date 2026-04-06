-- Fix RLS policies for visitor analytics to allow public tracking
-- This migration updates existing policies to allow visitor tracking

-- Drop all existing policies first
DROP POLICY IF EXISTS "Admins can manage visitor analytics" ON public.visitor_analytics;
DROP POLICY IF EXISTS "Visitor analytics are readable by admins" ON public.visitor_analytics;
DROP POLICY IF EXISTS "Anyone can insert visitor analytics" ON public.visitor_analytics;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.visitor_analytics;
DROP POLICY IF EXISTS "Enable select for admins only" ON public.visitor_analytics;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.visitor_analytics;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.visitor_analytics;

-- Create new policies with proper permissions
-- Allow anyone (including anonymous) to insert visitor data for tracking
CREATE POLICY "Allow insert for all users" ON public.visitor_analytics FOR INSERT
WITH CHECK (true);

-- Allow admins and service role to read visitor analytics
CREATE POLICY "Allow select for admins" ON public.visitor_analytics FOR SELECT
USING (
  auth.jwt() ->> 'role' IN ('administrator', 'store_manager') OR 
  auth.role() = 'service_role'
);

-- Allow admins to update visitor analytics
CREATE POLICY "Allow update for admins" ON public.visitor_analytics FOR UPDATE
USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));

-- Allow admins to delete visitor analytics
CREATE POLICY "Allow delete for admins" ON public.visitor_analytics FOR DELETE
USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));

-- Update function permissions to allow public access
-- First revoke existing permissions
REVOKE ALL ON FUNCTION public.track_daily_visitors FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_daily_visitors FROM authenticated;
REVOKE ALL ON FUNCTION public.track_daily_visitors FROM anon;

-- Grant new permissions
GRANT EXECUTE ON FUNCTION public.track_daily_visitors TO anon;
GRANT EXECUTE ON FUNCTION public.track_daily_visitors TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_daily_visitors TO PUBLIC;
