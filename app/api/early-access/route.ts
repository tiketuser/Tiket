import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^0\d{8,9}$/;

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }

  if (!adminDb) {
    return NextResponse.json({ error: "השירות אינו זמין כרגע" }, { status: 503 });
  }

  try {
    const snapshot = await adminDb
      .collection("earlyAccessSignups")
      .orderBy("createdAt", "desc")
      .get();

    const signups = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email as string,
        phone: data.phone as string,
        createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
      };
    });

    return NextResponse.json({ signups });
  } catch (error) {
    console.error("Error listing early access signups:", error);
    return NextResponse.json({ error: "שגיאה בטעינת הרשומות" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, phone } = await request.json();

    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanPhone = typeof phone === "string" ? phone.replace(/[\s-]/g, "") : "";

    if (!EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json({ error: "כתובת האימייל אינה תקינה" }, { status: 400 });
    }

    if (!PHONE_RE.test(cleanPhone)) {
      return NextResponse.json({ error: "מספר הטלפון אינו תקין" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "השירות אינו זמין כרגע" }, { status: 503 });
    }

    const docId = cleanEmail.replace(/[^a-z0-9_.-]/g, "_");
    const docRef = adminDb.collection("earlyAccessSignups").doc(docId);
    const existing = await docRef.get();

    await docRef.set(
      {
        email: cleanEmail,
        phone: cleanPhone,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(existing.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving early access signup:", error);
    return NextResponse.json({ error: "משהו השתבש, נסו שוב" }, { status: 500 });
  }
}
