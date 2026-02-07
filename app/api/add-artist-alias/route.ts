import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  // Require admin authentication
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }

  try {
    const { canonicalName, hebrewName, englishName, variations } =
      await request.json();

    if (!canonicalName || !hebrewName || !englishName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if Firestore is available
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database service not available" },
        { status: 503 }
      );
    }

    // Create the new alias entry
    const allVariations = [hebrewName, englishName, ...variations].filter(
      (v: string, i: number, arr: string[]) => arr.indexOf(v) === i
    );

    const canonical = canonicalName.toLowerCase().trim();

    // Check if alias already exists in Firestore
    const aliasRef = adminDb.collection('artist_aliases').doc(canonical);
    const existingDoc = await aliasRef.get();

    if (existingDoc.exists) {
      return NextResponse.json(
        { error: `Alias for "${canonical}" already exists` },
        { status: 409 }
      );
    }

    // Add the new alias to Firestore
    await aliasRef.set({
      canonical,
      variations: allVariations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Artist alias added successfully to database",
      alias: { canonical, variations: allVariations },
    });
  } catch (error) {
    console.error("Error adding artist alias:", error);
    return NextResponse.json(
      { error: "Failed to add artist alias" },
      { status: 500 }
    );
  }
}
