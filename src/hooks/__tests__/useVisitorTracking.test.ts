import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock the visitorTracking module before importing the hook
vi.mock('@/lib/visitorTracking', () => ({
  visitorTracker: {
    trackPageView: vi.fn(),
  },
}));

import { useVisitorTracking } from '../useVisitorTracking';
import { visitorTracker } from '@/lib/visitorTracking';

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useVisitorTracking', () => {
  it('calls trackPageView after 1-second delay', () => {
    renderHook(() => useVisitorTracking());

    // Not called immediately
    expect(visitorTracker.trackPageView).not.toHaveBeenCalled();

    // Advance timer by 1 second
    vi.advanceTimersByTime(1000);
    expect(visitorTracker.trackPageView).toHaveBeenCalledTimes(1);
  });

  it('cleans up timeout on unmount before timer fires', () => {
    const { unmount } = renderHook(() => useVisitorTracking());

    // Unmount before the 1-second delay
    unmount();

    // Advance past the timeout — trackPageView should NOT be called
    vi.advanceTimersByTime(2000);
    expect(visitorTracker.trackPageView).not.toHaveBeenCalled();
  });
});
