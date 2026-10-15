"use client";

import React, { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import MobileShell from "./MobileShell";
import MobileTopBar from "./MobileTopBar";
import MobileSearchBar from "./MobileSearchBar";
import MobileCategoryRow, { MOBILE_CATEGORIES } from "./MobileCategoryRow";
import MobileEventCard, {
  MobileEventCardData,
  MobileEventGridSkeleton,
  MOBILE_CARD_GRID,
} from "./MobileEventCard";
import MobileFilterSheet, {
  DEFAULT_FILTERS,
  FilterState,
  applyCardFilters,
  citiesAndVenues,
  countActiveFilters,
} from "./MobileFilterSheet";

const AuthDialog = dynamic(() => import("./MobileAuthSheet"), { ssr: false });

const outlineButton: React.CSSProperties = {
  marginTop: 16,
  height: 42,
  padding: "0 18px",
  borderRadius: 10,
  border: "1px solid var(--ink)",
  background: "transparent",
  color: "var(--ink)",
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
};

/** The favorites tab: the home screen's search, categories and filters over
 *  the events the user has hearted. */
export default function MobileFavorites({
  events,
  loading,
  notSignedIn,
}: {
  events: MobileEventCardData[];
  loading: boolean;
  notSignedIn?: boolean;
}) {
  const [authOpen, setAuthOpen] = useState(false);
  const openLogin = useCallback(() => setAuthOpen(true), []);
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterDraft, setFilterDraft] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const { cities, venues } = useMemo(() => citiesAndVenues(events), [events]);
  const filtered = useMemo(() => {
    const inCategory = category ? events.filter((e) => e.category === category) : events;
    return applyCardFilters(inCategory, search, filters);
  }, [events, category, search, filters]);

  const activeFilters = countActiveFilters(filters);
  const dirty = category !== null || search !== "" || activeFilters > 0;
  const clearAll = () => {
    setCategory(null);
    setSearch("");
    setFilters(DEFAULT_FILTERS);
    setFilterDraft(DEFAULT_FILTERS);
  };
  const categoryLabel = MOBILE_CATEGORIES.find((c) => c.cat === category)?.label ?? category;

  return (
    <MobileShell>
      <MobileTopBar />

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg)",
          borderBottom: "1px solid var(--line)",
          paddingBottom: 2,
        }}
      >
        <MobileSearchBar
          value={search}
          onChange={setSearch}
          onOpenFilter={() => {
            setFilterDraft(filters);
            setFilterOpen(true);
          }}
          activeFilterCount={activeFilters}
        />
        <MobileCategoryRow selected={category} onSelect={setCategory} />
      </div>

      <div
        style={{
          padding: "22px 20px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          {category === null ? "מועדפים" : `מועדפים · ${categoryLabel}`}
        </h1>
        {dirty && (
          <button
            onClick={clearAll}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--brand)",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontFamily: "inherit",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            נקה הכל
          </button>
        )}
      </div>

      {loading ? (
        <MobileEventGridSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <div style={{ padding: "56px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {notSignedIn
              ? "התחברו כדי לשמור מופעים במועדפים"
              : dirty
                ? "אין תוצאות התואמות את החיפוש"
                : "עוד לא סימנת מופעים כמועדפים"}
          </div>
          {notSignedIn ? (
            <button className="press" onClick={openLogin} style={outlineButton}>
              התחברות
            </button>
          ) : (
            dirty && (
              <button className="press" onClick={clearAll} style={outlineButton}>
                נקה הכל
              </button>
            )
          )}
        </div>
      ) : (
        <div style={MOBILE_CARD_GRID}>
          {filtered.map((e) => (
            <MobileEventCard key={e.id} card={e} initialFavorited openLoginDialog={openLogin} />
          ))}
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
          onApply={() => {
            setFilters(filterDraft);
            setFilterOpen(false);
          }}
          onReset={() => {
            setFilterDraft(DEFAULT_FILTERS);
            setFilters(DEFAULT_FILTERS);
          }}
        />
      )}
    </MobileShell>
  );
}
