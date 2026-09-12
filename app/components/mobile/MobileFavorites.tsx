"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import MobileShell from "./MobileShell";
import MobileEventCard, { MobileEventCardData } from "./MobileEventCard";

const AuthDialog = dynamic(() => import("./MobileAuthSheet"), { ssr: false });

export default function MobileFavorites({
  events,
  loading,
  notSignedIn,
}: {
  events: MobileEventCardData[];
  loading: boolean;
  notSignedIn?: boolean;
}) {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const openLogin = useCallback(() => setAuthOpen(true), []);

  const count = events.length;

  return (
    <MobileShell>
      <div
        style={{
          padding: "calc(14px + var(--sat, env(safe-area-inset-top, 0px))) 18px 14px",
          borderBottom: "1px solid var(--tk-line)",
        }}
      >
        <div
          style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}
        >
          המועדפים שלי
        </div>
        <div
          className="tk-mono"
          style={{ fontSize: 11, color: "var(--tk-muted)", marginTop: 4 }}
        >
          {notSignedIn
            ? "התחבר כדי לראות את המועדפים שלך"
            : loading
              ? "טוען…"
              : count === 0
                ? "אין מועדפים עדיין"
                : `${count} ${count === 1 ? "מופע" : "מופעים"}`}
        </div>
      </div>

      {loading ? (
        <div
          className="animate-pulse"
          style={{
            padding: "14px 14px 20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: 20,
                overflow: "hidden",
                background: "var(--tk-paper)",
                border: "1px solid var(--tk-line)",
              }}
            >
              <div style={{ height: 150, background: "var(--tk-line)" }} />
              <div style={{ padding: 10 }}>
                <div
                  style={{
                    height: 12,
                    width: "80%",
                    borderRadius: 4,
                    background: "var(--tk-line)",
                  }}
                />
                <div
                  style={{
                    height: 9,
                    width: "55%",
                    borderRadius: 4,
                    background: "var(--tk-line)",
                    marginTop: 6,
                  }}
                />
                <div
                  style={{
                    height: 14,
                    width: "40%",
                    borderRadius: 4,
                    background: "var(--tk-line)",
                    marginTop: 8,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : count === 0 ? (
        <div
          style={{
            padding: "60px 30px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
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
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--tk-muted)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              {notSignedIn ? "התחבר כדי לשמור מועדפים" : "עדיין אין מועדפים"}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--tk-muted)",
                maxWidth: 240,
                lineHeight: 1.5,
              }}
            >
              לחץ על הלב בכרטיסי המופעים כדי לשמור אותם כאן ולקבל התראות
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            style={{
              marginTop: 8,
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
            גלה מופעים
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: "14px 14px 20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {events.map((e) => (
            <MobileEventCard
              key={e.id}
              card={e}
              initialFavorited={true}
              openLoginDialog={openLogin}
            />
          ))}
        </div>
      )}

      <AuthDialog isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </MobileShell>
  );
}
