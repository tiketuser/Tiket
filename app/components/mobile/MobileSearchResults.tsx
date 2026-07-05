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
import MobileEventCard, { MobileEventCardData } from "./MobileEventCard";
import { Icon } from "./Icon";

const AuthDialog = dynamic(() => import("./MobileAuthSheet"), { ssr: false });

type ApiCard = MobileEventCardData & { category?: string };

export default function MobileSearchResults({ query }: { query: string }) {
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "calc(10px + var(--sat, env(safe-area-inset-top, 0px))) 18px 10px",
        }}
      >
        <button
          onClick={() => router.push("/")}
          aria-label="חזרה"
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: "var(--tk-paper)",
            border: "1px solid var(--tk-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon.chev size={16} />
        </button>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            flex: 1,
          }}
        >
          תוצאות חיפוש
        </div>
      </div>

      <MobileSearchBar
        value={search}
        onChange={setSearch}
        onSubmit={onSubmitSearch}
      />

      <div style={{ padding: "0 18px 6px" }}>
        <span
          className="tk-mono"
          style={{ fontSize: 11, color: "var(--tk-muted)" }}
        >
          {filtered.length} תוצאות{query ? ` עבור "${query}"` : ""}
        </span>
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
