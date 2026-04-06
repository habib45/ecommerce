-- Visitor Analytics Table for tracking website visitors
-- BRD §3.11 - Visitor tracking and analytics

CREATE TABLE public.visitor_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE NOT NULL UNIQUE,
  visitors        INT NOT NULL DEFAULT 0,
  page_views      INT NOT NULL DEFAULT 0,
  unique_visitors INT NOT NULL DEFAULT 0,
  bounce_rate    NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  avg_session_duration INT NOT NULL DEFAULT 0, -- in seconds
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for date range queries
CREATE INDEX idx_visitor_analytics_date ON public.visitor_analytics(date);

-- Index for sorting
CREATE INDEX idx_visitor_analytics_date_desc ON public.visitor_analytics(date DESC);

-- Enable RLS
ALTER TABLE public.visitor_analytics ENABLE ROW LEVEL SECURITY;

-- Only admins can manage visitor analytics (read/update/delete)
CREATE POLICY "Admins can manage visitor analytics" ON public.visitor_analytics FOR ALL
USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));

-- Allow anyone to insert visitor data (for tracking)
CREATE POLICY "Anyone can insert visitor analytics" ON public.visitor_analytics FOR INSERT
WITH CHECK (true);

-- Allow admins to read visitor analytics
CREATE POLICY "Visitor analytics are readable by admins" ON public.visitor_analytics FOR SELECT
USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));

-- Insert sample data for the last 30 days
WITH visitor_data AS (
  SELECT
    CURRENT_DATE - s as date,
    -- Generate realistic visitor numbers with some variation
    FLOOR(100 + RANDOM() * 50) + FLOOR(s * 2) as visitors,      -- 100-150 visitors per day
    FLOOR(300 + RANDOM() * 200) + FLOOR(s * 5) as page_views,  -- 300-500 page views per day
    FLOOR(80 + RANDOM() * 30) + FLOOR(s * 1) as unique_visitors, -- 80-110 unique visitors
    -- Bounce rate between 30-70%
    ROUND((30 + RANDOM() * 40 + RANDOM() * 5)::NUMERIC, 2) as bounce_rate,
    -- Average session duration between 60-300 seconds
    FLOOR(60 + RANDOM() * 240) as avg_session_duration
  FROM generate_series(0, 29) s
)
INSERT INTO public.visitor_analytics (date, visitors, page_views, unique_visitors, bounce_rate, avg_session_duration)
SELECT date, visitors, page_views, unique_visitors, bounce_rate, avg_session_duration
FROM visitor_data
ON CONFLICT (date) DO NOTHING;
