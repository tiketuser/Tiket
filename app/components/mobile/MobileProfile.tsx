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
import { apiFetch } from "@/lib/platform";
import MobileShell from "./MobileShell";
import Skeleton from "../Skeleton/Skeleton";
import { Icon } from "./Icon";
import { hebDate, nis } from "./format";
import { resolveEventImage } from "@/utils/defaultImages";
import { isAdminUser } from "@/lib/isAdminClient";
import { OTA_CHANNEL, getOtaBundleVersion } from "@/lib/ota";
import MobileProfileSheet, { type ProfileSheet } from "./MobileProfileSheets";
import MobileAdminGrid from "./MobileAdminGrid";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState({ bought: 0, sold: 0 });
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [otaVersion, setOtaVersion] = useState<string | null>(null);
  const [tab, setTab] = useState<"orders" | "acct" | "admin">("orders");
  const [sheet, setSheet] = useState<ProfileSheet | null>(null);

  useEffect(() => {
    // Staging-only build badge: show which OTA bundle is live so a push can be
    // confirmed on-device. Re-checks on foreground (a staged update applies on
    // the next resume, bumping this number).
    if (OTA_CHANNEL !== "staging") return;
    let cancelled = false;
    const refresh = () =>
      getOtaBundleVersion().then((v) => {
        if (!cancelled) setOtaVersion(v);
      });
    refresh();
    let remove: (() => void) | undefined;
    import("@capacitor/app")
      .then(({ App }) => App.addListener("resume", refresh))
      .then((h) => {
        remove = () => void h.remove();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);

  useEffect(() => {
    return onAuthStateChanged(getAuth(), (u) => {
      setUser(u);
      setAuthReady(true);
      isAdminUser(u).then(setIsAdmin);
    });
  }, []);

  useEffect(() => {
    // Clear the previous account's data on any auth change so a shared device
    // never shows one user's orders/counts to the next signed-in user.
    setOrders([]);
    setOrdersLoading(Boolean(user && db));
    setCounts({ bought: 0, sold: 0 });
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
      } finally {
        if (!cancelled) setOrdersLoading(false);
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

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "האם אתה בטוח שברצונך למחוק את החשבון? כל הנתונים שלך יימחקו. פעולה זו אינה הפיכה.",
      )
    ) {
      return;
    }
    const currentUser = getAuth().currentUser;
    if (!currentUser) return;
    try {
      // Server-side deletion (Admin SDK): removes the profile doc then the auth
      // account, with no requires-recent-login trap that could strand a live
      // account after the doc was already deleted.
      const idToken = await currentUser.getIdToken();
      const res = await apiFetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        throw new Error(`server responded ${res.status}`);
      }
      await signOut(getAuth());
      router.push("/");
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message?: string }).message
          : String(err);
      alert("מחיקת החשבון נכשלה: " + (msg || err));
    }
  };

  const memberSince = user?.metadata.creationTime
    ? new Date(user.metadata.creationTime).getFullYear()
    : null;

  if (!authReady) return <ProfileSkeleton />;

  if (!user) {
    return (
      <MobileShell>
        <div
          style={{
            padding: "calc(70px + var(--sat, env(safe-area-inset-top, 0px))) 32px 60px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            textAlign: "center",
          }}
        >
          <span
            className="round"
            style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
            }}
          >
            <Icon.user size={38} />
          </span>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>התחברו לחשבון</div>
          <div style={{ fontSize: 14, color: "var(--muted)", maxWidth: 260, lineHeight: 1.5 }}>
            נדרש חשבון כדי לצפות בפרופיל, בהזמנות ובכרטיסים שקניתם או מכרתם
          </div>
          <button
            className="press"
            onClick={() => setAuthOpen(true)}
            style={{
              marginTop: 6,
              height: 48,
              padding: "0 28px",
              borderRadius: "var(--r-md)",
              background: "var(--brand)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            התחברות
          </button>
        </div>
        <AuthDialog
          isOpen={authOpen}
          onClose={() => setAuthOpen(false)}
          contextLabel="נדרש חשבון כדי לצפות בפרופיל"
        />
      </MobileShell>
    );
  }

  const accountRows: { key: ProfileSheet; label: string; sub?: string; icon: React.ReactNode }[] = [
    { key: "personal", label: "פרטים אישיים", sub: user?.email || undefined, icon: <Icon.user size={17} /> },
    { key: "bank", label: "חשבון לקבלת תשלומים", icon: <BankIcon /> },
  ];

  return (
    <MobileShell>
      <div style={{ paddingTop: "calc(64px + var(--sat, env(safe-area-inset-top, 0px)))", paddingBottom: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 20px" }}>
          <div style={{ position: "relative" }}>
            <span
              className="round"
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                background: "var(--ink)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 800,
                overflow: "hidden",
              }}
            >
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials
              )}
            </span>
            <button
              className="press round"
              aria-label="עריכת פרטים אישיים"
              onClick={() => setSheet("personal")}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--bg)",
                border: "1px solid var(--line-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--ink)",
              }}
            >
              <PenIcon />
            </button>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "12px 0 0" }}>
            {user?.displayName || "משתמש Tiket"}
          </h1>
          <div className="num" style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
            {memberSince ? `חבר מאז ${memberSince}` : user?.email || ""}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", margin: "18px 36px 0", textAlign: "center" }}>
          {[
            [counts.bought, "כרטיסים שקניתי"],
            [counts.sold, "כרטיסים שמכרתי"],
          ].map(([n, label], k) => (
            <div key={label} style={{ borderInlineStart: k ? "1px solid var(--line-strong)" : "none" }}>
              {ordersLoading ? (
                <Skeleton style={{ width: 30, height: 30, borderRadius: 8, margin: "2px auto" }} />
              ) : (
                <div className="num" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1 }}>
                  {n}
                </div>
              )}
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 5 }}>{label}</div>
            </div>
          ))}
        </div>

        <div
          role="tablist"
          style={{
            display: "grid",
            gridTemplateColumns: isAdmin ? "1fr 1fr 1fr" : "1fr 1fr",
            margin: "18px 20px 6px",
            padding: 4,
            borderRadius: 999,
            background: "var(--surface-2)",
          }}
        >
          {([
            ["orders", "הזמנות"],
            ["acct", "חשבון"],
            ...(isAdmin ? ([["admin", "ניהול"]] as const) : []),
          ] as const).map(([k, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              className="press round"
              onClick={() => setTab(k)}
              style={{
                height: 38,
                borderRadius: 999,
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                background: tab === k ? "var(--bg)" : "transparent",
                boxShadow: tab === k ? "var(--shadow-sm)" : "none",
                color: tab === k ? "var(--ink)" : "var(--muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "orders" ? (
          <div style={{ padding: "6px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {ordersLoading ? (
              [0, 1, 2].map((i) => <OrderCardSkeleton key={i} />)
            ) : orders.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                עדיין אין הזמנות
              </div>
            ) : (
              orders.map((o) => (
                <div
                  key={o.id}
                  style={{
                    position: "relative",
                    height: 84,
                    borderRadius: "var(--r-md)",
                    overflow: "hidden",
                    color: "#fff",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "0 14px 12px",
                    gap: 10,
                    background: "var(--ink)",
                  }}
                >
                  {o.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(270deg, rgba(20,20,19,.85) 0%, rgba(20,20,19,.35) 100%)" }} />
                  <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, ...ellipsis }}>{o.artist || "אירוע"}</div>
                    <div className="num" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, opacity: 0.85 }}>
                      <span
                        className="round"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: o.status === "נמכר" ? "#7FD3A3" : "rgba(255,255,255,.7)",
                        }}
                      />
                      {o.status} · {o.when}
                      {o.date ? ` · ${hebDate(o.date)}` : ""}
                    </div>
                  </div>
                  <span
                    className="num"
                    style={{
                      position: "relative",
                      height: 28,
                      padding: "0 11px",
                      borderRadius: 999,
                      background: "rgba(20,20,19,.55)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      display: "flex",
                      alignItems: "center",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {o.status === "נמכר" ? "+" : ""}
                    {nis(o.amount)}
                  </span>
                </div>
              ))
            )}
            {orders.length > 0 && (
              <button
                onClick={() => router.push("/MyTickets")}
                style={{
                  alignSelf: "center",
                  marginTop: 4,
                  padding: "8px 4px",
                  background: "none",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--brand)",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                לכל הכרטיסים
              </button>
            )}
          </div>
        ) : tab === "admin" && isAdmin ? (
          <div style={{ padding: "10px 20px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 2px 10px", fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
              <Icon.shield size={14} color="var(--brand)" />
              ניהול מערכת
            </div>
            <MobileAdminGrid />
          </div>
        ) : (
          <div style={{ padding: "6px 4px 0" }}>
            {accountRows.map((r, i) => (
              <AccountRow
                key={r.key}
                first={i === 0}
                icon={r.icon}
                label={r.label}
                sub={r.sub}
                onClick={() => setSheet(r.key)}
              />
            ))}


            <button
              className="press"
              onClick={handleSignOut}
              style={{
                display: "block",
                margin: "22px auto 0",
                height: 44,
                padding: "0 20px",
                background: "transparent",
                border: "none",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "inherit",
                color: "var(--brand)",
                cursor: "pointer",
              }}
            >
              התנתק
            </button>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 14, marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
              <button onClick={() => router.push("/Terms")} style={legalLink}>
                תנאי שימוש
              </button>
              <button onClick={() => router.push("/Privacy")} style={legalLink}>
                מדיניות פרטיות
              </button>
              <button onClick={handleDeleteAccount} style={legalLink}>
                מחיקת חשבון
              </button>
            </div>
            <div className="num" dir="ltr" style={{ textAlign: "center", fontSize: 11, color: "var(--faint)", padding: "14px 0 4px" }}>
              {"tiket v1.0.0"}
              {OTA_CHANNEL === "staging" && ` · staging · OTA ${otaVersion ?? "…"}`}
            </div>
          </div>
        )}
      </div>

      {sheet && user && <MobileProfileSheet sheet={sheet} user={user} onClose={() => setSheet(null)} />}
    </MobileShell>
  );
}

/** Same 84px image card as an order row, with the title, status line and
 *  amount pill as placeholders. */
function OrderCardSkeleton() {
  return (
    <div
      className="tk-skeleton animate-pulse"
      style={{ height: 84, borderRadius: "var(--r-md)", display: "flex", alignItems: "flex-end", gap: 10, padding: "0 14px 12px" }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ width: "52%", height: 16, borderRadius: 5, margin: "3px 0", background: "rgba(255,255,255,.6)" }} />
        <div style={{ width: "36%", height: 10, borderRadius: 4, marginTop: 7, background: "rgba(255,255,255,.5)" }} />
      </div>
      <div style={{ width: 62, height: 28, borderRadius: 999, background: "rgba(255,255,255,.5)" }} />
    </div>
  );
}

/** Before the session is restored: avatar, name, stats, tabs and order cards
 *  in their real positions. */
function ProfileSkeleton() {
  return (
    <MobileShell>
      <div style={{ paddingTop: "calc(64px + var(--sat, env(safe-area-inset-top, 0px)))", paddingBottom: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px" }}>
          <Skeleton className="round" style={{ width: 92, height: 92, borderRadius: "50%" }} />
          <Skeleton style={{ width: 150, height: 22, borderRadius: 7, marginTop: 16 }} />
          <Skeleton style={{ width: 88, height: 11, borderRadius: 4, marginTop: 9 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", margin: "18px 36px 0" }}>
          {[0, 1].map((k) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", borderInlineStart: k ? "1px solid var(--line-strong)" : "none" }}>
              <Skeleton style={{ width: 30, height: 30, borderRadius: 8, margin: "2px 0" }} />
              <Skeleton style={{ width: 86, height: 10, borderRadius: 4, marginTop: 9 }} />
            </div>
          ))}
        </div>
        <div style={{ margin: "18px 20px 6px", height: 46, borderRadius: 999, background: "var(--surface-2)" }} />
        <div style={{ padding: "6px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </MobileShell>
  );
}

const ellipsis: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

const legalLink: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  font: "inherit",
  color: "inherit",
  cursor: "pointer",
};

function AccountRow({
  icon,
  label,
  sub,
  first,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  sub?: string;
  first: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="press"
      onClick={onClick}
      style={{
        width: "100%",
        minHeight: icon ? 58 : 50,
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        textAlign: "right",
        background: "transparent",
        border: "none",
        borderTop: first ? "none" : "1px solid var(--line)",
        fontFamily: "inherit",
        color: "var(--ink)",
        cursor: "pointer",
      }}
    >
      {icon && (
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            background: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
          }}
        >
          {icon}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{label}</div>
        {sub && <div className="num" style={{ fontSize: 13, color: "var(--muted)", marginTop: 1, ...ellipsis }}>{sub}</div>}
      </div>
      <Icon.chev size={16} color="var(--faint)" />
    </button>
  );
}

const PenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const BankIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />
  </svg>
);
