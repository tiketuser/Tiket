import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../../lib/firebaseAdmin";
import { isAdminFromToken } from "../../../../../lib/firebase-admin";
import { testProvider } from "../../../../../lib/venueVerify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only provider connection test.
 *
 * Sends a synthetic ticket to exactly one provider (bypassing the config
 * cache) and reports real diagnostics: HTTP status, latency, parsed outcome,
 * and — for Tiket Connect partners — the /tiket/health result and kit version.
 * A well-formed "not_found" answer counts as success: it proves endpoint,
 * auth and schema all work.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
  }
  try {
    if (!adminAuth) return NextResponse.json({ error: "Auth unavailable" }, { status: 503 });
    const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
    if (!isAdminFromToken(decoded)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const providerId = body?.providerId;
  if (!providerId || typeof providerId !== "string") {
    return NextResponse.json({ error: "Missing providerId" }, { status: 400 });
  }

  const result = await testProvider(providerId);
  return NextResponse.json(result);
}
