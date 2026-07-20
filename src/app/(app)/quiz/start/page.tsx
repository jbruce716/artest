import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { generateQuiz } from "@/lib/llama";
import QuizClient from "@/components/QuizClient";

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
  const title = params.title || "Unknown Book";
  const author = params.author || "Unknown Author";

  let questions;
  let error: string | null = null;

  try {
    const quiz = await generateQuiz(title, author);
    questions = quiz.questions;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to generate quiz";
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Couldn&apos;t generate test</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <p className="text-zinc-500 text-sm">
            The AI might be busy. Try again in a minute.
          </p>
          <a
            href="/dashboard"
            className="inline-block mt-6 text-orange-500 hover:text-orange-400"
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
      <QuizClient questions={questions!} bookTitle={title} bookAuthor={author} />
    </div>
  );
}