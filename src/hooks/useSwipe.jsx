import { useRef, useState, useCallback } from "react";

/**
 * Uso:
 * const { bind, dragX } = useSwipe({ onLeft: next, onRight: prev, threshold: 40 });
 * <div {...bind}><img style={{ transform: `translateX(${dragX}px)` }} /></div>
 */
export default function useSwipe({
  onLeft,      // usuario desliza hacia la izquierda  -> siguiente
  onRight,     // usuario desliza hacia la derecha   -> anterior
  threshold = 40, // px para disparar swipe
} = {}) {
  const start = useRef({ x: 0, y: 0, active: false, lock: null });
  const [dragX, setDragX] = useState(0);

  const onPointerDown = useCallback((e) => {
    start.current = { x: e.clientX, y: e.clientY, active: true, lock: null };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!start.current.active) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;

    // bloquea eje cuando se decide
    if (!start.current.lock) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        start.current.lock = "x";
      } else if (Math.abs(dy) > 8) {
        start.current.lock = "y";
      }
    }

    if (start.current.lock === "x") {
      // evitá scroll horizontal del navegador
      e.preventDefault();
      setDragX(dx);
    }
  }, []);

  const finish = useCallback((dx, target, pid) => {
    if (Math.abs(dx) >= threshold) {
      if (dx < 0) onLeft?.();
      else onRight?.();
    }
    setDragX(0);
    target?.releasePointerCapture?.(pid);
    start.current = { x: 0, y: 0, active: false, lock: null };
  }, [onLeft, onRight, threshold]);

  const onPointerUp = useCallback((e) => {
    if (!start.current.active) return;
    const dx = e.clientX - start.current.x;
    finish(dx, e.currentTarget, e.pointerId);
  }, [finish]);

  const onPointerCancel = useCallback((e) => {
    if (!start.current.active) return;
    finish(0, e.currentTarget, e.pointerId);
  }, [finish]);

  return {
    dragX,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
