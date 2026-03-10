import { useState, useEffect, useCallback } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface BreakpointValues {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

const MOBILE_MAX = 640;
const TABLET_MAX = 1024;

/**
 * Hook to detect responsive breakpoints
 * - Mobile: < 640px
 * - Tablet: 640px - 1024px
 * - Desktop: > 1024px
 */
export function useBreakpoint(): BreakpointValues {
  const getValues = useCallback((): BreakpointValues => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    let breakpoint: Breakpoint;
    if (width < MOBILE_MAX) {
      breakpoint = 'mobile';
    } else if (width < TABLET_MAX) {
      breakpoint = 'tablet';
    } else {
      breakpoint = 'desktop';
    }

    return {
      breakpoint,
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop',
      width,
      height,
    };
  }, []);

  const [values, setValues] = useState<BreakpointValues>(getValues);

  useEffect(() => {
    const handleResize = () => {
      setValues(getValues());
    };

    // Use ResizeObserver for more accurate detection
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(document.documentElement);

    // Also listen to window resize as fallback
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [getValues]);

  return values;
}

/**
 * Simple hook to check if current viewport is mobile
 */
export function useIsMobile(): boolean {
  const { isMobile } = useBreakpoint();
  return isMobile;
}

/**
 * Hook to check if viewport is touch device
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      );
    };

    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });

    return () => {
      window.removeEventListener('touchstart', checkTouch);
    };
  }, []);

  return isTouch;
}

export default useBreakpoint;
