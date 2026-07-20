export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number; // index 0-3
}

export interface GeneratedQuiz {
  questions: QuizQuestion[];
  model: string;
}

const API_URL = process.env.LLAMA_API_URL || "http://192.168.1.126:8080/v1";
const MODEL = process.env.LLAMA_MODEL || "/root/models/agents-a1-mtp-apex-compact.gguf";

export async function generateQuiz(bookTitle: string, bookAuthor: string): Promise<GeneratedQuiz> {
  const payload = {
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a reading comprehension test generator for children ages 8-12. Generate 10 multiple-choice questions about the given book. Questions should test reading comprehension, not obscure trivia. Each question has 4 options. Return ONLY a valid JSON array, no markdown, no explanation. Format: [{\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correct\": 0}] where correct is the index (0-3) of the right answer.",
      },
      {
        role: "user",
        content: `Generate 10 multiple choice reading comprehension questions for: ${bookTitle} by ${bookAuthor}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  };

  const res = await fetch(`${API_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`llama.cpp API error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";

  if (!content) {
    throw new Error("Model returned empty content (may need more max_tokens)");
  }

  let questions: QuizQuestion[];
  try {
    questions = JSON.parse(content);
  } catch {
    // Try to extract JSON from the content (in case of markdown wrapping)
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      questions = JSON.parse(match[0]);
    } else {
      throw new Error("Failed to parse quiz JSON from model output");
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Model returned no questions");
  }

  return { questions, model: MODEL };
}