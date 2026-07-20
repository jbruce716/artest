import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function QuizResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ score?: string; total?: string; title?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const score = parseInt(params.score || "0");
  const total = parseInt(params.total || "0");
  const title = decodeURIComponent(params.title || "Unknown");
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const emoji = percentage >= 80 ? "🎉" : percentage >= 60 ? "👍" : percentage >= 40 ? "📚" : "💪";
  const message =
    percentage >= 80 ? "Excellent reading!" :
    percentage >= 60 ? "Good job!" :
    percentage >= 40 ? "Keep reading!" :
    "Try again — you've got this!";

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="text-center max-w-md w-full">
        <div className="text-6xl mb-4">{emoji}</div>
        <h1 className="text-3xl font-bold mb-2">{message}</h1>
        <p className="text-zinc-400 mb-8">{title}</p>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 mb-6">
          <div className="text-5xl font-bold text-orange-500 mb-2">
            {score}/{total}
          </div>
          <p className="text-zinc-400">{percentage}% correct</p>
        </div>

        <div className="flex gap-4">
          <a
            href="/dashboard"
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            More books
          </a>
          <a
            href={`/quiz/start?title=${encodeURIComponent(title)}`}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Try again
          </a>
        </div>
      </div>
    </div>
  );
}