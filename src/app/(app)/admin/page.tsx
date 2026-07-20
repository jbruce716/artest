import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AdminClient from "@/components/AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;
  const isParent = user.groups?.some((g: string) =>
    ["parents", "admin"].some((k) => g.toLowerCase().includes(k))
  ) || user.email === "jonathon.bruce@live.com";

  if (!isParent) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-zinc-400">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  const books = await db.query(
    `SELECT b.id, b.title, b.author, b.quiz_ready, b.chapter_count, b.generated_at,
     (SELECT count(*) FROM artest.chapter_questions cq WHERE cq.book_id = b.id) as question_count
     FROM artest.books b ORDER BY b.title`
  );

  const results = await db.query(
    `SELECT tr.id, tr.student_name, b.title as book_title, tr.score, tr.total_questions,
     tr.percentage, tr.completed_at
     FROM artest.test_results tr
     LEFT JOIN artest.books b ON tr.book_id = b.id
     ORDER BY tr.completed_at DESC LIMIT 50`
  );

  return <AdminClient books={books.rows} results={results.rows} />;
}