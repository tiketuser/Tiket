import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

    if (!storage) {
      return NextResponse.json(
        { 
          error: "Firebase Storage not initialized. Please enable Firebase Storage in Firebase Console: https://console.firebase.google.com/project/tiket-9268c/storage",
          hint: "Go to Firebase Console → Storage → Get Started"
        },
        { status: 503 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Firebase Storage
    const imageRef = ref(
      storage,
      `ticket-images/${Date.now()}-${file.name}`
    );
    
    const snapshot = await uploadBytes(imageRef, buffer as any, {
      contentType: file.type,
    });
    
    const imageUrl = await getDownloadURL(snapshot.ref);

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
