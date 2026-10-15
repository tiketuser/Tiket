"use client";

import React, { useEffect, useState } from "react";
import { updateProfile, type User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { apiFetch } from "@/lib/platform";
import { useSwipeToClose } from "./useSwipeToClose";
import { ISRAELI_BANKS } from "../Dialogs/UploadTicketDialog/UploadTicketSteps/StepFourBankDetails";

export type ProfileSheet = "personal" | "bank";

export const SHEET_TITLES: Record<ProfileSheet, string> = {
  personal: "פרטים אישיים",
  bank: "חשבון לקבלת תשלומים",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  height: 46,
  padding: "0 14px",
  borderRadius: "var(--r-sm)",
  border: "1px solid var(--line-strong)",
  background: "var(--surface)",
  fontSize: 15,
  color: "var(--ink)",
  outline: "none",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--ink-2)",
  marginBottom: 5,
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  ltr,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  ltr?: boolean;
  disabled?: boolean;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={labelStyle}>{label}</div>
      <input
        className="auth-in"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        type={type}
        dir={ltr ? "ltr" : undefined}
        disabled={disabled}
        style={{
          ...inputStyle,
          textAlign: ltr ? "right" : undefined,
          color: disabled ? "var(--muted)" : "var(--ink)",
          background: disabled ? "var(--surface-2)" : "var(--surface)",
        }}
      />
    </label>
  );
}

function SaveButton({
  label,
  onClick,
  disabled,
  dirty,
  busy,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  dirty: boolean;
  busy: boolean;
}) {
  return (
    <button
      className="press"
      disabled={disabled || busy}
      onClick={onClick}
      style={{
        width: "100%",
        height: 50,
        borderRadius: 999,
        background: dirty ? "var(--brand)" : "var(--ink)",
        transition: "background .2s",
        color: "#fff",
        border: "none",
        fontSize: 15,
        fontWeight: 700,
        fontFamily: "inherit",
        cursor: disabled || busy ? "default" : "pointer",
        opacity: disabled || busy ? 0.35 : 1,
        marginTop: 8,
      }}
    >
      {busy ? "..." : label}
    </button>
  );
}

const ErrorLine = ({ text }: { text: string | null }) =>
  text ? (
    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)", textAlign: "center" }}>{text}</div>
  ) : null;

function Personal({ user, done }: { user: User; done: () => void }) {
  const [initial, setInitial] = useState({ name: user.displayName || "", phone: "" });
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        const d = snap.data() || {};
        const name = (d.displayName as string) || [d.fname, d.lname].filter(Boolean).join(" ") || user.displayName || "";
        const next = { name, phone: (d.phone as string) || "" };
        setInitial(next);
        setF(next);
      })
      .catch(() => undefined);
  }, [user]);

  const dirty = f.name !== initial.name || f.phone !== initial.phone;
  const save = async () => {
    if (!db) return;
    setBusy(true);
    setError(null);
    try {
      const name = f.name.trim();
      const [fname, ...rest] = name.split(/\s+/);
      await updateProfile(user, { displayName: name });
      await updateDoc(doc(db, "users", user.uid), {
        displayName: name,
        fname,
        lname: rest.join(" "),
        phone: f.phone.trim(),
      });
      done();
    } catch (err) {
      console.error("[profile] save personal details failed", err);
      setError("השמירה נכשלה. נסו שוב");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="שם מלא" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
      <Field label="אימייל" value={user.email || ""} type="email" ltr disabled />
      <Field label="טלפון" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} placeholder="050-0000000" type="tel" ltr />
      <ErrorLine text={error} />
      <SaveButton label="שמירה" onClick={dirty ? save : done} disabled={!f.name.trim()} dirty={dirty} busy={busy} />
    </div>
  );
}

function Bank({ user, done }: { user: User; done: () => void }) {
  const empty = { bank: "", branch: "", acct: "", holder: user.displayName || "" };
  const [initial, setInitial] = useState(empty);
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/seller/payment-details", {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        });
        const data = await res.json();
        const p = data.paymentDetails;
        if (cancelled || !p) return;
        const next = {
          bank: p.bankName || "",
          branch: p.branchNumber || "",
          acct: p.accountNumber || "",
          holder: p.accountHolderName || "",
        };
        setInitial(next);
        setF(next);
      } catch {
        /* keep the empty form */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  const valid = f.bank && /^\d{3,4}$/.test(f.branch) && /^\d{6,13}$/.test(f.acct) && f.holder.trim();
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch("/api/seller/payment-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          bankName: f.bank,
          branchNumber: f.branch,
          accountNumber: f.acct,
          accountHolderName: f.holder.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "השמירה נכשלה. נסו שוב");
        return;
      }
      done();
    } catch {
      setError("השמירה נכשלה. נסו שוב");
    } finally {
      setBusy(false);
    }
  };
  const digits = (v: string, n: number) => v.replace(/\D/g, "").slice(0, n);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
        לחשבון הזה יועברו התשלומים על כרטיסים שמכרת.
      </div>
      <label style={{ display: "block" }}>
        <div style={labelStyle}>בנק</div>
        <select
          value={f.bank}
          onChange={(e) => setF({ ...f, bank: e.target.value })}
          style={{ ...inputStyle, appearance: "none", color: f.bank ? "var(--ink)" : "var(--faint)" }}
        >
          <option value="" disabled>
            בחרו בנק
          </option>
          {ISRAELI_BANKS.map((b) => (
            <option key={b.code} value={b.name}>
              {`בנק ${b.name} (${b.code})`}
            </option>
          ))}
        </select>
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
        <Field label="סניף" value={f.branch} onChange={(v) => setF({ ...f, branch: digits(v, 4) })} type="tel" ltr />
        <Field label="מספר חשבון" value={f.acct} onChange={(v) => setF({ ...f, acct: digits(v, 13) })} type="tel" ltr />
      </div>
      <Field label="שם בעל החשבון" value={f.holder} onChange={(v) => setF({ ...f, holder: v })} />
      <ErrorLine text={error} />
      <SaveButton label="שמירה" onClick={dirty ? save : done} disabled={!valid} dirty={dirty} busy={busy} />
    </div>
  );
}

/** Bottom sheet for editing one account section from the profile tab. */
export default function MobileProfileSheet({
  sheet,
  user,
  onClose,
}: {
  sheet: ProfileSheet;
  user: User;
  onClose: () => void;
}) {
  const swipe = useSwipeToClose(onClose);
  return (
    <div
      className="tk-mobile"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: `rgba(20,20,19,${0.4 * swipe.progress})`,
        display: "flex",
        alignItems: "flex-end",
        animation: "fadeIn .2s",
      }}
    >
      <div
        ref={swipe.ref}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{
          transform: swipe.offset ? `translateY(${swipe.offset}px)` : undefined,
          transition: swipe.transition,
          width: "100%",
          maxWidth: 640,
          margin: "0 auto",
          maxHeight: "88%",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface)",
          color: "var(--ink)",
          borderRadius: "24px 24px 0 0",
          animation: "sheetUp .28s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <div style={{ padding: "8px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--line-strong)", margin: "0 auto" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 40px", alignItems: "center", padding: "6px 12px 4px" }}>
          <span />
          <div style={{ textAlign: "center", fontSize: 17, fontWeight: 700 }}>{SHEET_TITLES[sheet]}</div>
          <button
            className="press"
            onClick={onClose}
            aria-label="סגירה"
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ink)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "10px 20px calc(34px + var(--sab, env(safe-area-inset-bottom, 0px)))" }}>
          {sheet === "personal" ? <Personal user={user} done={onClose} /> : <Bank user={user} done={onClose} />}
        </div>
      </div>
    </div>
  );
}
