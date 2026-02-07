import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(request: NextRequest) {
  // Require admin authentication
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }

  try {
    // Check authentication - require admin privileges
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - Missing authentication token" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const authResult = await verifyAdminToken(idToken);

    if (!authResult.isValid || !authResult.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin privileges required" },
        { status: 403 }
      );
    }

    // Parse request body
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
        { error: result.error?.message },
        { status: statusCode }
      );
    }

    // Add the new alias to Firestore with server timestamp
    await aliasRef.set({
      canonical,
      variations: allVariations,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Artist alias added successfully to database",
      alias: { canonical, variations: allVariations },
    });
  } catch (error) {
    console.error("Error getting artist aliases:", error);
    return NextResponse.json(
      { error: "Failed to get artist aliases" },
      { status: 500 }
    );
  }
}
