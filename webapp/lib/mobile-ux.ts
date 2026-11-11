/**
 * Mobile UX Enhancement Utilities
 *
 * Premium mobile interaction patterns and utilities for RIVA Webapp.
 * Follows iOS HIG and Material Design best practices while maintaining
 * RIVA's calm, professional character.
 */

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Pull-to-refresh hook for lists and scrollable content.
 *
 * CRITICAL FIX: Properly detects the scroll container and only triggers
 * when at absolute top (scrollTop === 0).
 *
 * @param onRefresh - Async function to call when refresh is triggered
 * @param enabled - Whether pull-to-refresh is enabled
 * @returns State and ref for the pull-to-refresh functionality
 */
export function usePullToRefresh(onRefresh: () => Promise<void>, enabled = true) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [pullState, setPullState] = useState<'idle' | 'pulling' | 'ready' | 'refreshing'>('idle');

  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const hasTriggeredRefresh = useRef(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  const threshold = 80; // Pull distance to trigger refresh
  const maxPull = 140; // Maximum visual pull distance

  /**
   * Get the actual scroll container.
   * In RIVA Web, the main scroll container is #webapp-main-scroll.
   */
  const getScrollContainer = useCallback(() => {
    if (scrollContainerRef.current) return scrollContainerRef.current;

    // Find the actual scrolling element
    const main = document.getElementById('webapp-main-scroll');
    if (main) {
      scrollContainerRef.current = main;
      return main;
    }

    return null;
  }, []);

  /**
   * Check if we're at the absolute top of the scroll container.
   */
  const isAtTop = useCallback(() => {
    const container = getScrollContainer();
    if (!container) return false;

    // Must be at absolute top (scrollTop === 0)
    return container.scrollTop === 0;
  }, [getScrollContainer]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return;

    // CRITICAL: Only start tracking if we're at the absolute top
    if (!isAtTop()) {
      isDragging.current = false;
      return;
    }

    const touch = e.touches?.[0];
    if (!touch) return;

    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    isDragging.current = true;
    hasTriggeredRefresh.current = false;
    setPullState('idle');
  }, [enabled, isRefreshing, isAtTop]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || !enabled || isRefreshing) return;

    const touch = e.touches?.[0];
    if (!touch) return;

    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;

    // If user scrolls up, immediately cancel the pull
    if (deltaY < 0) {
      isDragging.current = false;
      setPullDistance(0);
      setPullState('idle');
      return;
    }

    // Only proceed if pulling down significantly AND still at top
    if (deltaY > 0 && isAtTop()) {
      // Apply elastic resistance for natural feel
      const resistance = 0.5; // 50% resistance
      const elasticDelta = deltaY * resistance;
      const cappedDistance = Math.min(elasticDelta, maxPull);

      setPullDistance(cappedDistance);

      // Update pull state based on distance
      if (cappedDistance >= threshold) {
        setPullState('ready');
      } else if (cappedDistance > 10) {
        setPullState('pulling');
      }

      // Prevent default scrolling once we've committed to pulling
      if (deltaY > 20) {
        e.preventDefault();
      }
    } else if (deltaY > 0 && !isAtTop()) {
      // Started at top but scrolled down — immediately cancel pull
      isDragging.current = false;
      setPullDistance(0);
      setPullState('idle');
    }
  }, [enabled, isRefreshing, isAtTop, threshold, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;

    isDragging.current = false;
    const shouldRefresh = pullDistance >= threshold && !hasTriggeredRefresh.current;

    if (shouldRefresh) {
      hasTriggeredRefresh.current = true;
      setPullState('refreshing');
      setIsRefreshing(true);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull-to-refresh error:', error);
      } finally {
        // Smooth transition out
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setPullState('idle');
        }, 300);
      }
    } else {
      // Didn't reach threshold - animate back
      setPullDistance(0);
      setPullState('idle');
    }
  }, [pullDistance, threshold, onRefresh]);

  const handleTouchCancel = useCallback(() => {
    isDragging.current = false;
    setPullDistance(0);
    setPullState('idle');
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const container = getScrollContainer();
    if (!container) {
      console.warn('Pull-to-refresh: Could not find scroll container');
      return;
    }

    // Attach to the actual scroll container
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, getScrollContainer]);

  return {
    isRefreshing,
    pullDistance,
    pullState,
    refreshProgress: Math.min(pullDistance / threshold, 1),
  };
}

/**
 * Haptic feedback utility for iOS devices.
 * Provides tactile feedback for interactions.
 */
export function triggerHaptic(style: 'light' | 'medium' | 'heavy' | 'selection' = 'light') {
  if (typeof window === 'undefined') return;

  // Check if Haptic Feedback API is available (iOS 13+)
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 40,
      selection: 5,
    };
    navigator.vibrate(patterns[style]);
  }
}

/**
 * Swipe gesture detection hook.
 * Returns swipe direction and distance.
 */
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 60
) {
  const startX = useRef(0);
  const startY = useRef(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Safely check if touch exists
    const touch = e.touches?.[0];
    if (!touch) return;

    startX.current = touch.clientX;
    startY.current = touch.clientY;
    setIsSwiping(true);
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isSwiping) return;

    // Safely check if touch exists
    const touch = e.changedTouches?.[0];
    if (!touch) return;

    const endX = touch.clientX;
    const endY = touch.clientY;
    const deltaX = endX - startX.current;
    const deltaY = endY - startY.current;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > threshold && onSwipeRight) {
        onSwipeRight();
        triggerHaptic('selection');
      } else if (deltaX < -threshold && onSwipeLeft) {
        onSwipeLeft();
        triggerHaptic('selection');
      }
    }

    setIsSwiping(false);
  }, [isSwiping, threshold, onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

/**
 * Optimized scroll detection for hiding/showing elements.
 * Uses RAF throttling for performance.
 *
 * Supports both window and element-based scrolling to work with
 * overflow containers in the layout.
 */
export function useScrollDirection(elementRef?: React.RefObject<HTMLElement>) {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const scrollContainer = elementRef?.current || window;
    const getScrollY = () => {
      if (elementRef?.current) {
        return elementRef.current.scrollTop;
      }
      return window.scrollY;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = getScrollY();

          setIsAtTop(currentScrollY < 10);

          if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
            setScrollDirection('down');
          } else if (currentScrollY < lastScrollY.current) {
            setScrollDirection('up');
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [elementRef]);

  return { scrollDirection, isAtTop };
}

/**
 * Safe area insets for notched devices.
 * Returns computed safe area values.
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const computedStyle = getComputedStyle(document.documentElement);

    setInsets({
      top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
    });
  }, []);

  return insets;
}

/**
 * Mobile-optimized number formatting with abbreviated values.
 * Compresses large numbers for mobile screens.
 */
export function formatCompactNumber(value: number, locale: string = 'en'): string {
  const absValue = Math.abs(value);

  if (absValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (absValue >= 10_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toLocaleString(locale);
}

/**
 * Intersection observer hook for lazy loading and reveal animations.
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setIsIntersecting(entry.isIntersecting);
      }
    }, {
      threshold: 0.1,
      ...options,
    });

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);

  return { ref: setRef, isIntersecting };
}
