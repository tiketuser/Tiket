import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "../../../lib/firebase-admin";
import { addArtistAliasToFirestore, getAllArtistAliases } from "../../../lib/artist-alias-db";

export async function POST(request: NextRequest) {
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

    // Create the variations array
    const allVariations = [hebrewName, englishName, ...variations].filter(
      (v: string, i: number, arr: string[]) => arr.indexOf(v) === i
    );

    const canonical = canonicalName.toLowerCase().trim();

    // Add to Firestore
    const result = await addArtistAliasToFirestore(canonical, allVariations);

    if (!result.success) {
      const statusCode =
        result.error?.code === "ALREADY_EXISTS" ? 409 :
        result.error?.code === "UNAVAILABLE" ? 503 : 500;
      return NextResponse.json(
        { error: result.error?.message },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Artist alias added successfully to Firestore",
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

export async function GET(request: NextRequest) {
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

    // Get all aliases from Firestore
    const result = await getAllArtistAliases();

    if (!result.success) {
      const statusCode = result.error?.code === "UNAVAILABLE" ? 503 : 500;
      return NextResponse.json(
        { error: result.error?.message },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      aliases: result.data,
    });
  } catch (error) {
    console.error("Error getting artist aliases:", error);
    return NextResponse.json(
      { error: "Failed to get artist aliases" },
      { status: 500 }
    );
  }
}
