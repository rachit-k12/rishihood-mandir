import { NextRequest, NextResponse } from "next/server";
import { getDocumentForDonor } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ donorId: string; type: string }> }
) {
  const { donorId, type } = await params;

  if (type !== "pan" && type !== "aadhaar") {
    return NextResponse.json(
      { error: "Invalid document type" },
      { status: 400 }
    );
  }

  try {
    const doc = await getDocumentForDonor(donorId, type);
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(doc.base64, "base64");
    const ext = doc.mimeType.includes("pdf") ? "pdf" : "bin";
    const filename = `${type}-card.${ext}`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Document serving error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve document" },
      { status: 500 }
    );
  }
}
