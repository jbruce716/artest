import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import QuizClient from "@/components/QuizClient";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  chapterNumber?: number;
}

export default async function QuizStartPage({
  searchParams,
}: {
  searchParams: Promise<{ bookId?: string; title?: string; author?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const bookId = params.bookId;
  const title = params.title || "Unknown Book";
  const author = params.author || "Unknown Author";

  if (!bookId) {
    redirect("/dashboard");
  }

  // Look up book in DB
  const bookRes = await db.query(
    "SELECT id, quiz_ready FROM artest.books WHERE booklore_book_id = $1",
    [bookId]
  );

  let questions: QuizQuestion[] = [];
  let error: string | null = null;

  if (bookRes.rows.length === 0 || !bookRes.rows[0].quiz_ready) {
    error = "Test is being prepared. Check back soon!";
  } else {
    const dbBookId = bookRes.rows[0].id;

    // Select 2 random questions per chapter
    const allQuestions = await db.query(
      `SELECT cq.id, cq.question, cq.options, cq.correct, bc.chapter_number
       FROM artest.chapter_questions cq
       JOIN artest.book_chapters bc ON cq.chapter_id = bc.id
       WHERE cq.book_id = $1
       ORDER BY bc.chapter_number, RANDOM()`,
      [dbBookId]
    );

    // Take 2 per chapter, then shuffle
    const byChapter = new Map<number, typeof allQuestions.rows>();
    for (const row of allQuestions.rows) {
      const ch = row.chapter_number;
      if (!byChapter.has(ch)) byChapter.set(ch, []);
      byChapter.get(ch)!.push(row);
    }

    for (const [, chQuestions] of byChapter) {
      for (const q of chQuestions.slice(0, 2)) {
        questions.push({
          question: q.question,
          options: q.options,
          correct: q.correct,
          chapterNumber: q.chapter_number,
        });
      }
    }

    // Shuffle question order
    questions.sort(() => Math.random() - 0.5);

    if (questions.length === 0) {
      error = "No questions available for this book yet.";
    }
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-zinc-200">Not ready yet</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <a
            href="/dashboard"
            className="inline-block text-orange-500 hover:text-orange-400"
          >
            ← Back to books
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 pt-6 max-w-2xl mx-auto w-full">
        <a href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to books
        </a>
      </div>
      <QuizClient questions={questions} bookTitle={title} bookAuthor={author} />
    </div>
  );
}