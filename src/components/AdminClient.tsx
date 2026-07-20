"use client";

import { useState } from "react";

interface Book {
  id: number;
  title: string;
  author: string;
  quiz_ready: boolean;
  chapter_count: number;
  question_count: number;
  generated_at: string | null;
}

interface TestResult {
  id: number;
  student_name: string;
  book_title: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
}

export default function AdminClient({ books, results }: { books: Book[]; results: TestResult[] }) {
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const triggerGenerate = async (bookId?: string) => {
    setGenerating(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookId ? { bookId } : {}),
      });
      const data = await res.json();
      setMessage(data.message || "Generation started");
    } catch {
      setMessage("Failed to trigger generation");
    }
    setGenerating(false);
  };

  return (
    <div className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Generation controls */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Quiz Generation</h2>
          <button
            onClick={() => triggerGenerate()}
            disabled={generating}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {generating ? "Starting..." : "Generate All"}
          </button>
        </div>
        {message && <p className="text-sm text-zinc-400 mb-2">{message}</p>}

        {books.length === 0 ? (
          <p className="text-zinc-500 text-sm">No books processed yet. Click "Generate All" to start.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-400 border-b border-zinc-800">
                <th className="text-left py-2">Book</th>
                <th className="text-center py-2">Chapters</th>
                <th className="text-center py-2">Questions</th>
                <th className="text-center py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id} className="border-b border-zinc-900">
                  <td className="py-2 text-zinc-200">{b.title}</td>
                  <td className="text-center py-2 text-zinc-400">{b.chapter_count}</td>
                  <td className="text-center py-2 text-zinc-400">{b.question_count}</td>
                  <td className="text-center py-2">
                    {b.quiz_ready ? (
                      <span className="text-green-500">✓ Ready</span>
                    ) : (
                      <span className="text-yellow-500">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Test results */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
        <h2 className="text-lg font-semibold mb-4">Test Results</h2>
        {results.length === 0 ? (
          <p className="text-zinc-500 text-sm">No test results yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-400 border-b border-zinc-800">
                <th className="text-left py-2">Student</th>
                <th className="text-left py-2">Book</th>
                <th className="text-center py-2">Score</th>
                <th className="text-center py-2">%</th>
                <th className="text-right py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-zinc-900">
                  <td className="py-2 text-zinc-200">{r.student_name}</td>
                  <td className="py-2 text-zinc-400">{r.book_title || "—"}</td>
                  <td className="text-center py-2 text-zinc-300">{r.score}/{r.total_questions}</td>
                  <td className="text-center py-2 text-zinc-300">{r.percentage}%</td>
                  <td className="text-right py-2 text-zinc-500">
                    {new Date(r.completed_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}