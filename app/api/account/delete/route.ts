import { NextRequest, NextResponse } from "next/server";
import admin, { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Delete the caller's own account.
 *
 * Done server-side with the Admin SDK on purpose: the client-side
 * deleteUser() requires a *recent* login and throws auth/requires-recent-login
 * otherwise. Deleting the Firestore profile first and then hitting that error
 * left an orphaned auth account with no profile doc. adminAuth.deleteUser()
 * has no recency requirement, and here the auth account is removed only after
 * the profile doc is gone, so a partial failure never strands a live account.
 */
export async function POST(request: NextRequest) {
  try {
    if (!adminAuth || !adminDb || admin.apps.length === 0) {
      return NextResponse.json(
        { error: "Server services not available" },
        { status: 500 },
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
    const uid = decoded.uid;

    // Profile doc first, then the auth account. If deleting the account fails
    // the doc is already gone; retrying is safe (delete is idempotent).
    await adminDb.collection("users").doc(uid).delete();
    await adminAuth.deleteUser(uid);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
