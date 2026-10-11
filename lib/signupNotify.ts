import nodemailer from "nodemailer";
import { sourceLabel } from "@/app/components/SourceIcon/SourceIcon";

/**
 * Emails the team about each new early-access signup.
 *
 * Sends through Gmail SMTP as SIGNUP_NOTIFY_FROM (default tiketbizzz@gmail.com)
 * with a Gmail App Password in SIGNUP_NOTIFY_PASSWORD. Without the password it
 * does nothing, so the signup flow never depends on email being set up. It
 * never throws and gives up after a few seconds: a slow mail server must not
 * hold up the person signing up.
 */

const FROM = process.env.SIGNUP_NOTIFY_FROM || "tiketbizzz@gmail.com";
const TO = process.env.SIGNUP_NOTIFY_TO || FROM;
const SEND_TIMEOUT_MS = 6000;

let transport: nodemailer.Transporter | null = null;
function getTransport(): nodemailer.Transporter | null {
  const pass = process.env.SIGNUP_NOTIFY_PASSWORD;
  if (!pass) return null;
  transport ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: FROM, pass: pass.replace(/\s+/g, "") },
  });
  return transport;
}

export interface NewSignup {
  email: string;
  phone: string;
  source: string;
  referrer: string;
  /** Position on the list, counting this signup. */
  total: number | null;
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function notifyNewSignup(signup: NewSignup): Promise<void> {
  const mail = getTransport();
  if (!mail) return;

  const staging = process.env.APP_CHANNEL === "staging";
  const channel = sourceLabel(signup.source);
  const when = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" });
  const number = signup.total ? ` #${signup.total}` : "";
  const subject = `${staging ? "[staging] " : ""}נרשם חדש לגישה המוקדמת${number} · ${channel}`;

  const rows: [string, string][] = [
    ["אימייל", signup.email || "-"],
    ["טלפון", signup.phone || "-"],
    ["מקור", channel],
    ["אתר מפנה", signup.referrer || "-"],
    ["זמן", when],
    ["סה״כ ברשימה", signup.total ? String(signup.total) : "-"],
  ];
  const admin = "https://tiket.co.il/Admin/EarlyAccess";

  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;color:#0A0A0A">
<p style="font-size:18px;font-weight:bold;margin:0 0 12px">נרשם חדש לגישה המוקדמת${esc(number)}</p>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#667085">${esc(k)}</td><td dir="auto"><b>${esc(v)}</b></td></tr>`)
    .join("")}</table>
<p style="margin:16px 0 0"><a href="${admin}">לרשימה המלאה בפאנל</a></p></div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\n${admin}`;

  try {
    await Promise.race([
      mail.sendMail({ from: `Tiket <${FROM}>`, to: TO, subject, text, html }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), SEND_TIMEOUT_MS)),
    ]);
  } catch (err) {
    console.error("[signupNotify] email not sent:", err instanceof Error ? err.message : err);
  }
}
