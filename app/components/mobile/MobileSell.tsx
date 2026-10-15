"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { apiFetch } from "@/lib/platform";
import { hebDate, nis } from "./format";
import type { MobileTicket } from "./MobileMyTickets";
import { encodeImageUrl } from "@/utils/defaultImages";

type Step = 0 | 1 | 2;
type FileTicket =
  | { kind: "pdf"; label: string; file?: File }
  | { kind: "barcode"; label: string };

const PRICE_MIN = 80;
const PRICE_MAX = 500;
// Fraction of the sale price the seller receives after the platform fee.
const SELLER_PAYOUT_RATE = 0.93;

export default function MobileSell({
  open,
  onClose,
  resale,
}: {
  open: boolean;
  onClose: () => void;
  /** A ticket bought on Tiket being put back on sale (swipe-to-sell in My
   *  Tickets): the upload step is skipped and the flow opens on the price. */
  resale?: MobileTicket | null;
}) {
  const [step, setStep] = useState<Step>(0);
  const [tickets, setTickets] = useState<FileTicket[]>([]);
  const [barcodeDraft, setBarcodeDraft] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [price, setPrice] = useState(220);
  const [bundleOnly, setBundleOnly] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedCount, setPublishedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state every time the sheet re-opens
  useEffect(() => {
    if (!open) return;
    setStep(resale ? 1 : 0);
    setTickets(
      resale
        ? [{ kind: "barcode", label: resale.newBarcode || resale.artist }]
        : [],
    );
    setBarcodeDraft("");
    setShowAdd(false);
    setPrice(resale?.amount || 220);
    setBundleOnly(true);
    setPublishing(false);
    setPublishError(null);
    setPublishedCount(null);
  }, [open, resale]);

  const addPdfTicket = (file?: File) => {
    const n = tickets.filter((t) => t.kind === "pdf").length + 1;
    setTickets((prev) => [
      ...prev,
      { kind: "pdf", label: file?.name || `ticket-${n}.pdf`, file },
    ]);
    setShowAdd(false);
  };
  const addBarcodeTicket = () => {
    const code = barcodeDraft.trim();
    if (!code) return;
    setTickets((prev) => [...prev, { kind: "barcode", label: code }]);
    setBarcodeDraft("");
    setShowAdd(false);
  };
  const removeTicket = (i: number) =>
    setTickets((prev) => prev.filter((_, idx) => idx !== i));

  const canAdvanceFromUpload = tickets.length > 0;

  const goNext = () => {
    if (step === 0 && !canAdvanceFromUpload) return;
    setStep((s) => (s < 2 ? ((s + 1) as Step) : s));
  };
  const goBack = () => {
    if (step === 0 || (resale && step === 1)) onClose();
    else setStep((s) => ((s - 1) as Step));
  };

  const publish = useCallback(async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setPublishError("יש להתחבר כדי לפרסם");
      return;
    }
    setPublishing(true);
    setPublishError(null);
    // Tracked outside the try so a mid-batch failure can still report the
    // tickets that were already created (and lock out a duplicating retry).
    let created = 0;
    let duplicate = false;
    try {
      const token = await user.getIdToken();
      const bundleId = tickets.length > 1 ? crypto.randomUUID() : null;
      const bundleSize = tickets.length;

      for (let i = 0; i < tickets.length; i++) {
        const t = tickets[i];

        // Upload the attached file so admin review has the actual ticket.
        // Previously the file was silently discarded, leaving nothing to review.
        let ticketImage: string | null = null;
        if (t.kind === "pdf" && t.file) {
          const fd = new FormData();
          fd.append("file", t.file);
          const up = await apiFetch("/api/upload-ticket-image", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (!up.ok) throw new Error(`image-upload ${up.status}`);
          ticketImage = (await up.json()).imageUrl ?? null;
        }

        const res = await apiFetch("/api/create-ticket", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ticket: resale
              ? {
                  // Full details, so the server can verify it with the
                  // ticketing provider like any other listing. The re-issued
                  // barcode is the one that's valid now (the old one was voided).
                  askingPrice: price,
                  eventId: resale.eventId ?? null,
                  category: resale.category,
                  artist: resale.artist,
                  date: resale.date,
                  time: resale.time,
                  venue: resale.venue,
                  section: resale.section,
                  block: resale.block,
                  row: resale.row != null ? String(resale.row) : undefined,
                  seat: resale.seat != null ? String(resale.seat) : undefined,
                  isStanding: Boolean(resale.isStanding),
                  barcode: resale.newBarcode ?? null,
                  ticketImage: resale.ticketImage ?? null,
                  originalPrice: resale.amount ?? null,
                }
              : {
                  askingPrice: price,
                  barcode: t.kind === "barcode" ? t.label : null,
                  ticketImage,
                  bundleId,
                  canSplit: bundleId ? !bundleOnly : null,
                  bundleSize: bundleId ? bundleSize : null,
                },
          }),
        });

        if (res.status === 409) {
          duplicate = true;
          continue;
        }
        if (!res.ok) throw new Error(`create-ticket ${res.status}`);
        created++;
      }

      if (created > 0) {
        setPublishedCount(created);
        if (duplicate) {
          setPublishError("חלק מהכרטיסים כבר קיימים במערכת (ברקוד כפול).");
        }
      } else if (duplicate) {
        setPublishError("הכרטיס כבר קיים במערכת (ברקוד כפול).");
      } else {
        setPublishError("פרסום נכשל. נסה שוב.");
      }
    } catch (err) {
      console.error("[mobile-sell] publish failed", err);
      if (created > 0) {
        // Some tickets are already live — show the partial success instead of
        // returning to the publish button, so a retry can't re-create them.
        setPublishedCount(created);
        setPublishError(
          `פורסמו ${created} מתוך ${tickets.length} כרטיסים. השאר נכשלו — נסו להעלות אותם שוב.`
        );
      } else {
        setPublishError("פרסום נכשל. נסה שוב.");
      }
    } finally {
      setPublishing(false);
    }
  }, [bundleOnly, price, tickets, resale]);

  const [kp, setKp] = useState(false);
  const [kpFresh, setKpFresh] = useState(false);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (!open) return;
    setKp(false);
    setTyping(false);
  }, [open]);

  if (!open) return null;

  const n = tickets.length;
  const total = price * n;
  const payout = Math.round(total * SELLER_PAYOUT_RATE);
  // A resale skips the upload step, so its progress bar has two steps.
  const titles = resale
    ? ["קביעת מחיר", "אישור ופרסום"]
    : ["העלאת כרטיס", "קביעת מחיר", "אישור ופרסום"];
  const stepIndex = resale ? step - 1 : step;
  // Slider range: around what was paid for a resale, else the usual range
  // (stretched if a typed price goes past it).
  const rangeLo = resale?.amount ? Math.max(1, Math.round(resale.amount * 0.5)) : PRICE_MIN;
  const rangeHi = Math.max(
    resale?.amount ? Math.round(resale.amount * 1.6) : PRICE_MAX,
    price,
    rangeLo + 10,
  );
  const seatLine = resale
    ? [
        resale.section && `אזור ${resale.section}`,
        resale.isStanding ? "עמידה" : resale.row != null && resale.row !== "" && `שורה ${resale.row}`,
        !resale.isStanding && resale.seat != null && resale.seat !== "" && `מושב ${resale.seat}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const codeOk = barcodeDraft.trim().length >= 6;
  const kpPress = (k: string) => {
    if (k === "del") {
      setPrice(Math.floor((price || 0) / 10));
      setKpFresh(false);
      return;
    }
    const base = kpFresh ? "" : String(price || "");
    const next = parseInt(base + k, 10);
    if (next <= 99999) setPrice(next);
    setKpFresh(false);
  };

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="application/pdf,image/*"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) addPdfTicket(f);
        setTyping(false);
        e.target.value = "";
      }}
      style={{ display: "none" }}
    />
  );

  const shell = (children: React.ReactNode, background = "var(--bg)") => (
    <div
      className="tk-mobile"
      dir="rtl"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background,
        color: "var(--ink)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        animation: "fadeIn 160ms ease-out",
      }}
    >
      <div style={{ width: "100%", maxWidth: 640, margin: "0 auto", minHeight: "100%", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );

  /* ── published ─────────────────────────────────────────── */
  if (publishedCount != null) {
    return shell(
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", color: "#fff", overflow: "hidden" }}>
        <style>{"@keyframes usRise{from{opacity:0;transform:translateY(28px) scale(.94) rotate(-2deg)}to{opacity:1;transform:translateY(0) scale(.92) rotate(-2deg)}}@keyframes usFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}"}</style>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 60% at 50% 30%, rgba(181,70,83,.45) 0%, rgba(14,14,13,0) 70%)" }} />
        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "calc(30px + var(--sat, env(safe-area-inset-top, 0px))) 20px calc(30px + var(--sab, env(safe-area-inset-bottom, 0px)))",
          }}
        >
          <div style={{ textAlign: "center", animation: "usFade .5s ease both" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 28, padding: "0 12px", borderRadius: 999, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.14)", fontSize: 12, fontWeight: 600 }}>
              <span className="round" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--brand)", boxShadow: "0 0 0 3px rgba(181,70,83,.3)" }} />
              נשלח לאימות
            </span>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginTop: 14 }}>
              {publishedCount > 1 ? "הכרטיסים הועלו" : "הכרטיס הועלה"}
            </div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,.65)", marginTop: 8, lineHeight: 1.5 }}>
              נאמת אותו מול מערכת הכרטוס ונפרסם אותו.
              <br />
              נעדכן אותך ברגע שיימכר.
            </div>
            {publishError && (
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "#F2B8BF" }}>{publishError}</div>
            )}
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div
              style={{
                width: "100%",
                maxWidth: 360,
                animation: "usRise .7s cubic-bezier(.2,.9,.3,1) .1s both",
                filter: "drop-shadow(0 30px 40px rgba(0,0,0,.5))",
              }}
            >
              <div style={{ borderRadius: 26, background: "#fff", color: "var(--ink)", padding: "22px 22px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".12em", color: "var(--muted)" }}>
                  <span className="round" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)" }} />
                  TIKET
                </div>
                <div className="num" style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, marginTop: 14 }}>
                  {nis(price)}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                  {publishedCount > 1 ? `לכרטיס · ${publishedCount} כרטיסים` : "לכרטיס"}
                </div>
                <div style={{ borderTop: "1.5px dashed var(--line-strong)", margin: "16px -22px 12px" }} />
                <div dir="ltr" style={{ height: 30, display: "flex", alignItems: "stretch", gap: 2, justifyContent: "center" }}>
                  {BARS.map((w, i) => (
                    <span key={i} style={{ width: w * 1.6, borderRadius: 0.5, background: "var(--ink)" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, animation: "usFade .5s ease .35s both" }}>
            <a
              href="/MyTickets"
              className="press"
              style={{ width: "100%", height: 52, borderRadius: "var(--r-md)", background: "#fff", color: "var(--ink)", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
            >
              לכרטיסים שלי
            </a>
            <button onClick={onClose} style={{ ...plainButton, width: "100%", height: 46, fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,.75)" }}>
              סגירה
            </button>
          </div>
        </div>
      </div>,
      "#0E0E0D",
    );
  }

  /* ── review & publish ──────────────────────────────────── */
  if (step === 2) {
    const mode = n > 1 ? (bundleOnly ? "חבילה בלבד" : "בנפרד או יחד") : "כרטיס בודד";
    const row = (k: string, v: React.ReactNode) => (
      <div key={k} style={{ minHeight: 54, display: "grid", gridTemplateColumns: "96px minmax(0,1fr)", alignItems: "center", gap: 8, borderTop: "1px solid var(--line)" }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>{k}</span>
        <span className="num" style={{ fontSize: 14, fontWeight: 600, padding: "10px 0", lineHeight: 1.4, overflowWrap: "anywhere" }}>{v}</span>
      </div>
    );
    return shell(
      <>
        <div style={{ position: "relative", height: 260, flex: "0 0 auto", overflow: "hidden" }}>
          {resale?.eventImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={encodeImageUrl(resale.eventImageUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.7 }} />
          ) : (
            <>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(90% 90% at 70% 20%, rgba(181,70,83,.55) 0%, rgba(20,20,19,0) 70%)" }} />
              <div dir="ltr" aria-hidden="true" style={{ position: "absolute", left: 24, right: 24, bottom: 60, height: 70, display: "flex", alignItems: "stretch", justifyContent: "center", gap: 3, opacity: 0.12 }}>
                {BARS.concat(BARS).map((w, i) => (
                  <span key={i} style={{ width: w * 2.2, background: "#fff" }} />
                ))}
              </div>
            </>
          )}
          <div style={{ position: "absolute", top: "calc(10px + var(--sat, env(safe-area-inset-top, 0px)))", right: 0, left: 0, height: 52, padding: "0 16px", display: "flex", alignItems: "center" }}>
            <button className="press round" onClick={() => setStep(1)} aria-label="חזרה" style={{ ...roundButton, background: "rgba(255,255,255,.14)", color: "#fff" }}>
              <ChevRight />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, marginTop: -28, position: "relative", borderRadius: "28px 28px 0 0", background: "var(--bg)", padding: "10px 20px calc(30px + var(--sab, env(safe-area-inset-bottom, 0px)))", display: "flex", flexDirection: "column" }}>
          <div style={{ width: 36, height: 5, borderRadius: 3, background: "var(--line-strong)", margin: "0 auto 14px" }} />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
            <div style={{ fontSize: 18, fontWeight: 800, minWidth: 0, lineHeight: 1.3 }}>
              {resale ? resale.artist : "אישור ופרסום"}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <ShieldIcon size={13} color="var(--muted)" />
              יאומת לפני פרסום
            </span>
          </div>
          {resale ? (
            <>
              {seatLine && row("מקום", seatLine)}
              {row("מועד", [resale.date && hebDate(resale.date), resale.time].filter(Boolean).join(" · "))}
              {row("מחיר", nis(price))}
            </>
          ) : (
            <>
              {row("כרטיסים", n)}
              {row("מחיר לכרטיס", nis(price))}
              {row("אופן מכירה", mode)}
            </>
          )}
          {row("עמלת שירות", `-${nis(total - payout)}`)}
          {row("מועד תשלום", "5-7 ימים אחרי האירוע")}
          <div className="num" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 0", borderTop: "1px solid var(--line)" }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>
              סך התמורה
              {n > 1 && <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>{` · ${n} × ${nis(price)}`}</span>}
            </span>
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>{nis(payout)}</span>
          </div>
          {publishError && (
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)", textAlign: "center", marginBottom: 12 }}>{publishError}</div>
          )}
          <div style={{ flex: 1 }} />
          <SwipeToConfirm
            busy={publishing}
            onConfirm={publish}
            label={
              <>
                {publishing ? "מפרסם…" : "החלק לפרסום"}
                {!publishing && <span className="num" style={{ marginInlineStart: 6 }}>{`· ${nis(total)}`}</span>}
              </>
            }
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 11, color: "var(--faint)", marginTop: 10 }}>
            <ShieldIcon size={11} color="var(--faint)" />
            התשלום יועבר אליך 5-7 ימים אחרי האירוע
          </div>
        </div>
      </>,
      "#141413",
    );
  }

  /* ── upload & price ────────────────────────────────────── */
  return shell(
    <>
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--bg)", paddingTop: "var(--sat, env(safe-area-inset-top, 0px))" }}>
        <div style={{ height: 52, padding: "0 16px", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
          <button className="press round" onClick={goBack} aria-label={stepIndex ? "חזרה" : "סגירה"} style={roundButton}>
            {stepIndex ? <ChevRight /> : <XIcon size={17} />}
          </button>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{titles[stepIndex]}</span>
          <span />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${titles.length},1fr)`, gap: 4, padding: "0 20px 10px" }}>
          {titles.map((t, i) => (
            <span key={t} className="round" style={{ height: 4, borderRadius: 2, background: "var(--line)", overflow: "hidden" }}>
              <span
                className="round"
                style={{
                  display: "block",
                  height: "100%",
                  width: i < stepIndex ? "100%" : i === stepIndex ? "66.67%" : "0%",
                  background: "var(--brand)",
                  borderRadius: 2,
                  transition: "width .35s ease",
                }}
              />
            </span>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: "12px 20px 24px" }}>
        {step === 0 && (
          <>
            <div style={{ margin: "6px 0 18px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: n ? "var(--muted)" : "var(--brand)" }}>
                {n ? (n > 1 ? `${n} כרטיסים` : "כרטיס אחד") : "שלב 1 מתוך 3"}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, marginTop: 4, textWrap: "balance" } as React.CSSProperties}>
                {n ? "הכרטיסים שלך" : "איך תרצה להוסיף את הכרטיס?"}
              </div>
            </div>

            {n > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {tickets.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      borderRadius: 18,
                      boxShadow: "inset 0 0 0 1px var(--line-strong)",
                      animation: "fadeIn .3s ease",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".12em", color: "var(--muted)" }}>
                        <span className="round" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)" }} />
                        TIKET
                      </div>
                      <div className="num" style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 17, fontWeight: 700, whiteSpace: "nowrap" }}>כרטיס {i + 1}</span>
                        <span dir="ltr" style={{ fontSize: 14, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.kind === "pdf" ? t.label : `ברקוד ${t.label}`}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => removeTicket(i)} aria-label="הסר" style={{ ...plainButton, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--faint)" }}>
                      <XIcon size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(n === 0 || showAdd) && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
                  <UploadTile kind="file" active={false} label="העלאה" sub="PDF או צילום מסך" onClick={() => fileInputRef.current?.click()} />
                  <UploadTile kind="code" active={typing} label="ברקוד" sub="הקלד את המספר" onClick={() => setTyping((v) => !v)} />
                </div>
                {typing && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10, animation: "fadeIn .2s ease" }}>
                    <div style={{ flex: 1, height: 50, display: "flex", alignItems: "center", padding: "0 14px", borderRadius: "var(--r-md)", background: "var(--surface-2)" }}>
                      <input
                        value={barcodeDraft}
                        onChange={(e) => setBarcodeDraft(e.target.value)}
                        placeholder="487612390542"
                        inputMode="numeric"
                        dir="ltr"
                        className="num"
                        autoFocus
                        style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 16, letterSpacing: ".08em", color: "var(--ink)", fontFamily: "inherit" }}
                      />
                    </div>
                    <button
                      className="press"
                      disabled={!codeOk}
                      onClick={() => {
                        addBarcodeTicket();
                        setTyping(false);
                      }}
                      style={{ ...plainButton, height: 50, padding: "0 18px", borderRadius: "var(--r-md)", background: "var(--ink)", color: "#fff", fontSize: 14, fontWeight: 600, opacity: codeOk ? 1 : 0.35 }}
                    >
                      אישור
                    </button>
                  </div>
                )}
                {showAdd && (
                  <button
                    onClick={() => {
                      setShowAdd(false);
                      setTyping(false);
                    }}
                    style={{ ...plainButton, width: "100%", height: 44, marginTop: 4, fontSize: 14, color: "var(--muted)" }}
                  >
                    ביטול
                  </button>
                )}
              </>
            )}

            {n > 0 && !showAdd && (
              <button
                className="press"
                onClick={() => setShowAdd(true)}
                style={{ ...plainButton, width: "100%", height: 50, borderRadius: 16, border: "1.5px dashed var(--line-strong)", color: "var(--ink)", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <PlusIcon />
                הוסף כרטיס
              </button>
            )}

            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 22, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              <span style={{ flex: "0 0 auto", display: "flex" }}>
                <ShieldIcon size={16} color="var(--muted)" />
              </span>
              <span>אנחנו מאמתים כל כרטיס מול מערכת הכרטוס של המופע ומעבירים אותו על שם הקונה.</span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            {resale && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0 16px", borderBottom: "1px solid var(--line)" }}>
                <span style={{ width: 52, height: 52, borderRadius: 14, overflow: "hidden", flex: "0 0 auto", background: "var(--surface-2)" }}>
                  {resale.eventImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={encodeImageUrl(resale.eventImageUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  )}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{resale.artist}</div>
                  <div className="num" style={{ fontSize: 13, color: "var(--muted)", marginTop: 1 }}>
                    {[resale.date && hebDate(resale.date), resale.time, seatLine].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
            )}
            <div style={{ textAlign: "center", padding: "14px 0 6px" }}>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>מחיר לכרטיס</div>
              <button
                onClick={() => {
                  setKp(true);
                  setKpFresh(true);
                }}
                aria-label="עריכת מחיר"
                className="num"
                dir="ltr"
                style={{
                  ...plainButton,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 8,
                  padding: "2px 10px",
                  borderRadius: 14,
                  fontSize: 52,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  color: price ? "var(--ink)" : "var(--line-strong)",
                  background: kp ? "var(--surface-2)" : "transparent",
                  transition: "background .2s",
                }}
              >
                ₪{price || 0}
                {kp && <span style={{ width: 3, height: 44, marginInlineStart: 3, borderRadius: 2, background: "var(--brand)", animation: "usBlink 1s steps(2) infinite" }} />}
              </button>
              <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{kp ? "הקלד מחיר" : "הקש לעריכה"}</div>
              {resale?.amount ? (
                <div className="num" style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                  שילמת {nis(resale.amount)}
                </div>
              ) : null}
              {n > 1 && (
                <div className="num" style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                  {nis(total)} ל-{n} כרטיסים
                </div>
              )}
            </div>

            <div style={{ padding: "18px 0 6px" }}>
              <div style={{ position: "relative", height: 28 }}>
                <input
                  className="us-range"
                  type="range"
                  min={rangeLo}
                  max={rangeHi}
                  step={1}
                  value={Math.max(rangeLo, Math.min(rangeHi, price))}
                  onChange={(e) => setPrice(parseInt(e.target.value, 10))}
                  aria-label="מחיר"
                  style={{ "--fill": `${((Math.max(rangeLo, Math.min(rangeHi, price)) - rangeLo) / (rangeHi - rangeLo)) * 100}%` } as React.CSSProperties}
                />
              </div>
              <div className="num" style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--faint)", marginTop: 4 }}>
                <span>{nis(rangeLo)}</span>
                <span>{nis(rangeHi)}</span>
              </div>
            </div>

            <div style={{ marginTop: 18, borderTop: "1px solid var(--line)" }}>
              {n > 1 && <TotalRow label={`מחיר × ${n}`} value={nis(total)} />}
              <TotalRow label="עמלת שירות" value={`-${nis(total - payout)}`} />
              <div className="num" style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", fontSize: 16, fontWeight: 700 }}>
                <span>סך התמורה</span>
                <span>{nis(payout)}</span>
              </div>
            </div>

            {n > 1 && (
              <button
                onClick={() => setBundleOnly(!bundleOnly)}
                style={{ ...plainButton, width: "100%", marginTop: 6, padding: 14, borderRadius: "var(--r-md)", background: "var(--surface-2)", display: "flex", alignItems: "center", gap: 12, textAlign: "right" }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>מכירה כחבילה בלבד</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>כל {n} הכרטיסים יימכרו לקונה אחד</div>
                </div>
                <span role="switch" aria-checked={bundleOnly} style={{ position: "relative", width: 44, height: 26, borderRadius: 9, background: bundleOnly ? "var(--brand)" : "var(--line-strong)", transition: "background .2s", flex: "0 0 auto" }}>
                  <span style={{ position: "absolute", top: 3, right: bundleOnly ? 3 : 21, width: 20, height: 20, borderRadius: 7, background: "#fff", transition: "right .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                </span>
              </button>
            )}
          </>
        )}
      </div>

      {fileInput}

      {kp && step === 1 ? (
        <div style={{ position: "sticky", bottom: 0, zIndex: 6 }}>
          <style>{"@keyframes usKpUp{from{transform:translateY(100%)}to{transform:none}}@keyframes usBlink{50%{opacity:0}}"}</style>
          <div onClick={() => setKp(false)} style={{ position: "absolute", bottom: "100%", right: 0, left: 0, height: 2000, background: "rgba(20,20,19,.04)" }} />
          <div style={{ position: "relative", padding: "10px 20px calc(28px + var(--sab, env(safe-area-inset-bottom, 0px)))", background: "var(--bg)", borderRadius: "22px 22px 0 0", boxShadow: "0 -10px 30px rgba(20,20,19,.08)", animation: "usKpUp .25s cubic-bezier(.2,.8,.2,1)" }}>
            <div className="num" style={{ padding: "2px 8px 10px", fontSize: 13, color: "var(--muted)" }}>
              {n > 1 ? `${nis(total)} ל-${n} כרטיסים` : `תקבל ${nis(payout)}`}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "ok"].map((k) =>
                k === "ok" ? (
                  <button key={k} className="press" onClick={() => setKp(false)} style={{ ...plainButton, height: 52, borderRadius: 12, background: "var(--brand)", color: "#fff", fontSize: 17, fontWeight: 700 }}>
                    אשר
                  </button>
                ) : (
                  <button
                    key={k}
                    className="press"
                    onClick={() => kpPress(k)}
                    aria-label={k === "del" ? "מחק" : k}
                    style={{ ...plainButton, height: 52, borderRadius: 12, background: k === "del" ? "transparent" : "var(--surface-2)", fontSize: 22, fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {k === "del" ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 5H9l-6 7 6 7h12z" />
                        <path d="M17 9l-6 6M11 9l6 6" />
                      </svg>
                    ) : (
                      <span className="num">{k}</span>
                    )}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ position: "sticky", bottom: 0, padding: "12px 20px calc(16px + var(--sab, env(safe-area-inset-bottom, 0px)))", background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
          <button
            className="press"
            disabled={!n || (step === 1 && !price)}
            onClick={goNext}
            style={{ ...plainButton, width: "100%", height: 52, borderRadius: "var(--r-md)", background: "var(--ink)", color: "#fff", fontSize: 15, fontWeight: 600, opacity: n && (step !== 1 || price) ? 1 : 0.35 }}
          >
            המשך
          </button>
        </div>
      )}
    </>,
  );
}

const BARS = [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2];

const plainButton: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  fontFamily: "inherit",
  color: "inherit",
  cursor: "pointer",
};

const roundButton: React.CSSProperties = {
  ...plainButton,
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "var(--surface-2)",
  color: "var(--ink)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="num" style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--line)", fontSize: 14, color: "var(--ink-2)" }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function UploadTile({
  kind,
  active,
  label,
  sub,
  onClick,
}: {
  kind: "file" | "code";
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      className="press"
      onClick={onClick}
      style={{
        ...plainButton,
        aspectRatio: "1 / 1.08",
        padding: 16,
        borderRadius: 22,
        textAlign: "right",
        background: active ? "#141413" : "var(--surface)",
        color: active ? "#fff" : "var(--ink)",
        boxShadow: active ? "none" : "0 0 0 1px var(--line), 0 8px 22px rgba(20,20,19,.05)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "flex-start",
        transition: "background .2s, color .2s",
      }}
    >
      {kind === "code" ? (
        <div dir="ltr" style={{ height: 44, display: "flex", alignItems: "stretch", gap: 2 }}>
          {BARS.map((w, i) => (
            <span key={i} style={{ width: w * 1.4, borderRadius: 0.5, background: active ? "#fff" : "var(--ink)", opacity: active ? 1 : 0.85 }} />
          ))}
        </div>
      ) : (
        <div style={{ position: "relative", width: 44, height: 50 }}>
          <span style={{ position: "absolute", inset: "4px -6px -2px 6px", borderRadius: 8, background: "var(--surface-2)", transform: "rotate(-8deg)" }} />
          <span style={{ position: "absolute", inset: 0, borderRadius: 8, background: "var(--surface)", boxShadow: "0 0 0 1.5px var(--ink)", display: "flex", flexDirection: "column", gap: 4, padding: "14px 8px 0" }}>
            <i style={{ height: 3, borderRadius: 2, background: "var(--brand)", width: "70%" }} />
            <i style={{ height: 3, borderRadius: 2, background: "var(--line-strong)" }} />
            <i style={{ height: 3, borderRadius: 2, background: "var(--line-strong)", width: "55%" }} />
          </span>
        </div>
      )}
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>{label}</div>
        <div style={{ fontSize: 12, color: active ? "rgba(255,255,255,.6)" : "var(--muted)", marginTop: 3 }}>{sub}</div>
      </div>
    </button>
  );
}

/** A pill the seller drags to the end to confirm, like the checkout's swipe-to-pay. */
function SwipeToConfirm({
  busy,
  onConfirm,
  label,
}: {
  busy: boolean;
  onConfirm: () => void;
  label: React.ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const K = 50;
  const max = () => (track.current ? track.current.offsetWidth : 300) - K - 8;
  useEffect(() => {
    if (!busy) setX(0);
  }, [busy]);
  const down = (e: React.PointerEvent) => {
    if (busy) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(e.clientX + x);
  };
  const move = (e: React.PointerEvent) => {
    if (drag == null) return;
    setX(Math.max(0, Math.min(max(), drag - e.clientX)));
  };
  const up = () => {
    if (drag == null) return;
    setDrag(null);
    if (x >= max() * 0.88) {
      setX(max());
      onConfirm();
    } else setX(0);
  };
  const p = x / max();
  const anim = drag == null ? ".3s cubic-bezier(.2,.8,.2,1)" : "0s";
  return (
    <div ref={track} style={{ position: "relative", height: 58, borderRadius: 999, background: "#141413", overflow: "hidden", touchAction: "none" }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: busy ? "100%" : x + K + 8, background: "var(--brand)", borderRadius: 999, opacity: busy || x > 0 || drag != null ? 1 : 0, transition: `width ${anim}, opacity .2s` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#fff", fontSize: 15, fontWeight: 700, paddingInlineStart: busy ? 0 : 44, opacity: busy ? 1 : Math.max(0, 1 - p * 1.3) }}>
        {label}
      </div>
      {!busy && (
        <div
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          role="button"
          aria-label="החלק לפרסום"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onConfirm();
          }}
          style={{ position: "absolute", top: 4, right: 4 + x, width: K, height: K, borderRadius: 16, background: "#fff", cursor: "grab", transition: `right ${anim}`, boxShadow: "0 3px 6px rgba(0,0,0,.28)", display: "flex", alignItems: "center", justifyContent: "center", color: "#141413" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </div>
      )}
    </div>
  );
}

const ChevRight = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const XIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function ShieldIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
