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
 * Returns refresh state and props to spread on the container.
 */
export function usePullToRefresh(onRefresh: () => Promise<void>, enabled = true) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);

  const threshold = 80; // Pull distance to trigger refresh
  const maxPull = 120; // Maximum pull distance

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 5) return;

    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || !enabled) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      // Apply elastic resistance (logarithmic feel)
      const elasticDistance = Math.min(
        Math.log(distance + 1) * 20,
        maxPull
      );
      setPullDistance(elasticDistance);

      // Prevent default scroll if we're pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [enabled, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;

    isDragging.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(0);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
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
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setIsSwiping(true);
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isSwiping) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
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

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, {
      threshold: 0.1,
      ...options,
    });

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);

  return { ref: setRef, isIntersecting };
}
