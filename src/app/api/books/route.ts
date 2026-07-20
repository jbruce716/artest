import { NextResponse } from "next/server";
import { getAllBooks } from "@/lib/booklore";

export async function GET() {
  try {
    const books = await getAllBooks("2");
    return NextResponse.json({ books });
  } catch (error) {
    console.error("Failed to fetch books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}