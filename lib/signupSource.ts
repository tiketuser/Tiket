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
  googlecom: "google",
  bingcom: "bing",
};

/** Free text from the client, clamped before it reaches Firestore, then
 *  folded onto one code per channel. Also applied when reading, so signups
 *  stored before an alias existed group with the rest. */
export function cleanSource(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  return SOURCE_ALIASES[cleaned] ?? cleaned;
}

// ─── Detecting the channel in the visitor's browser ──────────────────────────

/** Ad click ids platforms append to their outbound links. They survive in-app
 *  browsers that strip the referrer, so they are often the only evidence left.
 *  fbclid is not here: Facebook and Instagram add it to every link, paid or
 *  not, so it is a weaker signal than the referrer (see detectVisitSource). */
const AD_CLICK_IDS: [string, string][] = [
  ["gclid", "google_ad"], ["gbraid", "google_ad"], ["wbraid", "google_ad"],
  ["msclkid", "bing_ad"], ["ttclid", "tiktok_ad"], ["twclid", "x_ad"],
  ["li_fat_id", "linkedin_ad"], ["sccid", "snapchat_ad"],
];

/** Referrer hosts, matched on the host or any parent domain. Order matters
 *  where one is under another (gemini.google.com before google). */
const REFERRER_HOSTS: [string, string][] = [
  ["chatgpt.com", "chatgpt"], ["chat.openai.com", "chatgpt"],
  ["gemini.google.com", "gemini"], ["bard.google.com", "gemini"],
  ["claude.ai", "claude"], ["perplexity.ai", "perplexity"], ["copilot.microsoft.com", "copilot"],
  ["mail.google.com", "email"], ["outlook.live.com", "email"], ["outlook.office.com", "email"],
  ["instagram.com", "instagram"],
  ["facebook.com", "facebook"], ["fb.com", "facebook"], ["fb.me", "facebook"], ["messenger.com", "facebook"],
  ["t.co", "x"], ["x.com", "x"], ["twitter.com", "x"],
  ["tiktok.com", "tiktok"], ["linkedin.com", "linkedin"], ["lnkd.in", "linkedin"],
  ["reddit.com", "reddit"], ["youtube.com", "youtube"], ["youtu.be", "youtube"],
  ["t.me", "telegram"], ["telegram.org", "telegram"], ["whatsapp.com", "whatsapp"], ["wa.me", "whatsapp"],
  ["snapchat.com", "snapchat"], ["threads.net", "threads"],
  ["bing.com", "bing"], ["duckduckgo.com", "duckduckgo"], ["yahoo.com", "yahoo"],
];

/** Android apps send `android-app://<package>/` as the referrer. */
const ANDROID_APPS: Record<string, string> = {
  "com.google.android.googlequicksearchbox": "google",
  "com.google.android.gm": "email",
  "com.instagram.android": "instagram",
  "com.facebook.katana": "facebook", "com.facebook.orca": "facebook", "com.facebook.lite": "facebook",
  "com.zhiliaoapp.musically": "tiktok", "com.ss.android.ugc.trill": "tiktok",
  "org.telegram.messenger": "telegram", "com.whatsapp": "whatsapp",
  "com.twitter.android": "x", "com.linkedin.android": "linkedin",
  "com.reddit.frontpage": "reddit", "com.google.android.youtube": "youtube",
  "com.openai.chatgpt": "chatgpt", "com.snapchat.android": "snapchat",
};

const OWN_HOSTS = ["tiket.co.il", "tiket-app-staging.web.app", "localhost"];

const onDomain = (host: string, domain: string) => host === domain || host.endsWith("." + domain);

/** The channel a referrer URL points to: a known site or app, otherwise the
 *  referring site itself ("ref-ynet-co-il"), or "" for none / our own pages. */
export function sourceFromReferrer(referrer: string): string {
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return "";
  }
  if (url.protocol === "android-app:") {
    const pkg = url.hostname.toLowerCase();
    return ANDROID_APPS[pkg] ?? `app-${pkg.split(".").pop() || "android"}`;
  }
  const host = url.hostname.toLowerCase();
  if (!host || OWN_HOSTS.some((d) => onDomain(host, d))) return "";
  for (const [domain, source] of REFERRER_HOSTS) if (onDomain(host, domain)) return source;
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return "google";
  return `ref-${host.replace(/^www\./, "").replace(/\./g, "-")}`;
}

/** What this page load says about where the visitor came from, strongest
 *  evidence first: an explicit utm_source, an ad click id, the referrer, then
 *  fbclid (Facebook or Instagram, without the referrer to tell which). */
export function detectVisitSource(search: string, referrer: string): string {
  const params = new URLSearchParams(search);
  const utm = params.get("utm_source");
  if (utm) return utm.slice(0, 40);
  const lower = new Map(Array.from(params.keys()).map((k) => [k.toLowerCase(), k]));
  for (const [id, source] of AD_CLICK_IDS) if (lower.has(id)) return source;
  const ref = sourceFromReferrer(referrer);
  if (ref) return ref;
  if (lower.has("fbclid")) return "facebook";
  return "";
}
