/** Short codes for the channels we post on, used both as campaign links
 *  (tiket.co.il/ig) and in utm_source, where Instagram itself tags the
 *  profile-bio link with "ig". Anything not listed is kept under its own
 *  code, so a new channel needs no deploy. */
export const CHANNEL_CODES: Record<string, string> = {
  ig: "instagram", insta: "instagram", instagram: "instagram",
  fb: "facebook", facebook: "facebook",
  x: "x", tw: "x", twitter: "x",
  tt: "tiktok", tiktok: "tiktok",
  wa: "whatsapp", whatsapp: "whatsapp",
  tg: "telegram", telegram: "telegram",
  li: "linkedin", linkedin: "linkedin",
  yt: "youtube", youtube: "youtube",
  sc: "snapchat", snapchat: "snapchat",
  rd: "reddit", reddit: "reddit",
  gg: "google", google: "google",
  nl: "newsletter", newsletter: "newsletter", email: "email",
  qr: "qr", poster: "poster", flyer: "flyer",
};

/** Spellings that arrive for the same channel, after cleaning (so the
 *  "chatgpt.com" that ChatGPT puts in utm_source arrives as "chatgptcom"). */
const SOURCE_ALIASES: Record<string, string> = {
  ...CHANNEL_CODES,
  chatgptcom: "chatgpt",
  chatopenaicom: "chatgpt",
  openai: "chatgpt",
  geminigooglecom: "gemini",
  bard: "gemini",
  claudeai: "claude",
  perplexityai: "perplexity",
  copilotmicrosoftcom: "copilot",
};

/** Free text from the client, clamped before it reaches Firestore, then
 *  folded onto one code per channel. Also applied when reading, so signups
 *  stored before an alias existed group with the rest. */
export function cleanSource(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  return SOURCE_ALIASES[cleaned] ?? cleaned;
}
