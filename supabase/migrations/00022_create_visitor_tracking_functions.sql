-- Visitor Tracking Functions
-- BRD §3.11 - Functions to track and aggregate visitor data

-- Function to record daily visitor statistics
CREATE OR REPLACE FUNCTION public.track_daily_visitors(
  p_date DATE DEFAULT CURRENT_DATE,
  p_visitors INT DEFAULT 1,
  p_page_views INT DEFAULT 1,
  p_unique_visitors INT DEFAULT 1,
  p_bounce_rate NUMERIC(5,2) DEFAULT 0.00,
  p_avg_session_duration INT DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.visitor_analytics (
    date, visitors, page_views, unique_visitors, bounce_rate, avg_session_duration
  ) VALUES (
    p_date, p_visitors, p_page_views, p_unique_visitors, p_bounce_rate, p_avg_session_duration
  )
  ON CONFLICT (date) 
  DO UPDATE SET
    visitors = visitor_analytics.visitors + p_visitors,
    page_views = visitor_analytics.page_views + p_page_views,
    unique_visitors = visitor_analytics.unique_visitors + p_unique_visitors,
    bounce_rate = p_bounce_rate,
    avg_session_duration = p_avg_session_duration,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get visitor analytics for date range
CREATE OR REPLACE FUNCTION public.get_visitor_analytics(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  id UUID,
  date DATE,
  visitors INT,
  page_views INT,
  unique_visitors INT,
  bounce_rate NUMERIC(5,2),
  avg_session_duration INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.visitor_analytics
  WHERE date >= p_start_date AND date <= p_end_date
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.track_daily_visitors TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_visitor_analytics TO authenticated;
