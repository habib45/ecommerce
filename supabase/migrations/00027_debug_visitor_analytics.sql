-- Debug visitor analytics table and data
-- This helps identify why API returns empty array

-- Check if table exists
SELECT 
  'table_exists' as check_type,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'visitor_analytics'
  ) as exists;

-- Check table structure
SELECT 
  'table_structure' as check_type,
  column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'visitor_analytics'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
  'rls_status' as check_type,
  rowlevelsecurity as is_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'visitor_analytics';

-- Check existing policies
SELECT 
  'rls_policies' as check_type,
  schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'visitor_analytics';

-- Check actual data count
SELECT 
  'data_count' as check_type,
  COUNT(*) as total_records,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM public.visitor_analytics;

-- Try direct insert to test permissions
INSERT INTO public.visitor_analytics (date, visitors, page_views, unique_visitors, bounce_rate, avg_session_duration)
VALUES (CURRENT_DATE, 999, 9999, 999, 99.99, 999)
ON CONFLICT (date) 
DO UPDATE SET
  visitors = EXCLUDED.visitors,
  page_views = EXCLUDED.page_views,
  unique_visitors = EXCLUDED.unique_visitors,
  bounce_rate = EXCLUDED.bounce_rate,
  avg_session_duration = EXCLUDED.avg_session_duration,
  updated_at = now();

-- Verify test data was inserted
SELECT 
  'test_insert_result' as check_type,
  COUNT(*) as test_records,
  date, visitors, page_views
FROM public.visitor_analytics 
WHERE visitors = 999 OR date = CURRENT_DATE;
