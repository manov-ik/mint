import { useCallback, useRef, useState } from "react";

export function useLongPress(onLongPress: () => void, ms = 500) {
  const timerRef = useRef<NodeJS.Timeout>(null);
  const isLongPressActive = useRef(false);

  const start = useCallback((e: any) => {
    isLongPressActive.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressActive.current = true;
      onLongPress();
    }, ms);
  }, [onLongPress, ms]);

  const stop = useCallback((e: any) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const move = useCallback((e: any) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isLongPressActive.current) {
      e.stopPropagation();
      e.preventDefault();
      isLongPressActive.current = false;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onMouseMove: move,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: move,
    onClickCapture: handleClick, // Intercept the click before it reaches the normal onClick
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isLongPressActive.current = true;
      onLongPress();
    }
  };
}
