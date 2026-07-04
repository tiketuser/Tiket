import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import admin from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/authMiddleware";

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 503 }
      );
    }

    const { category, imageUrl } = await request.json();

    if (!category || !imageUrl) {
      return NextResponse.json(
        { error: "Missing category or imageUrl" },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection("defaultCategoryImages")
      .where("category", "==", category)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        imageData: imageUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await adminDb.collection("defaultCategoryImages").add({
        category,
        imageData: imageUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating default category image:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}
