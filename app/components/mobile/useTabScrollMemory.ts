"use client";

import { useEffect } from "react";

/**
 * Remembers how far down each bottom-nav tab was scrolled, like a native tab
 * bar: leave Home halfway down, visit Favorites, come back and Home is where
 * you left it.
 *
 * Positions are kept per tab root path, in memory and sessionStorage (so an
 * app reload in the same session keeps them). Tab pages load their data after
 * mounting, so the restore waits until the page is tall enough, gives up
 * after a few seconds (landing as far down as the content allows), and stops
 * the moment the user touches or scrolls themselves.
 */
const KEY = "tk-tab-scroll";
let memo: Record<string, number> | null = null;

function load(): Record<string, number> {
  if (memo) return memo;
  try {
    memo = JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    memo = {};
  }
  return memo!;
}

function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(memo || {}));
  } catch {
    /* private mode: memory only */
  }
}

export function forgetTabScroll(path: string) {
  delete load()[path];
  save();
}

export function useTabScrollMemory(path: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const positions = load();
    const target = positions[path] ?? 0;

    let restoring = target > 0;
    let frame = 0;
    const cancel = () => {
      restoring = false;
      cancelAnimationFrame(frame);
    };

    // Tab switches skip Next's scroll-to-top, so a tab with nothing saved
    // must start at the top itself rather than inherit the last tab's offset.
    if (target <= 0) window.scrollTo(0, 0);

    if (target > 0) {
      const started = performance.now();
      const tryRestore = () => {
        if (!restoring) return;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const timedOut = performance.now() - started > 3000;
        if (max >= target || timedOut) {
          window.scrollTo(0, Math.min(target, Math.max(0, max)));
          restoring = false;
          return;
        }
        frame = requestAnimationFrame(tryRestore);
      };
      tryRestore();
      window.addEventListener("touchstart", cancel, { once: true, passive: true });
      window.addEventListener("wheel", cancel, { once: true, passive: true });
    }

    let pending = false;
    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        // Don't overwrite the saved spot while still waiting to restore it.
        if (restoring) return;
        positions[path] = window.scrollY;
        save();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancel();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("wheel", cancel);
    };
  }, [path, enabled]);
}
