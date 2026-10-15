"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Drag a bottom sheet down to dismiss it, like native iOS/Android sheets.
 *
 * Pass `ref` as the sheet panel's ref and add `offset` to its translateY. A drag
 * starts only when the touch begins with nothing above it scrolled, so a
 * scrolled sheet scrolls back up first; range sliders and anything marked
 * `data-no-swipe` never start one. Released past ~120px, or flicked down,
 * the sheet slides out and then `onClose` runs; otherwise it springs back.
 */
export function useSwipeToClose(onClose: () => void) {
  // Callback ref: sheets that render nothing while closed get the listeners
  // attached when the panel actually mounts.
  const [el, ref] = useState<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!el) return;
    setOffset(0);
    let tracking = false;
    let active = false;
    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;

    const scrolledAbove = (target: EventTarget | null) => {
      for (let n = target as HTMLElement | null; n; n = n.parentElement) {
        if (n.scrollTop > 0) return true;
        if (n === el) break;
      }
      return false;
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.target as HTMLElement;
      if (t.closest?.('input[type="range"], [data-no-swipe]') || scrolledAbove(t)) return;
      tracking = true;
      active = false;
      startY = lastY = e.touches[0].clientY;
      lastT = e.timeStamp;
      velocity = 0;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const y = e.touches[0].clientY;
      const d = y - startY;
      if (!active) {
        if (d < -4) {
          tracking = false; // scrolling up: leave it to the browser
          return;
        }
        if (d < 8) return;
        active = true;
        setDragging(true);
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
      e.preventDefault();
      const dt = e.timeStamp - lastT;
      if (dt > 0) velocity = (y - lastY) / dt;
      lastY = y;
      lastT = e.timeStamp;
      setOffset(Math.max(0, d - 8));
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (!active) return;
      active = false;
      setDragging(false);
      const d = lastY - startY;
      if (d > 120 || (velocity > 0.5 && d > 30)) {
        setOffset(el.offsetHeight + 40);
        window.setTimeout(() => closeRef.current(), 200);
      } else {
        setOffset(0);
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [el]);

  return {
    ref,
    offset,
    /** Use instead of the sheet's own transform transition while dragging. */
    transition: dragging ? "none" : "transform .22s cubic-bezier(.2,.8,.2,1)",
    /** 1 → 0 as the sheet is dragged away; for fading the backdrop. */
    progress: Math.max(0, 1 - offset / 400),
  };
}
