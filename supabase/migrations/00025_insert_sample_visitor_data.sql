-- Insert sample visitor analytics data for testing
-- This ensures there's data available for the admin dashboard

-- Insert data for the last 7 days
INSERT INTO public.visitor_analytics (date, visitors, page_views, unique_visitors, bounce_rate, avg_session_duration)
VALUES 
  (CURRENT_DATE - INTERVAL '6 days', 145, 423, 89, 42.5, 185),
  (CURRENT_DATE - INTERVAL '5 days', 167, 512, 102, 38.2, 220),
  (CURRENT_DATE - INTERVAL '4 days', 189, 587, 115, 35.8, 195),
  (CURRENT_DATE - INTERVAL '3 days', 156, 445, 98, 41.3, 178),
  (CURRENT_DATE - INTERVAL '2 days', 198, 623, 134, 36.7, 210),
  (CURRENT_DATE - INTERVAL '1 day', 212, 689, 145, 33.9, 245),
  (CURRENT_DATE, 234, 712, 167, 31.4, 267)
ON CONFLICT (date) 
DO UPDATE SET
  visitors = EXCLUDED.visitors,
  page_views = EXCLUDED.page_views,
  unique_visitors = EXCLUDED.unique_visitors,
  bounce_rate = EXCLUDED.bounce_rate,
  avg_session_duration = EXCLUDED.avg_session_duration,
  updated_at = now();

-- Verify the data was inserted
SELECT 
  'Sample data inserted' as status,
  COUNT(*) as records_inserted,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM public.visitor_analytics
WHERE date >= CURRENT_DATE - INTERVAL '7 days';
