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
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && !link.target) {
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
