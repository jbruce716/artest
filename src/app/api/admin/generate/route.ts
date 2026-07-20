import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateQuizForBook, generateAllQuizzes } from "@/lib/generate";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const isParent = user.groups?.some((g: string) =>
    ["parents", "admin"].some((k) => g.toLowerCase().includes(k))
  ) || user.email === "jonathon.bruce@live.com";

  if (!isParent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  // Generate for specific book or all books
  if (body.bookId) {
    // Fire and forget — don't wait for LLM
    generateQuizForBook(body.bookId).catch(console.error);
    return NextResponse.json({ message: "Generation started", bookId: body.bookId });
  } else {
    // Generate all
    generateAllQuizzes().catch(console.error);
    return NextResponse.json({ message: "Generating all quizzes" });
  }
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return generation status for all books
  const { db } = await import("@/lib/db");
  const res = await db.query(
    `SELECT b.title, b.quiz_ready, b.chapter_count, b.generated_at,
     (SELECT count(*) FROM artest.chapter_questions cq WHERE cq.book_id = b.id) as question_count
     FROM artest.books b ORDER BY b.title`
  );
  return NextResponse.json({ books: res.rows });
}