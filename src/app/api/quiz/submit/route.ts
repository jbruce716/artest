import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const body = await req.json();
  const { bookTitle, bookAuthor, score, total, answers, questionIds } = body;

  // Ensure student exists
  await db.query(
    `INSERT INTO artest.students (authentik_subject, username, display_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (authentik_subject) DO UPDATE SET username = $2, display_name = $3`,
    [user.id, user.username || user.name, user.name]
  );

  // Find book in DB
  const bookRes = await db.query(
    "SELECT id FROM artest.books WHERE title ILIKE $1",
    [bookTitle]
  );

  const bookId = bookRes.rows.length > 0 ? bookRes.rows[0].id : null;
  const percentage = total > 0 ? Math.round((score / total) * 100 * 100) / 100 : 0;

  // Save test result
  await db.query(
    `INSERT INTO artest.test_results
     (student_subject, student_name, book_id, score, total_questions, percentage, answers, question_ids)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [user.id, user.name, bookId, score, total, percentage,
     JSON.stringify(answers), JSON.stringify(questionIds || [])]
  );

  console.log(`[ARTest] ${user.name} scored ${score}/${total} on "${bookTitle}"`);

  return NextResponse.json({ success: true });
}