import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Hosts the early-access gate applies to. Staging and the *.run.app URLs are
 *  deliberately absent, so the full site stays browsable there. */
const GATED_HOSTS = new Set(["tiket.co.il", "www.tiket.co.il"]);

/** Still reachable while the gate is up: the signup page itself, the URLs
 *  registered with Apple in App Store Connect (privacy policy, support,
 *  privacy choices), the claim-gated admin area, and /Profile — the only
 *  sign-in entry point, without which an admin can never authenticate and
 *  /Admin bounces them back here. */
const ALWAYS_ALLOWED = [
  "/EarlyAccess",
  "/Privacy",
  "/Terms",
  "/ContactUs",
  "/delete-account",
  "/Admin",
  "/Profile",
];

/** Real routes and public files. A campaign short code must never swallow one,
 *  so anything listed here is left alone. Compared lower-case. */
const RESERVED_SEGMENTS = new Set(
  [
    "Admin", "ContactUs", "DemoData", "EarlyAccess", "EventPage", "Favorites",
    "HowItWorks", "MyListings", "MyTickets", "Privacy", "Profile",
    "SearchResults", "Terms", "ViewMore", "api", "approve-tickets",
    "delete-account", "diagnostic", "edit-events", "fix-dates", "fonts",
    "manage-artists", "manage-categories", "manage-default-images",
    "manage-themes", "migrate", "regenerate-tickets", "theme",
    "images", "index", "404", "manifest", "sw", "robots", "sitemap",
  ].map((s) => s.toLowerCase())
);

/** Short codes for the channels we post on, so a link can read tiket.co.il/ig
 *  instead of carrying utm_ tags. Anything not listed is still recorded, using
 *  the code itself as the source, so a new channel needs no deploy. */
const SOURCE_CODES: Record<string, string> = {
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

/** The visitor-facing code, or null when this is not a campaign link. */
function sourceCodeFor(pathname: string): string | null {
  const match = /^\/([A-Za-z0-9_-]{1,24})\/?$/.exec(pathname);
  if (!match) return null;
  const code = match[1].toLowerCase();
  if (RESERVED_SEGMENTS.has(code)) return null;
  return code;
}

function gateIsUp(request: NextRequest): boolean {
  // Escape hatch so the gate can be lifted (or forced on) by setting a Cloud
  // Run env var, with no rebuild or redeploy.
  const override = process.env.EARLY_ACCESS_GATE;
  if (override === "off") return false;
  if (override === "on") return true;

  // Behind Firebase Hosting the Host header is the Cloud Run service, not the
  // public domain — the original lands in X-Forwarded-Host.
  const host = (
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? ""
  )
    .split(",")[0]
    .split(":")[0]
    .trim()
    .toLowerCase();
  return GATED_HOSTS.has(host);
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const { pathname } = request.nextUrl;
  const allowed =
    pathname.startsWith("/api/") ||
    ALWAYS_ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!allowed && gateIsUp(request)) {
    // Campaign link, e.g. /ig: remember where they came from and serve the
    // signup page by rewrite, so the address bar keeps the short URL and the
    // visitor never sees a tag.
    const code = sourceCodeFor(pathname);
    if (code) {
      const url = request.nextUrl.clone();
      url.pathname = "/EarlyAccess";
      const response = NextResponse.rewrite(url);
      response.cookies.set("ea_src", SOURCE_CODES[code] ?? code, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        // Read by the signup form in the browser, so not httpOnly.
        httpOnly: false,
      });
      return response;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/EarlyAccess";
    // Query is kept so utm_ tags on a link to the bare domain still reach the
    // page. 307, never 308: a permanent redirect would be cached by browsers
    // and outlive the gate.
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
