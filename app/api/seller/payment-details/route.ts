import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

// GET - retrieve seller payment details
export async function GET(request: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: "Server services not available" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();

    const paymentDetails = userData?.paymentDetails || null;

    return NextResponse.json({
      hasPaymentDetails: !!paymentDetails,
      paymentDetails: paymentDetails
        ? {
            bankName: paymentDetails.bankName,
            branchNumber: paymentDetails.branchNumber,
            accountNumber: paymentDetails.accountNumber,
            accountHolderName: paymentDetails.accountHolderName,
          }
        : null,
    });
  } catch (error) {
    console.error("Get payment details error:", error);
    return NextResponse.json(
      { error: "Failed to get payment details" },
      { status: 500 }
    );
  }
}

// POST - save seller payment details
export async function POST(request: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: "Server services not available" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await request.json();
    const { bankName, branchNumber, accountNumber, accountHolderName } = body;

    // Validate required fields
    if (!bankName || !branchNumber || !accountNumber || !accountHolderName) {
      return NextResponse.json(
        { error: "כל השדות הם שדות חובה" },
        { status: 400 }
      );
    }

    // Validate branch number (3 digits)
    if (!/^\d{3,4}$/.test(branchNumber)) {
      return NextResponse.json(
        { error: "מספר סניף לא תקין (3-4 ספרות)" },
        { status: 400 }
      );
    }

    // Validate account number (6-13 digits)
    if (!/^\d{6,13}$/.test(accountNumber)) {
      return NextResponse.json(
        { error: "מספר חשבון לא תקין (6-13 ספרות)" },
        { status: 400 }
      );
    }

    await adminDb.collection("users").doc(uid).update({
      paymentDetails: {
        bankName,
        branchNumber,
        accountNumber,
        accountHolderName,
        updatedAt: new Date(),
      },
      paymentDetailsConfigured: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save payment details error:", error);
    return NextResponse.json(
      { error: "Failed to save payment details" },
      { status: 500 }
    );
  }
}
