/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef } from "react";

/**
 * useThrottledCallback
 *
 * Throttles a callback function to fire at most once per delay interval.
 * Useful for high-frequency events like scroll.
 *
 * @param callback - Function to throttle
 * @param delay - Minimum milliseconds between calls (default 300ms)
 * @returns Throttled version of callback
 *
 * @example
 * const throttledScroll = useThrottledCallback(handleScroll, 300);
 * <List onScroll={throttledScroll} />
 */
export function useThrottledCallback(
  callback: (...args: any[]) => any,
  delay: number = 300
): (...args: any[]) => any {
  const throttledRef = useRef(callback);
  const lastRanRef = useRef(Date.now());

  useEffect(() => {
    throttledRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: any[]) => {
      const now = Date.now();
      if (now - lastRanRef.current >= delay) {
        throttledRef.current(...args);
        lastRanRef.current = now;
      }
    },
    [delay]
  );
}
