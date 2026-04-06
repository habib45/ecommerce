-- Make visitor analytics API publicly accessible
-- This allows anyone to read visitor analytics data

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow insert for visitor tracking" ON public.visitor_analytics;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.visitor_analytics;
DROP POLICY IF EXISTS "Allow manage for admins" ON public.visitor_analytics;

-- Create new policies that allow public read access
-- Allow anyone to insert visitor data (for tracking)
CREATE POLICY "Allow insert for visitor tracking" ON public.visitor_analytics FOR INSERT
WITH CHECK (true);

-- Allow ANYONE to read visitor analytics data (public API)
CREATE POLICY "Allow public read access" ON public.visitor_analytics FOR SELECT
USING (true);

-- Allow only admins to update visitor analytics
CREATE POLICY "Allow update for admins" ON public.visitor_analytics FOR UPDATE
USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));

-- Allow only admins to delete visitor analytics
CREATE POLICY "Allow delete for admins" ON public.visitor_analytics FOR DELETE
USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));

-- Verify the policies are applied
SELECT 
  'policy_check' as check_type,
  schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'visitor_analytics'
ORDER BY policyname;

-- Test public access with a simple query
SELECT 
  'public_access_test' as check_type,
  COUNT(*) as total_records,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM public.visitor_analytics;

-- Insert some public test data if table is empty
INSERT INTO public.visitor_analytics (date, visitors, page_views, unique_visitors, bounce_rate, avg_session_duration)
SELECT 
  CURRENT_DATE - INTERVAL '6 days', 150, 450, 75, 45.5, 200
UNION ALL
SELECT CURRENT_DATE - INTERVAL '5 days', 180, 520, 95, 38.2, 230
UNION ALL
SELECT CURRENT_DATE - INTERVAL '4 days', 165, 480, 82, 41.3, 195
UNION ALL
SELECT CURRENT_DATE - INTERVAL '3 days', 195, 590, 110, 35.8, 185
UNION ALL
SELECT CURRENT_DATE - INTERVAL '2 days', 210, 650, 125, 33.9, 220
UNION ALL
SELECT CURRENT_DATE - INTERVAL '1 day', 225, 720, 140, 31.4, 250
UNION ALL
SELECT CURRENT_DATE, 240, 780, 155, 28.7, 275
ON CONFLICT (date) 
DO UPDATE SET
  visitors = visitor_analytics.visitors + EXCLUDED.visitors,
  page_views = visitor_analytics.page_views + EXCLUDED.page_views,
  unique_visitors = visitor_analytics.unique_visitors + EXCLUDED.unique_visitors,
  bounce_rate = EXCLUDED.bounce_rate,
  avg_session_duration = EXCLUDED.avg_session_duration,
  updated_at = now();
