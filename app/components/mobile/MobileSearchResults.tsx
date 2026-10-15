"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { apiFetch, searchHref } from "@/lib/platform";
import MobileShell from "./MobileShell";
import MobileSearchBar from "./MobileSearchBar";
import MobileEventCard, {
  MobileEventCardData,
  MobileEventGridSkeleton,
  MOBILE_CARD_GRID,
} from "./MobileEventCard";
import Skeleton from "../Skeleton/Skeleton";
import { Icon } from "./Icon";

const AuthDialog = dynamic(() => import("./MobileAuthSheet"), { ssr: false });

type ApiCard = MobileEventCardData & { category?: string };

export default function MobileSearchResults({
  query,
  title = "תוצאות חיפוש",
}: {
  query: string;
  title?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [allCards, setAllCards] = useState<ApiCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [userFavorites, setUserFavorites] = useState<Set<string | number>>(
    new Set(),
  );

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (user) => {
      if (user && db) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          const favs = snap.exists() ? snap.data().favorites || [] : [];
          setUserFavorites(new Set(favs));
        } catch {
          // ignore
        }
      } else {
        setUserFavorites(new Set());
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(`/api/events`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setAllCards(data.cards || []);
      })
      .catch((err) => console.error("[mobile-search] fetch failed", err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSearch(query);
  }, [query]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allCards;
    return allCards.filter((c) =>
      `${c.title} ${c.location}`.toLowerCase().includes(q),
    );
  }, [allCards, search]);

  const onSubmitSearch = useCallback(() => {
    const q = search.trim();
    if (q) router.replace(searchHref(q));
  }, [router, search]);

  const openLogin = useCallback(() => setAuthOpen(true), []);

  return (
    <MobileShell>
      <SearchHeader title={title} onBack={() => router.push("/")} />

      <MobileSearchBar value={search} onChange={setSearch} onSubmit={onSubmitSearch} />

      {loading ? (
        <>
          <CountLine />
          <MobileEventGridSkeleton />
        </>
      ) : (
        <>
          <CountLine>
            {filtered.length} תוצאות{query ? ` עבור "${query}"` : ""}
          </CountLine>
          {filtered.length === 0 ? (
            <div style={{ padding: "56px 40px", textAlign: "center", fontSize: 16, fontWeight: 600 }}>
              אין תוצאות התואמות את החיפוש
            </div>
          ) : (
            <div style={MOBILE_CARD_GRID}>
              {filtered.map((c) => (
                <MobileEventCard
                  key={c.id}
                  card={c}
                  initialFavorited={userFavorites.has(c.id)}
                  openLoginDialog={openLogin}
                />
              ))}
            </div>
          )}
        </>
      )}

      <AuthDialog isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </MobileShell>
  );
}

function SearchHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        height: 52,
        padding: "0 16px",
        marginTop: "var(--sat, env(safe-area-inset-top, 0px))",
      }}
    >
      <button
        className="press round"
        onClick={onBack}
        aria-label="חזרה"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--surface-2)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--ink)",
        }}
      >
        <Icon.chevR size={17} />
      </button>
      <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h1>
      <span />
    </div>
  );
}

/** The results count under the search box; empty children keep its height
 *  while loading so the grid below doesn't move. */
function CountLine({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ padding: "16px 20px 14px", height: 19, boxSizing: "content-box", fontSize: 13, color: "var(--muted)" }}>
      {children ?? <Skeleton style={{ width: 110, height: 11, borderRadius: 4, marginTop: 4 }} />}
    </div>
  );
}

/** Route-level loading state for search and "all events": the same header,
 *  search box and card grid as MobileSearchResults, with nothing loaded. */
export function MobileSearchResultsSkeleton({ title = "תוצאות חיפוש" }: { title?: string }) {
  return (
    <MobileShell>
      <SearchHeader title={title} />
      <MobileSearchBar value="" onChange={() => undefined} />
      <CountLine />
      <MobileEventGridSkeleton />
    </MobileShell>
  );
}
