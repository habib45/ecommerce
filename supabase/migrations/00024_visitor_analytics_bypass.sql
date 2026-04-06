-- Create a bypass function for visitor analytics that works with RLS
-- This function uses SECURITY DEFINER to bypass RLS policies

CREATE OR REPLACE FUNCTION public.insert_visitor_analytics(
  p_date DATE,
  p_visitors INT DEFAULT 1,
  p_page_views INT DEFAULT 1,
  p_unique_visitors INT DEFAULT 1,
  p_bounce_rate NUMERIC(5,2) DEFAULT 0.00,
  p_avg_session_duration INT DEFAULT 0,
  p_country VARCHAR(2) DEFAULT 'US'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.visitor_analytics (
    date, visitors, page_views, unique_visitors, bounce_rate, avg_session_duration, country
  ) VALUES (
    p_date, p_visitors, p_page_views, p_unique_visitors, p_bounce_rate, p_avg_session_duration, p_country
  )
  ON CONFLICT (date) 
  DO UPDATE SET
    visitors = visitor_analytics.visitors + p_visitors,
    page_views = visitor_analytics.page_views + p_page_views,
    unique_visitors = visitor_analytics.unique_visitors + p_unique_visitors,
    bounce_rate = p_bounce_rate,
    avg_session_duration = p_avg_session_duration,
    country = p_country,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to everyone
GRANT EXECUTE ON FUNCTION public.insert_visitor_analytics TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_visitor_analytics TO anon;
GRANT EXECUTE ON FUNCTION public.insert_visitor_analytics TO authenticated;

-- Alternative: Temporarily disable RLS for inserts (less secure but will work)
-- Uncomment the following lines if the above doesn't work:
-- ALTER TABLE public.visitor_analytics DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.visitor_analytics ENABLE ROW LEVEL SECURITY;
