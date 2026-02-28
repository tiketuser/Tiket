import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!admin.apps.length) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 503 }
      );
    }

    const bucket = admin.storage().bucket(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    );
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `event-images/${Date.now()}-${file.name}`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(buffer, { contentType: file.type });
    await fileRef.makePublic();

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error) {
    console.error("Error uploading event image:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
