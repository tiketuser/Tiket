"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../../../firebase";
import MobileShell from "./MobileShell";
import { Icon } from "./Icon";
import { hebDate, nis } from "./format";
import { resolveEventImage } from "@/utils/defaultImages";

const AuthDialog = dynamic(() => import("./MobileAuthSheet"), { ssr: false });

type Order = {
  id: string;
  artist: string;
  date: string;
  amount: number;
  status: "נקנה" | "נמכר";
  when: string;
  imageUrl: string;
};

function relativeWhen(ts: number | null): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const day = 86400_000;
  if (diff < day) return "היום";
  if (diff < 2 * day) return "אתמול";
  if (diff < 30 * day) return `לפני ${Math.round(diff / day)} ימים`;
  if (diff < 365 * day) return `לפני ${Math.round(diff / (30 * day))} חודשים`;
  return `לפני ${Math.round(diff / (365 * day))} שנים`;
}

function getTime(t: unknown): number | null {
  if (!t) return null;
  if (typeof t === "object" && t && "seconds" in (t as any)) {
    return (t as { seconds: number }).seconds * 1000;
  }
  if (typeof t === "string" || typeof t === "number") {
    const d = new Date(t).getTime();
    return Number.isNaN(d) ? null : d;
  }
  return null;
}

export default function MobileProfile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState({ bought: 0, sold: 0 });

  useEffect(() => {
    return onAuthStateChanged(getAuth(), (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    let cancelled = false;
    (async () => {
      try {
        const [boughtSnap, soldSnap] = await Promise.all([
          getDocs(
            query(
              collection(db!, "transactions"),
              where("buyerId", "==", user.uid),
              limit(50),
            ),
          ),
          getDocs(
            query(
              collection(db!, "transactions"),
              where("sellerId", "==", user.uid),
              limit(50),
            ),
          ),
        ]);
        if (cancelled) return;
        const bought = boughtSnap.docs;
        const sold = soldSnap.docs;
        setCounts({ bought: bought.length, sold: sold.length });

        const ranked = [
          ...bought.map((d) => ({ doc: d, status: "נקנה" as const })),
          ...sold.map((d) => ({ doc: d, status: "נמכר" as const })),
        ]
          .map(({ doc: d, status }) => {
            const data = d.data();
            const ts = getTime(data.createdAt || data.completedAt);
            return {
              id: d.id,
              eventId: (data.eventId as string) || "",
              amount:
                (data.ticketPrice as number) ||
                (data.amount as number) ||
                0,
              status,
              when: relativeWhen(ts),
              _ts: ts ?? 0,
            };
          })
          .sort((a, b) => b._ts - a._ts)
          .slice(0, 4);

        const eventCache = new Map<
          string,
          { artist: string; date: string; imageUrl: string; category: string }
        >();
        await Promise.all(
          Array.from(new Set(ranked.map((r) => r.eventId).filter(Boolean))).map(
            async (eid) => {
              try {
                const snap = await getDoc(doc(db!, "events", eid));
                if (!snap.exists()) return;
                const ed = snap.data() as any;
                eventCache.set(eid, {
                  artist: (ed.artist as string) || "",
                  date: (ed.date as string) || "",
                  imageUrl: (ed.imageUrl as string) || "",
                  category: (ed.category as string) || "",
                });
              } catch {
                /* skip; row falls back to placeholder */
              }
            },
          ),
        );

        const orderItems: Order[] = await Promise.all(
          ranked.map(async (r) => {
            const ev = eventCache.get(r.eventId);
            const imageUrl = await resolveEventImage(
              ev?.imageUrl,
              ev?.category,
            );
            return {
              id: r.id,
              artist: ev?.artist || "",
              date: ev?.date || "",
              amount: r.amount,
              status: r.status,
              when: r.when,
              imageUrl,
            };
          }),
        );
        if (cancelled) return;
        setOrders(orderItems);
      } catch (err) {
        console.error("[mobile-profile] fetch orders failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const initials = (() => {
    const name = user?.displayName || user?.email || "?";
    const parts = name.split(/\s+/);
    return ((parts[0]?.[0] || "?") + (parts[1]?.[0] || "")).toUpperCase();
  })();

  const handleSignOut = async () => {
    try {
      await signOut(getAuth());
      router.push("/");
    } catch (err) {
      console.error("[mobile-profile] sign-out failed", err);
    }
  };

  if (authReady && !user) {
    return (
      <MobileShell>
        <div
          style={{
            padding: "60px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "var(--tk-paper)",
              border: "1px solid var(--tk-line-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--tk-muted)",
            }}
          >
            <Icon.user size={36} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              התחבר לחשבון שלך
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--tk-muted)",
                maxWidth: 240,
                lineHeight: 1.5,
              }}
            >
              גש להיסטוריה שלך, מועדפים, וכרטיסים שקנית או מכרת
            </div>
          </div>
          <button
            onClick={() => setAuthOpen(true)}
            style={{
              padding: "11px 22px",
              borderRadius: 999,
              background: "var(--tk-ink)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            התחבר
          </button>
        </div>
        <AuthDialog isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      {/* Hero */}
      <div
        style={{
          padding: "20px 18px 22px",
          borderBottom: "1px solid var(--tk-line)",
          background: "var(--tk-bg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: "var(--tk-ink)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt={user.displayName || ""}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.displayName || "משתמש Tiket"}
            </h1>
            <div
              className="tk-mono"
              style={{
                fontSize: 11,
                color: "var(--tk-muted)",
                marginTop: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              dir="ltr"
            >
              {user?.email || ""}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "1fr 1px 1fr",
            gap: 0,
            alignItems: "stretch",
            padding: "12px 6px",
          }}
        >
          <ProfileStat num={counts.bought} label="כרטיסים שקניתי" />
          <div
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, var(--tk-line-strong) 0 4px, transparent 4px 8px)",
            }}
          />
          <ProfileStat num={counts.sold} label="כרטיסים שמכרתי" />
        </div>
      </div>

      <div
        style={{
          padding: "18px 18px 0",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Orders history */}
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div style={sectionTitleStyle}>היסטוריית הזמנות</div>
            <button
              onClick={() => router.push("/MyTickets")}
              style={{
                background: "none",
                border: "none",
                fontSize: 11,
                color: "var(--tk-blue)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              הצג הכל
            </button>
          </div>
          <div
            style={{
              background: "var(--tk-paper)",
              border: "1px solid var(--tk-line-strong)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {orders.length === 0 ? (
              <div
                style={{
                  padding: "20px 14px",
                  textAlign: "center",
                  color: "var(--tk-muted)",
                  fontSize: 12,
                }}
              >
                עדיין אין הזמנות
              </div>
            ) : (
              orders.map((o, i) => (
                <div
                  key={o.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderTop: i === 0 ? "none" : "1px solid var(--tk-line)",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 50,
                      borderRadius: 4,
                      background: "#1A1A1A",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {o.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={o.imageUrl}
                        alt={o.artist || ""}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {o.artist}
                    </div>
                    <div
                      className="tk-mono"
                      style={{
                        fontSize: 10,
                        color: "var(--tk-muted)",
                        marginTop: 2,
                      }}
                    >
                      {o.when}
                      {o.date ? ` · ${hebDate(o.date)}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "start" }}>
                    <div
                      className="tk-mono"
                      style={{ fontSize: 13, fontWeight: 700 }}
                    >
                      {nis(o.amount)}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        marginTop: 2,
                        color:
                          o.status === "נמכר"
                            ? "var(--tk-blue)"
                            : "var(--tk-muted)",
                      }}
                    >
                      {o.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <button
          onClick={handleSignOut}
          style={{
            marginTop: 4,
            padding: "14px",
            background: "transparent",
            border: "1px solid var(--tk-line-strong)",
            borderRadius: 12,
            color: "var(--tk-blue)",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          התנתק
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "6px 0 2px",
            fontSize: 10,
            color: "var(--tk-muted)",
            opacity: 0.7,
          }}
        >
          <button
            onClick={() => router.push("/Terms")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
              font: "inherit",
              color: "inherit",
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            תנאי שימוש
          </button>
          <span aria-hidden style={{ opacity: 0.5 }}>·</span>
          <button
            onClick={() => router.push("/Privacy")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
              font: "inherit",
              color: "inherit",
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            מדיניות פרטיות
          </button>
        </div>

        <div
          className="tk-mono"
          style={{
            textAlign: "center",
            fontSize: 9,
            color: "var(--tk-muted)",
            letterSpacing: "0.12em",
            padding: "4px 0 12px",
          }}
        >
          ◆ TIKET · v1.0.0
        </div>
      </div>
    </MobileShell>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 10,
  color: "var(--tk-ink)",
};

function ProfileStat({ num, label }: { num: number; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "4px 12px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {num}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}
