import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

/**
 * Device push token registry.
 *
 * Tokens live at users/{uid}/pushTokens/{tokenId} so that deleting a user
 * deletes their tokens with them, and so a send can fan out to every device a
 * user has. The document id is a hash of the token because FCM tokens are far
 * longer than the 1500-byte Firestore document-id limit.
 */

function tokenId(token: string): string {
  // FNV-1a over the token, hex — short, stable, no crypto import needed on edge.
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0") + "-" + token.length.toString(36);
}

const PLATFORMS = new Set(["ios", "android", "web"]);

export async function POST(request: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: "Server services not available" }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
    const uid = decoded.uid;

    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const platform = typeof body?.platform === "string" ? body.platform : "";

    if (!token || token.length > 4096) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    if (!PLATFORMS.has(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const id = tokenId(token);
    await adminDb
      .collection("users")
      .doc(uid)
      .collection("pushTokens")
      .doc(id)
      .set(
        {
          token,
          platform,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Register push token error:", error);
    return NextResponse.json({ error: "Failed to register token" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: "Server services not available" }, { status: 500 });
    }

    // Call this while the user is still signed in (before signOut), so the
    // token can be attributed to a user without a collection-group scan.
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));

    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    await adminDb
      .collection("users")
      .doc(decoded.uid)
      .collection("pushTokens")
      .doc(tokenId(token))
      .delete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete push token error:", error);
    return NextResponse.json({ error: "Failed to delete token" }, { status: 500 });
  }
}
