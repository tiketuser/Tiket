import { NextRequest, NextResponse } from "next/server";
import admin, { adminAuth } from "@/lib/firebaseAdmin";
import { randomUUID } from "crypto";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function isAllowedImageBuffer(buf: Buffer): boolean {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true; // JPEG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true; // PNG
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return true; // WebP
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication — only admins upload event images
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ") || !adminAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
    if (decoded.admin !== true) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG and WebP images are allowed" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
    }

    if (!admin.apps.length) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 503 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate actual content via magic bytes — prevents MIME type spoofing
    if (!isAllowedImageBuffer(buffer)) {
      return NextResponse.json({ error: "File content does not match an allowed image type" }, { status: 400 });
    }

    const bucket = admin.storage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    // Use UUID filename — never use client-supplied names (prevents path traversal)
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const fileName = `event-images/${randomUUID()}.${ext}`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(buffer, { contentType: file.type });
    await fileRef.makePublic();

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error) {
    console.error("Error uploading event image:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
