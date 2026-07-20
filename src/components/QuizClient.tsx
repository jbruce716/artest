"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface QuizClientProps {
  questions: QuizQuestion[];
  bookTitle: string;
  bookAuthor: string;
}

export default function QuizClient({ questions, bookTitle, bookAuthor }: QuizClientProps) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

  const question = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const score = answers.filter((a, i) => a === questions[i].correct).length;

  const handleSelect = useCallback((idx: number) => {
    if (showResult) return;
    setSelected(idx);
  }, [showResult]);

  const handleNext = useCallback(async () => {
    if (selected === null) return;

    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setShowResult(false);
    setSelected(null);

    if (isLast) {
      // Submit results
      setLoading(true);
      const finalScore = newAnswers.filter((a, i) => a === questions[i].correct).length;
      try {
        await fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookTitle,
            bookAuthor,
            answers: newAnswers,
            score: finalScore,
            total: questions.length,
          }),
        });
      } catch {
        // Non-fatal — results still show
      }
      setLoading(false);
      router.push(`/quiz/results?score=${finalScore}&total=${questions.length}&title=${encodeURIComponent(bookTitle)}`);
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  }, [selected, answers, isLast, questions, bookTitle, bookAuthor, router]);

  return (
    <div className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-zinc-400 mb-2">
          <span>{bookTitle}</span>
          <span>Question {currentIdx + 1} of {questions.length}</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-4">
        <h2 className="text-xl font-semibold mb-6">{question.question}</h2>
        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-4 rounded-lg border transition-colors text-base ${
                selected === idx
                  ? "border-orange-500 bg-orange-500/10 text-orange-100"
                  : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
              }`}
            >
              <span className="font-bold mr-3 text-zinc-400">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={selected === null || loading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
      >
        {loading ? "Saving results..." : isLast ? "Finish" : "Next →"}
      </button>
    </div>
  );
}