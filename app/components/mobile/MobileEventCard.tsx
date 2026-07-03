"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAuth, onAuthStateChanged } from "firebase/auth";
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

  return (
    <Link
      href={eventHref(card.title)}
      style={{
        padding: 0,
        textAlign: "inherit",
        borderRadius: 20,
        overflow: "hidden",
        background: "var(--tk-paper)",
        border: "1px solid var(--tk-line)",
        position: "relative",
        display: "block",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ position: "relative", height: 150, overflow: "hidden" }}>
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
        <button
          type="button"
          onClick={toggleFav}
          aria-label={fav ? "הסר ממועדפים" : "הוסף למועדפים"}
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
            background: "transparent",
            border: "none",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={fav ? "#B54653" : "rgba(0,0,0,0.35)"}
            stroke="#f5f1e8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      <div style={{ padding: 10 }}>
        {card.category && (
          <div style={{ fontSize: 10, color: "var(--tk-muted)", marginBottom: 2 }}>
            {card.category}
          </div>
        )}
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.2,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {abbrevCity(card.title)}
        </div>
        <div style={{ fontSize: 9, color: "var(--tk-muted)", marginTop: 2 }}>
          {hebDate(card.date)} · {card.location?.split(",")[1]?.trim() ?? card.location}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 4,
            color: "var(--tk-muted)",
          }}
        >
          <Icon.ticket size={11} color="var(--tk-muted)" />
          <span style={{ fontSize: 10, fontWeight: 600 }}>
            {card.ticketsLeft} כרטיסים
          </span>
        </div>
        <div
          className="tk-mono"
          style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}
        >
          {nis(card.price)}
        </div>
      </div>
    </Link>
  );
}
