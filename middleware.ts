import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { searchIndexingOff } from "@/lib/seo";
import { CHANNEL_CODES } from "@/lib/signupSource";

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

/** The channel recorded for a campaign link, or null when this is not one.
 *  An optional second segment narrows the channel: /ig/dm records
 *  instagram_dm, so DMs can be told apart from the profile link. Segments
 *  exclude "_" so the separator stays unambiguous. */
function sourceFor(pathname: string): string | null {
  const match = /^\/([A-Za-z0-9-]{1,24})(?:\/([A-Za-z0-9-]{1,24}))?\/?$/.exec(pathname);
  if (!match) return null;
  const code = match[1].toLowerCase();
  if (RESERVED_SEGMENTS.has(code)) return null;
  const channel = CHANNEL_CODES[code] ?? code;
  return match[2] ? `${channel}_${match[2].toLowerCase()}` : channel;
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

/** Staging serves the full site to anyone with the link; this keeps search
 *  engines from indexing it as a second copy of Tiket. */
function withIndexingPolicy(response: NextResponse): NextResponse {
  if (searchIndexingOff()) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
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
    // The bare domain serves the signup page itself rather than redirecting,
    // so search engines index tiket.co.il/ and not a redirect to elsewhere.
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/EarlyAccess";
      return withIndexingPolicy(NextResponse.rewrite(url));
    }

    // Campaign link, e.g. /ig or /ig/dm: remember where they came from and
    // serve the signup page by rewrite, so the address bar keeps the short URL
    // and the visitor never sees a tag.
    const source = sourceFor(pathname);
    if (source) {
      const url = request.nextUrl.clone();
      url.pathname = "/EarlyAccess";
      const response = NextResponse.rewrite(url);
      response.cookies.set("ea_src", source, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        // Read by the signup form in the browser, so not httpOnly.
        httpOnly: false,
      });
      return withIndexingPolicy(response);
    }

    const url = request.nextUrl.clone();
    url.pathname = "/";
    // Query is kept so utm_ tags on a link to the bare domain still reach the
    // page. 307, never 308: a permanent redirect would be cached by browsers
    // and outlive the gate.
    return withIndexingPolicy(NextResponse.redirect(url, 307));
  }

  return withIndexingPolicy(NextResponse.next());
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
