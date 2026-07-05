"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { apiFetch, searchHref } from "@/lib/platform";
import MobileShell from "./MobileShell";
import MobileTopBar from "./MobileTopBar";
import MobileSearchBar from "./MobileSearchBar";
import MobileCategoryRow from "./MobileCategoryRow";
import MobileEventCard, { MobileEventCardData } from "./MobileEventCard";
import MobileFilterSheet, {
  DEFAULT_FILTERS,
  FilterState,
  countActiveFilters,
  PRICE_MIN,
  PRICE_MAX,
} from "./MobileFilterSheet";

const AuthDialog = dynamic(() => import("./MobileAuthSheet"), { ssr: false });

type ApiCard = MobileEventCardData & { category?: string };

export default function MobileHome({ initialCards }: { initialCards?: ApiCard[] }) {
  const router = useRouter();
  const [cards, setCards] = useState<ApiCard[]>(initialCards ?? []);
  const [loading, setLoading] = useState(!initialCards);
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [userFavorites, setUserFavorites] = useState<Set<string | number>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterDraft, setFilterDraft] = useState<FilterState>(DEFAULT_FILTERS);
  const fetchedDefault = useRef(false);

  // Pagination: /api/events returns 12 cards per page with a cursor.
  const [lastDocId, setLastDocId] = useState<string | null>(
    initialCards?.length ? String(initialCards[initialCards.length - 1].id) : null,
  );
  const [hasMore, setHasMore] = useState((initialCards?.length ?? 0) >= 12);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
    // Skip the first fetch on mount if we have SSR cards and no category change yet.
    if (!fetchedDefault.current && initialCards && category === null) {
      fetchedDefault.current = true;
      return;
    }
    fetchedDefault.current = true;
    let cancelled = false;
    setLoading(true);
    const url = category
      ? `/api/events?category=${encodeURIComponent(category)}`
      : `/api/events`;
    apiFetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setCards(data.cards || []);
        setLastDocId(data.lastDocId ?? null);
        setHasMore(Boolean(data.hasMore) && Boolean(data.lastDocId));
      })
      .catch((err) => console.error("[mobile-home] fetch failed", err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category, initialCards]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || !lastDocId) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ lastDocId });
      if (category) params.set("category", category);
      const r = await apiFetch(`/api/events?${params.toString()}`);
      const data = await r.json();
      const next: ApiCard[] = data.cards || [];
      setCards((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...next.filter((c) => !seen.has(c.id))];
      });
      setLastDocId(data.lastDocId ?? null);
      setHasMore(Boolean(data.hasMore) && Boolean(data.lastDocId));
    } catch (err) {
      console.error("[mobile-home] load more failed", err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, lastDocId, category]);

  // Re-created per page (loadMore changes with the cursor); observe() fires
  // immediately for a visible sentinel, so short pages chain until the
  // viewport is filled.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || loading || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: "600px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, hasMore, loadMore]);

  // Split "venue, city" location strings into separate lists
  const { cities, venues } = useMemo(() => {
    const citySet = new Set<string>();
    const venueSet = new Set<string>();
    for (const c of cards) {
      if (!c.location) continue;
      const parts = c.location.split(",").map((p) => p.trim());
      venueSet.add(parts[0]);
      if (parts[1]) citySet.add(parts[1]);
    }
    return {
      cities: Array.from(citySet),
      venues: Array.from(venueSet),
    };
  }, [cards]);

  const filtered = useMemo(() => {
    let result = cards;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        `${c.title} ${c.location}`.toLowerCase().includes(q),
      );
    }
    if (filters.priceMin > PRICE_MIN)
      result = result.filter((c) => c.price >= filters.priceMin);
    if (filters.priceMax < PRICE_MAX)
      result = result.filter((c) => c.price <= filters.priceMax);
    if (filters.city !== "הכל")
      result = result.filter((c) => c.location?.includes(filters.city));
    if (filters.venue !== "הכל")
      result = result.filter((c) => c.location?.startsWith(filters.venue));
    if (filters.dateFrom || filters.dateTo) {
      const parseDMY = (s: string) => {
        const m = s?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        return m ? new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1])) : null;
      };
      const from = parseDMY(filters.dateFrom);
      const to   = parseDMY(filters.dateTo);
      result = result.filter((c) => {
        const cd = parseDMY(c.date);
        if (!cd) return true;
        if (from && cd < from) return false;
        if (to && cd > to) return false;
        return true;
      });
    }
    return result;
  }, [cards, search, filters]);

  const onSubmitSearch = useCallback(() => {
    if (search.trim()) router.push(searchHref(search.trim()));
  }, [router, search]);

  const openLogin = useCallback(() => setAuthOpen(true), []);

  return (
    <MobileShell>
      <MobileTopBar />
      <MobileSearchBar
        value={search}
        onChange={setSearch}
        onSubmit={onSubmitSearch}
        onOpenFilter={() => { setFilterDraft(filters); setFilterOpen(true); }}
        activeFilterCount={countActiveFilters(filters)}
      />
      <MobileCategoryRow selected={category} onSelect={setCategory} />

      <div
        style={{
          padding: "0 18px 6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          className="tk-mono"
          style={{ fontSize: 11, color: "var(--tk-muted)" }}
        >
          {filtered.length} מופעים
        </span>
        {(category !== null || search || countActiveFilters(filters) > 0) && (
          <button
            onClick={() => {
              setCategory(null);
              setSearch("");
              setFilters(DEFAULT_FILTERS);
              setFilterDraft(DEFAULT_FILTERS);
            }}
            style={{
              fontSize: 11,
              color: "var(--tk-blue)",
              fontWeight: 600,
              background: "transparent",
              border: 0,
              cursor: "pointer",
            }}
          >
            נקה הכל
          </button>
        )}
      </div>

      {loading ? (
        <div
          style={{
            padding: "40px 18px",
            textAlign: "center",
            color: "var(--tk-muted)",
            fontSize: 13,
          }}
        >
          טוען מופעים…
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: "40px 18px",
            textAlign: "center",
            color: "var(--tk-muted)",
            fontSize: 13,
          }}
        >
          אין תוצאות התואמות את החיפוש
        </div>
      ) : (
        <div
          style={{
            padding: "4px 14px 20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
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

      {!loading && hasMore && (
        <div
          ref={sentinelRef}
          style={{
            minHeight: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 18px 20px",
            color: "var(--tk-muted)",
            fontSize: 12,
          }}
        >
          {loadingMore ? "טוען עוד…" : ""}
        </div>
      )}

      <AuthDialog isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {filterOpen && (
        <MobileFilterSheet
          draft={filterDraft}
          setDraft={setFilterDraft}
          cities={cities}
          venues={venues}
          onClose={() => setFilterOpen(false)}
          onApply={() => { setFilters(filterDraft); setFilterOpen(false); }}
          onReset={() => {
            setFilterDraft(DEFAULT_FILTERS);
            setFilters(DEFAULT_FILTERS);
          }}
        />
      )}
    </MobileShell>
  );
}
