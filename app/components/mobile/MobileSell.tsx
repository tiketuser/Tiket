"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { apiFetch } from "@/lib/platform";
import { Icon } from "./Icon";
import { nis } from "./format";

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
}: {
  open: boolean;
  onClose: () => void;
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
    setStep(0);
    setTickets([]);
    setBarcodeDraft("");
    setShowAdd(false);
    setPrice(220);
    setBundleOnly(true);
    setPublishing(false);
    setPublishError(null);
    setPublishedCount(null);
  }, [open]);

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
    if (step === 0) onClose();
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
    try {
      const token = await user.getIdToken();
      const bundleId = tickets.length > 1 ? crypto.randomUUID() : null;
      const bundleSize = tickets.length;
      let created = 0;
      let duplicate = false;

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
            ticket: {
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
      setPublishError("פרסום נכשל. נסה שוב.");
    } finally {
      setPublishing(false);
    }
  }, [bundleOnly, price, tickets]);

  if (!open) return null;

  return (
    <div
      className="tk-mobile"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "var(--tk-bg)",
        display: "flex",
        flexDirection: "column",
        animation: "fadeIn 160ms ease-out",
      }}
      dir="rtl"
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px 16px",
          borderBottom: "1px solid var(--tk-line)",
          paddingTop: "calc(14px + var(--sat, env(safe-area-inset-top, 0px)))",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <button
            onClick={goBack}
            aria-label={step === 0 ? "סגור" : "חזרה"}
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
              padding: 0,
            }}
          >
            <Icon.chev size={16} />
          </button>
          <div>
            <div
              className="tk-mono"
              style={{
                fontSize: 10,
                color: "var(--tk-blue)",
                letterSpacing: "0.1em",
              }}
            >
              שלב {step + 1}/3
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {step === 0
                ? "העלה כרטיס"
                : step === 1
                  ? "קבע מחיר"
                  : "אשר ופרסם"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background:
                  i <= step ? "var(--tk-blue)" : "var(--tk-line-strong)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 18,
          paddingBottom: 100,
        }}
      >
        {step === 0 && (
          <StepUpload
            tickets={tickets}
            removeTicket={removeTicket}
            showAdd={showAdd}
            setShowAdd={setShowAdd}
            barcodeDraft={barcodeDraft}
            setBarcodeDraft={setBarcodeDraft}
            onAddBarcode={addBarcodeTicket}
            onSelectFile={() => fileInputRef.current?.click()}
          />
        )}
        {step === 1 && (
          <StepPrice
            price={price}
            setPrice={setPrice}
            ticketsCount={tickets.length}
            bundleOnly={bundleOnly}
            setBundleOnly={setBundleOnly}
          />
        )}
        {step === 2 && (
          <StepReview
            tickets={tickets}
            price={price}
            bundleOnly={bundleOnly}
            published={publishedCount}
            error={publishError}
          />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) addPdfTicket(f);
          e.target.value = "";
        }}
        style={{ display: "none" }}
      />

      {/* Footer action */}
      <div
        style={{
          flexShrink: 0,
          padding: "10px 14px",
          paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
          background: "rgba(245,241,232,0.95)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid var(--tk-line)",
        }}
      >
        {step < 2 ? (
          <button
            onClick={goNext}
            disabled={step === 0 && !canAdvanceFromUpload}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 999,
              border: "none",
              background:
                step === 0 && !canAdvanceFromUpload
                  ? "var(--tk-line-strong)"
                  : "var(--tk-ink)",
              color: "#fff",
              cursor:
                step === 0 && !canAdvanceFromUpload ? "default" : "pointer",
              fontFamily: "inherit",
            }}
          >
            המשך לשלב הבא
          </button>
        ) : publishedCount != null ? (
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 999,
              border: "none",
              background: "var(--tk-ink)",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            סגור
          </button>
        ) : (
          <button
            onClick={publish}
            disabled={publishing}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 999,
              border: "none",
              background: "var(--tk-blue)",
              color: "#fff",
              cursor: publishing ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: publishing ? 0.75 : 1,
            }}
          >
            {publishing ? "מפרסם…" : "פרסם למכירה"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 0: Upload ────────────────────────────────────────────
function StepUpload({
  tickets,
  removeTicket,
  showAdd,
  setShowAdd,
  barcodeDraft,
  setBarcodeDraft,
  onAddBarcode,
  onSelectFile,
}: {
  tickets: FileTicket[];
  removeTicket: (i: number) => void;
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
  barcodeDraft: string;
  setBarcodeDraft: (v: string) => void;
  onAddBarcode: () => void;
  onSelectFile: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Already-added tickets */}
      {tickets.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            className="tk-mono"
            style={{
              fontSize: 10,
              color: "var(--tk-muted)",
              letterSpacing: "0.1em",
            }}
          >
            כרטיסים שהתקבלו · {tickets.length}
          </div>
          {tickets.map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 12,
                borderRadius: 12,
                background: "rgba(11,122,62,0.06)",
                border: "1px solid rgba(11,122,62,0.25)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--tk-ok)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8l3.5 3.5L13 5"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  כרטיס {i + 1} התקבל
                </div>
                <div
                  className="tk-mono"
                  dir="ltr"
                  style={{
                    fontSize: 10,
                    color: "var(--tk-muted)",
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textAlign: "right",
                  }}
                >
                  {t.kind === "pdf" ? "◆ PDF · " : "◆ ברקוד · "}
                  {t.label}
                </div>
              </div>
              <button
                onClick={() => removeTicket(i)}
                aria-label="הסר"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: "transparent",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Icon.x size={14} color="var(--tk-muted)" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add-another trigger when there's already a ticket */}
      {tickets.length > 0 && !showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1.5px dashed var(--tk-line-strong)",
            background: "transparent",
            color: "var(--tk-ink)",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          <span>הוסף עוד כרטיס</span>
        </button>
      )}

      {/* Upload UI — visible when no tickets yet OR user clicked "add another" */}
      {(tickets.length === 0 || showAdd) && (
        <UploadInputs
          barcodeDraft={barcodeDraft}
          setBarcodeDraft={setBarcodeDraft}
          onAddBarcode={onAddBarcode}
          onSelectFile={onSelectFile}
          onCancel={tickets.length > 0 ? () => setShowAdd(false) : undefined}
        />
      )}
    </div>
  );
}

function UploadInputs({
  barcodeDraft,
  setBarcodeDraft,
  onAddBarcode,
  onSelectFile,
  onCancel,
}: {
  barcodeDraft: string;
  setBarcodeDraft: (v: string) => void;
  onAddBarcode: () => void;
  onSelectFile: () => void;
  onCancel?: () => void;
}) {
  return (
    <>
      <div
        style={{
          border: "1px solid var(--tk-line-strong)",
          borderRadius: 14,
          padding: 14,
          background: "var(--tk-paper)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <QrIcon size={16} />
          <div style={{ fontSize: 13, fontWeight: 700 }}>הזן ברקוד ידנית</div>
        </div>
        <div
          style={{ fontSize: 11, color: "var(--tk-muted)", marginBottom: 10 }}
        >
          העתק את מספר הברקוד מתחתית הכרטיס
        </div>
        <input
          placeholder="487612390542"
          inputMode="numeric"
          value={barcodeDraft}
          onChange={(e) => setBarcodeDraft(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid var(--tk-line-strong)",
            background: "#fff",
            fontFamily: "var(--font-jet-mono), monospace",
            fontSize: 14,
            letterSpacing: "0.18em",
            textAlign: "center",
            boxSizing: "border-box",
            direction: "ltr",
            outline: "none",
          }}
        />
        <button
          onClick={onAddBarcode}
          disabled={!barcodeDraft.trim()}
          style={{
            marginTop: 10,
            width: "100%",
            padding: 10,
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 999,
            border: "none",
            background: barcodeDraft.trim()
              ? "var(--tk-ink)"
              : "var(--tk-line-strong)",
            color: "#fff",
            cursor: barcodeDraft.trim() ? "pointer" : "default",
            fontFamily: "inherit",
          }}
        >
          אשר ברקוד
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 10,
            fontSize: 10.5,
            color: "var(--tk-muted)",
          }}
        >
          <Icon.shield size={12} color="var(--tk-blue)" />
          <span>אימות אוטומטי מול חברת הכרטוס</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "var(--tk-muted)",
          fontSize: 11,
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--tk-line-strong)" }} />
        <span>או</span>
        <div style={{ flex: 1, height: 1, background: "var(--tk-line-strong)" }} />
      </div>

      <div
        style={{
          border: "2px dashed var(--tk-line-strong)",
          borderRadius: 14,
          padding: "32px 16px",
          textAlign: "center",
          background: "var(--tk-paper)",
        }}
      >
        <div
          style={{
            margin: "0 auto 12px",
            width: 48,
            height: 48,
            borderRadius: 999,
            background: "var(--tk-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UploadIcon />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>העלה PDF או תמונה</div>
        <div style={{ fontSize: 11, color: "var(--tk-muted)", marginTop: 4 }}>
          עד 10MB · אוטומטית מוסתר מידע אישי
        </div>
        <button
          onClick={onSelectFile}
          style={{
            marginTop: 14,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 999,
            border: "none",
            background: "var(--tk-ink)",
            color: "#fff",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          בחר קובץ
        </button>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            padding: 8,
            background: "transparent",
            border: "none",
            color: "var(--tk-muted)",
            fontSize: 12,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          ביטול
        </button>
      )}
    </>
  );
}

// ─── Step 1: Price ─────────────────────────────────────────────
function StepPrice({
  price,
  setPrice,
  ticketsCount,
  bundleOnly,
  setBundleOnly,
}: {
  price: number;
  setPrice: (n: number) => void;
  ticketsCount: number;
  bundleOnly: boolean;
  setBundleOnly: (v: boolean) => void;
}) {
  const total = price * Math.max(ticketsCount, 1);
  const fillPct = ((price - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  return (
    <div>
      <div
        className="tk-mono"
        style={{ fontSize: 10, color: "var(--tk-muted)", marginBottom: 6 }}
      >
        המחיר שלך לכרטיס
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          marginBottom: ticketsCount > 1 ? 4 : 16,
        }}
      >
        <span
          className="tk-mono"
          style={{
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          {nis(price)}
        </span>
        <span
          className="tk-mono"
          style={{ fontSize: 12, color: "var(--tk-muted)" }}
        >
          / כרטיס
        </span>
      </div>
      {ticketsCount > 1 && (
        <div
          className="tk-mono"
          style={{ fontSize: 11, color: "var(--tk-muted)", marginBottom: 16 }}
        >
          {nis(total)} לכל {ticketsCount} הכרטיסים יחד
        </div>
      )}
      <input
        type="range"
        min={PRICE_MIN}
        max={PRICE_MAX}
        value={price}
        onChange={(e) => setPrice(parseInt(e.target.value, 10))}
        style={
          {
            width: "100%",
            height: 6,
            borderRadius: 999,
            background: `linear-gradient(to left, var(--tk-blue) 0%, var(--tk-blue) ${fillPct}%, var(--tk-line-strong) ${fillPct}%, var(--tk-line-strong) 100%)`,
            outline: "none",
            appearance: "none",
            WebkitAppearance: "none",
          } as React.CSSProperties
        }
      />
      <div
        className="tk-mono"
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "var(--tk-muted)",
          marginTop: 6,
        }}
      >
        <span>{nis(PRICE_MIN)}</span>
        <span>שוק חי {nis(225)}</span>
        <span>{nis(PRICE_MAX)}</span>
      </div>

      <div
        style={{
          marginTop: 14,
          background: "var(--tk-paper)",
          border: "1px solid var(--tk-line-strong)",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
          מה תקבל
        </div>
        {ticketsCount > 1 && (
          <MRow
            label={`מחיר × ${ticketsCount}`}
            value={`${ticketsCount} × ${nis(price)}`}
            muted
          />
        )}
        <MRow label="סה״כ" value={nis(total)} />
        <MRow
          label="עמלת פלטפורמה"
          value={`-${nis(total - Math.round(total * SELLER_PAYOUT_RATE))}`}
          muted
        />
        <div
          style={{
            height: 1,
            background: "var(--tk-line)",
            margin: "8px 0",
          }}
        />
        <MRow
          label="תשלום אליך"
          value={nis(Math.round(total * SELLER_PAYOUT_RATE))}
          strong
        />
      </div>

      {ticketsCount > 1 && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            background: "var(--tk-paper)",
            border: "1px solid var(--tk-line-strong)",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                מכור רק כחבילה
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--tk-muted)",
                  marginTop: 2,
                }}
              >
                {ticketsCount} כרטיסים יימכרו יחד לקונה אחד
              </div>
            </div>
            <button
              onClick={() => setBundleOnly(!bundleOnly)}
              aria-pressed={bundleOnly}
              style={{
                width: 44,
                height: 26,
                borderRadius: 999,
                background: bundleOnly
                  ? "var(--tk-blue)"
                  : "var(--tk-line-strong)",
                border: "none",
                position: "relative",
                cursor: "pointer",
                flexShrink: 0,
                padding: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  insetInlineStart: bundleOnly ? 21 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  background: "#fff",
                  transition: "inset-inline-start 160ms",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Review ────────────────────────────────────────────
function StepReview({
  tickets,
  price,
  bundleOnly,
  published,
  error,
}: {
  tickets: FileTicket[];
  price: number;
  bundleOnly: boolean;
  published: number | null;
  error: string | null;
}) {
  if (published != null) {
    return (
      <div
        style={{
          padding: "30px 18px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--tk-ok)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l5 5 9-11"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
            המודעה נשלחה לאימות
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--tk-muted)",
              maxWidth: 260,
              lineHeight: 1.5,
            }}
          >
            {published === 1
              ? "הכרטיס שלך נשלח לאימות מול חברת הכרטוס. נעדכן אותך ברגע שיאושר ויעלה לאוויר."
              : `${published} הכרטיסים שלך נשלחו לאימות מול חברת הכרטוס. נעדכן אותך ברגע שיאושרו ויעלו לאוויר.`}
          </div>
        </div>
      </div>
    );
  }

  const total = price * Math.max(tickets.length, 1);
  const payout = Math.round(total * SELLER_PAYOUT_RATE);

  return (
    <div>
      {/* Pending-verification stub card (replaces the design's glass preview,
          since the event/seat aren't known until verification completes) */}
      <div
        style={{
          position: "relative",
          borderRadius: 14,
          overflow: "hidden",
          minHeight: 280,
          color: "#fff",
          marginBottom: 14,
          background: "var(--tk-ink)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 18px)",
          }}
        />
        <div
          style={{
            position: "relative",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            minHeight: 280,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                borderRadius: 999,
                padding: "6px 10px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--tk-lime)",
                }}
              />
              <span style={{ opacity: 0.85, fontWeight: 600 }}>
                בהמתנה לאימות
              </span>
            </div>
            <div
              className="tk-mono"
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                padding: "6px 10px",
              }}
            >
              {nis(price)}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ marginBottom: 10 }}>
            <div
              className="tk-mono"
              style={{
                fontSize: 10,
                opacity: 0.6,
                letterSpacing: "0.18em",
                marginBottom: 6,
              }}
            >
              ◆ TIKET · PENDING
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              הכרטיס יזוהה אוטומטית
            </div>
            <div
              className="tk-mono"
              style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}
            >
              פרטי המופע יעודכנו לאחר אימות מול חברת הכרטוס
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 12,
              padding: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div
                className="tk-mono"
                style={{
                  fontSize: 9,
                  opacity: 0.6,
                  letterSpacing: "0.12em",
                }}
              >
                כרטיסים
              </div>
              <div
                style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}
              >
                {tickets.length}
              </div>
            </div>
            <div>
              <div
                className="tk-mono"
                style={{
                  fontSize: 9,
                  opacity: 0.6,
                  letterSpacing: "0.12em",
                  textAlign: "end",
                }}
              >
                סוג העלאה
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginTop: 2,
                  textAlign: "end",
                }}
              >
                {tickets.every((t) => t.kind === "barcode")
                  ? "ברקוד"
                  : tickets.every((t) => t.kind === "pdf")
                    ? "PDF / תמונה"
                    : "מעורב"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt */}
      <div
        style={{
          background: "var(--tk-paper)",
          border: "1px solid var(--tk-line)",
          borderRadius: 12,
          padding: 14,
        }}
      >
        {(
          [
            ["כמות:", `${tickets.length}`],
            ["מחיר לכרטיס:", nis(price)],
            ...(tickets.length > 1
              ? ([
                  ["סה״כ:", nis(total)],
                  [
                    "אופן מכירה:",
                    bundleOnly ? "חבילה — יחד" : "ניתן לפיצול",
                  ],
                ] as const)
              : []),
            ["תשלום אליך (נטו):", nis(payout)],
          ] as const
        ).map(([k, v], i, a) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "flex-start",
              gap: 8,
              padding: "7px 0",
              borderBottom:
                i < a.length - 1 ? "1px dashed var(--tk-line-strong)" : "none",
              fontSize: 12,
            }}
          >
            <span style={{ color: "var(--tk-muted)" }}>{k}</span>
            <span style={{ fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(181,70,83,0.08)",
            border: "1px solid rgba(181,70,83,0.25)",
            color: "var(--tk-blue)",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Bits ──────────────────────────────────────────────────────
function MRow({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "3px 0",
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: muted ? "var(--tk-muted)" : "var(--tk-ink)",
        }}
      >
        {label}
      </span>
      <span
        className="tk-mono"
        style={{
          fontSize: strong ? 17 : 13,
          fontWeight: strong ? 700 : 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function QrIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="5" height="5" stroke="var(--tk-ink)" strokeWidth="1.2" />
      <rect x="9.5" y="1.5" width="5" height="5" stroke="var(--tk-ink)" strokeWidth="1.2" />
      <rect x="1.5" y="9.5" width="5" height="5" stroke="var(--tk-ink)" strokeWidth="1.2" />
      <rect x="3.5" y="3.5" width="1" height="1" fill="var(--tk-ink)" />
      <rect x="11.5" y="3.5" width="1" height="1" fill="var(--tk-ink)" />
      <rect x="3.5" y="11.5" width="1" height="1" fill="var(--tk-ink)" />
      <rect x="9" y="9" width="2" height="2" fill="var(--tk-ink)" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 14V4m0 0l-3.5 3.5M10 4l3.5 3.5"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 13v3a1 1 0 001 1h12a1 1 0 001-1v-3"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
