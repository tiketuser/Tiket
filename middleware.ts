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
    const url = request.nextUrl.clone();
    url.pathname = "/EarlyAccess";
    url.search = "";
    // 307, never 308: a permanent redirect would be cached by browsers and
    // outlive the gate.
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
