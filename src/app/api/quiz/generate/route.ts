import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateQuiz } from "@/lib/llama";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { bookId, title, author } = body;

  if (!title) {
    return NextResponse.json({ error: "Book title required" }, { status: 400 });
  }

  try {
    const quiz = await generateQuiz(title, author || "Unknown");
    return NextResponse.json({
      bookId,
      title,
      author,
      ...quiz,
    });
  } catch (error) {
    console.error("Quiz generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate quiz" },
      { status: 500 }
    );
  }
}