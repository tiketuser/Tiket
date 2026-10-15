"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { eventHref } from "@/lib/platform";
import { encodeImageUrl } from "@/utils/defaultImages";
import { Icon } from "./Icon";
import { hebDate, nis, abbrevCity } from "./format";

export type MobileEventCardData = {
  id: string | number;
  title: string;
  imageSrc: string;
  date: string;
  location: string;
  price: number;
  maxPrice?: number;
  ticketsLeft: number;
  category?: string;
};

export default function MobileEventCard({
  card,
  initialFavorited = false,
  openLoginDialog,
}: {
  card: MobileEventCardData;
  initialFavorited?: boolean;
  openLoginDialog: () => void;
}) {
  const [fav, setFav] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  // Favorites load asynchronously after first render (auth + Firestore), so the
  // initial snapshot can be stale. Re-sync when the resolved value arrives,
  // otherwise a favorited event shows an empty heart and the first tap removes
  // the favorite the user thinks they are adding.
  useEffect(() => {
    setFav(initialFavorited);
  }, [initialFavorited]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      openLoginDialog();
      return;
    }
    if (!db) return;
    setBusy(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const exists = snap.exists();
      const data = exists ? snap.data() : { favorites: [] };
      const has = (data.favorites || []).includes(card.id);
      await setDoc(
        userRef,
        { favorites: has ? arrayRemove(card.id) : arrayUnion(card.id) },
        { merge: true },
      );
      setFav(!has);
    } catch (err) {
      console.error("[mobile-card] toggleFav failed", err);
    } finally {
      setBusy(false);
    }
  };

  const imgSrc = card.imageSrc ? encodeImageUrl(card.imageSrc) : "";
  const city = card.location?.split(",")[1]?.trim() ?? card.location;

  return (
    <Link
      href={eventHref(card.title)}
      style={{
        display: "block",
        minWidth: 0,
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
      }}
    >
      <div
        className="press"
        style={{
          position: "relative",
          aspectRatio: "1 / 1.08",
          borderRadius: "var(--r-card)",
          overflow: "hidden",
          background: "var(--surface-2)",
        }}
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={card.title}
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            style={{ objectFit: "cover" }}
            unoptimized
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#1A1A1A" }} />
        )}
        {/* hairline ring over the image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "var(--r-card)",
            boxShadow: "inset 0 0 0 1px rgba(20,20,19,.06)",
            pointerEvents: "none",
          }}
        />
        <button
          type="button"
          onClick={toggleFav}
          aria-label={fav ? "הסר ממועדפים" : "הוסף למועדפים"}
          className="press"
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
            background: "transparent",
            border: "none",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,.35))",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={fav ? "var(--brand)" : "rgba(20,20,19,.28)"}>
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div style={{ padding: "10px 2px 0" }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.3,
            letterSpacing: "-0.005em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {abbrevCity(card.title)}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--muted)",
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {hebDate(card.date)} · {city}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 6,
          }}
        >
          <span className="num" style={{ fontSize: 15, fontWeight: 700 }}>
            {card.maxPrice && card.maxPrice > card.price
              ? `${nis(card.price)} – ${nis(card.maxPrice)}`
              : nis(card.price)}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            <Icon.ticket size={14} color="var(--muted)" />
            <span className="num">{card.ticketsLeft}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
