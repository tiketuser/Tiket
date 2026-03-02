import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebaseAdmin";

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || "tiketbizzz@gmail.com,admin@tiket.com"
)
  .split(",")
  .map((e) => e.trim());

async function getAuthenticatedAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing authorization header", status: 401 };
  }
  const token = authHeader.substring(7);
  try {
    if (!adminAuth) return { error: "Auth unavailable", status: 503 };
    const decoded = await adminAuth.verifyIdToken(token);
    const isAdmin = decoded.email ? ADMIN_EMAILS.includes(decoded.email) : false;
    if (!isAdmin) return { error: "Forbidden", status: 403 };
    return { ok: true };
  } catch {
    return { error: "Forbidden", status: 403 };
  }
}

// GET — list all Firebase Auth users (paginated, up to 1000)
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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
    isAdmin: u.email ? ADMIN_EMAILS.includes(u.email) : false,
    createdAt: u.metadata.creationTime,
    lastSignIn: u.metadata.lastSignInTime,
  }));

  return NextResponse.json({ users, adminEmails: ADMIN_EMAILS });
}

// POST — grant/revoke admin OR update a user's password
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { action, email, uid, password } = body;

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
    if (!adminAuth) return NextResponse.json({ error: "Auth unavailable" }, { status: 503 });
    await adminAuth.updateUser(uid, { password });
    return NextResponse.json({ success: true });
  }

  // --- Grant / revoke admin ---
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }
  if (action !== "grant" && action !== "revoke") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const configRef = adminDb.collection("admin_config").doc("emails");
  const snap = await configRef.get();
  let admins: string[] = snap.exists ? (snap.data()?.list || []) : [...ADMIN_EMAILS];

  if (action === "grant") {
    if (!admins.includes(email)) admins.push(email);
  } else {
    admins = admins.filter((e) => e !== email);
  }

  await configRef.set({ list: admins, updatedAt: new Date() });
  return NextResponse.json({ success: true, adminEmails: admins });
}
