import { useEffect } from 'react';
import { visitorTracker } from '@/lib/visitorTracking';

// Hook to initialize visitor tracking
export function useVisitorTracking() {
  useEffect(() => {
    // Track page view after a short delay to ensure page is loaded
    const timer = setTimeout(() => {
      visitorTracker.trackPageView();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
}
