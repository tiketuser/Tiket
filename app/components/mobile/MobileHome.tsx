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

const AuthDialog = dynamic(
  () => import("../Dialogs/AuthDialog/AuthDialog"),
  { ssr: false },
);

type ApiCard = MobileEventCardData & { category?: string };

export default function MobileHome({ initialCards }: { initialCards?: ApiCard[] }) {
  const router = useRouter();
  const [cards, setCards] = useState<ApiCard[]>(initialCards ?? []);
  const [loading, setLoading] = useState(!initialCards);
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [userFavorites, setUserFavorites] = useState<Set<string | number>>(new Set());
  const fetchedDefault = useRef(false);

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
      })
      .catch((err) => console.error("[mobile-home] fetch failed", err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category, initialCards]);

  const filtered = useMemo(() => {
    if (!search.trim()) return cards;
    const q = search.toLowerCase();
    return cards.filter((c) => {
      const hay = `${c.title} ${c.location}`.toLowerCase();
      return hay.includes(q);
    });
  }, [cards, search]);

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
        {(category !== null || search) && (
          <button
            onClick={() => {
              setCategory(null);
              setSearch("");
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

      <AuthDialog isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </MobileShell>
  );
}
