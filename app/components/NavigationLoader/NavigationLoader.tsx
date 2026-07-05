"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationLoader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const currentSearch = searchParams.toString();

    const handleClick = (e: MouseEvent) => {
      // A handler that called preventDefault() cancelled the navigation —
      // e.g. the favorite heart inside an event-card link. No route change
      // will follow, so showing the bar would leave it spinning forever.
      if (e.defaultPrevented) return;
      // Modified/middle clicks open a new tab; this page never navigates.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && !link.target && !link.hasAttribute("download")) {
        const url = new URL(link.href);
        if (url.origin !== window.location.origin) return;

        const samePath = url.pathname === pathname;
        const sameSearch = url.search.replace(/^\?/, "") === currentSearch;
        if (samePath && sameSearch) return;

        setLoading(true);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[9999]">
      <div className="h-full bg-primary animate-loading-bar"></div>
    </div>
  );
}
