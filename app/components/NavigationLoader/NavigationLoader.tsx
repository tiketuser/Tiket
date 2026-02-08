"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationLoader() {
  const [loading, setLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setLoading(false);
    setShowSpinner(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    let spinnerTimer: NodeJS.Timeout;

    const handleStart = () => {
      setLoading(true);
      // Show spinner after 500ms if still loading
      spinnerTimer = setTimeout(() => {
        setShowSpinner(true);
      }, 500);
    };

    const handleComplete = () => {
      setLoading(false);
      setShowSpinner(false);
      clearTimeout(spinnerTimer);
    };

    // Listen for link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && !link.target) {
        const url = new URL(link.href);
        // Only show loader for internal navigation
        if (
          url.origin === window.location.origin &&
          url.pathname !== pathname
        ) {
          handleStart();
        }
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      clearTimeout(spinnerTimer);
    };
  }, [pathname]);

  return (
    <>
      {/* Top loading bar */}
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 z-[9999]">
          <div className="h-full bg-primary animate-loading-bar"></div>
        </div>
      )}

      {/* Full page spinner for slow loads */}
      {showSpinner && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9998] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-primary text-lg font-semibold">טוען...</p>
          </div>
        </div>
      )}
    </>
  );
}
