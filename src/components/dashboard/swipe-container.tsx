"use client";

import { useRef, useCallback } from "react";

interface SwipeContainerProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function SwipeContainer({ children, onSwipeLeft, onSwipeRight }: SwipeContainerProps) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (startX.current === null || startY.current === null) return;

      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;

      // Only trigger if horizontal swipe is dominant and exceeds threshold
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) onSwipeLeft();
        else onSwipeRight();
      }

      startX.current = null;
      startY.current = null;
    },
    [onSwipeLeft, onSwipeRight]
  );

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  );
}
