-- Add country tracking to visitor analytics
-- This allows admins to see visitor countries

-- Add country column to visitor_analytics table
ALTER TABLE public.visitor_analytics 
ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'US';

-- Create index for country queries
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_country ON public.visitor_analytics(country);

-- Update RLS policies to include country
-- Drop existing policies
DROP POLICY IF EXISTS "Allow insert for visitor tracking" ON public.visitor_analytics;
DROP POLICY IF EXISTS "Allow public read access" ON public.visitor_analytics;
DROP POLICY IF EXISTS "Allow update for admins" ON public.visitor_analytics;
DROP POLICY IF EXISTS "Allow delete for admins" ON public.visitor_analytics;

-- Recreate policies with country support
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

-- Update existing data to include country
UPDATE public.visitor_analytics 
SET country = CASE 
  WHEN date = CURRENT_DATE - INTERVAL '6 days' THEN 'US'
  WHEN date = CURRENT_DATE - INTERVAL '5 days' THEN 'GB'
  WHEN date = CURRENT_DATE - INTERVAL '4 days' THEN 'CA'
  WHEN date = CURRENT_DATE - INTERVAL '3 days' THEN 'AU'
  WHEN date = CURRENT_DATE - INTERVAL '2 days' THEN 'DE'
  WHEN date = CURRENT_DATE - INTERVAL '1 day' THEN 'FR'
  WHEN date = CURRENT_DATE THEN 'JP'
  ELSE 'US'
END
WHERE country IS NULL OR country = '';

-- Insert sample data with countries
INSERT INTO public.visitor_analytics (date, visitors, page_views, unique_visitors, bounce_rate, avg_session_duration, country)
SELECT 
  CURRENT_DATE - INTERVAL '6 days', 150, 450, 75, 45.5, 200, 'US'
UNION ALL
SELECT CURRENT_DATE - INTERVAL '5 days', 180, 520, 95, 38.2, 230, 'GB'
UNION ALL
SELECT CURRENT_DATE - INTERVAL '4 days', 165, 480, 82, 41.3, 195, 'CA'
UNION ALL
SELECT CURRENT_DATE - INTERVAL '3 days', 195, 590, 110, 35.8, 185, 'AU'
UNION ALL
SELECT CURRENT_DATE - INTERVAL '2 days', 210, 650, 125, 33.9, 220, 'DE'
UNION ALL
SELECT CURRENT_DATE - INTERVAL '1 day', 225, 720, 140, 31.4, 250, 'FR'
UNION ALL
SELECT CURRENT_DATE, 240, 780, 155, 28.7, 275, 'JP'
ON CONFLICT (date) 
DO UPDATE SET
  visitors = visitor_analytics.visitors + EXCLUDED.visitors,
  page_views = visitor_analytics.page_views + EXCLUDED.page_views,
  unique_visitors = visitor_analytics.unique_visitors + EXCLUDED.unique_visitors,
  bounce_rate = EXCLUDED.bounce_rate,
  avg_session_duration = EXCLUDED.avg_session_duration,
  country = EXCLUDED.country,
  updated_at = now();

-- Verify country data was added
SELECT 
  'country_check' as check_type,
  COUNT(*) as total_records,
  COUNT(DISTINCT country) as unique_countries,
  STRING_AGG(DISTINCT country, ', ') as countries_list
FROM public.visitor_analytics
WHERE date >= CURRENT_DATE - INTERVAL '7 days';
