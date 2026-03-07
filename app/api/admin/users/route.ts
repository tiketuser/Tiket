import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../lib/firebaseAdmin";
import { requireAdmin } from "../../../../lib/authMiddleware";

// GET — list all Firebase Auth users (paginated, up to 1000)
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck) return adminCheck;

  if (!adminAuth) {
    return NextResponse.json({ error: "Auth unavailable" }, { status: 503 });
  }

  const result = await adminAuth.listUsers(1000);
  const users = result.users.map((u) => ({
    uid: u.uid,
    email: u.email || "",
    displayName: u.displayName || "",
    photoURL: u.photoURL || "",
    disabled: u.disabled,
    isAdmin: u.customClaims?.admin === true,
    createdAt: u.metadata.creationTime,
    lastSignIn: u.metadata.lastSignInTime,
  }));

  return NextResponse.json({ users });
}

// POST — grant/revoke admin OR update a user's password
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck) return adminCheck;

  if (!adminAuth) {
    return NextResponse.json({ error: "Auth unavailable" }, { status: 503 });
  }

  const body = await request.json();
  const { action, uid, password } = body;

  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  // --- Update password ---
  if (action === "set_password") {
    if (!uid || !password) {
      return NextResponse.json({ error: "Missing uid or password" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    await adminAuth.updateUser(uid, { password });
    return NextResponse.json({ success: true });
  }

  // --- Grant / revoke admin via Firebase custom claims ---
  if (action !== "grant" && action !== "revoke") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  await adminAuth.setCustomUserClaims(uid, { admin: action === "grant" });
  return NextResponse.json({ success: true });
}
