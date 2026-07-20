import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.BOOKLORE_API_URL || "https://library.brucehome.dev/komga/api/v1";
const AUTH = Buffer.from(
  `${process.env.BOOKLORE_API_USER}:${process.env.BOOKLORE_API_PASS}`
).toString("base64");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  const id = resolved.id;
  try {
    const res = await fetch(`${API_URL}/books/${id}/thumbnail`, {
      headers: { Authorization: `Basic ${AUTH}` },
    });
    if (!res.ok) {
      return new NextResponse("Not found", { status: 404 });
    }
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}