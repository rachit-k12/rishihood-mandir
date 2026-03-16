import { NextRequest, NextResponse } from "next/server";
import { storeDocumentForDonor } from "@/lib/db";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const donorId = formData.get("donorId") as string | null;
    const type = formData.get("type") as string | null;

    if (!file || !donorId || !type) {
      return NextResponse.json(
        { error: "Missing file, donorId, or type" },
        { status: 400 }
      );
    }

    if (type !== "pan" && type !== "aadhaar") {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, JPG, PNG, WebP" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const docUrl = `/api/documents/${donorId}/${type}`;

    await storeDocumentForDonor(donorId, type, base64, file.type, docUrl);

    return NextResponse.json({ success: true, url: docUrl });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
