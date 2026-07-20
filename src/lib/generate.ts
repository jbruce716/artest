import { db } from "@/lib/db";
import { extractChaptersFromEpub } from "@/lib/epub";
import { generateQuiz } from "@/lib/llama";

const KOMGA_URL = process.env.BOOKLORE_API_URL || "https://library.brucehome.dev/komga/api/v1";
const AUTH = Buffer.from(
  `${process.env.BOOKLORE_API_USER}:${process.env.BOOKLORE_API_PASS}`
).toString("base64");

interface BookSeries {
  id: string;
  name: string;
  booksCount: number;
}

interface Book {
  id: string;
  seriesId: string;
  seriesName: string;
  title: string;
  authors: string[];
}

async function komgaFetch(path: string): Promise<any> {
  const res = await fetch(`${KOMGA_URL}${path}`, {
    headers: { Authorization: `Basic ${AUTH}` },
  });
  if (!res.ok) throw new Error(`Komga API error: ${res.status}`);
  return res.json();
}

async function downloadEpub(bookId: string): Promise<Buffer> {
  const res = await fetch(`${KOMGA_URL}/books/${bookId}/file`, {
    headers: { Authorization: `Basic ${AUTH}` },
  });
  if (!res.ok) throw new Error(`Failed to download EPUB: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function getBookMetadata(bookId: string): Promise<any> {
  return komgaFetch(`/books/${bookId}`);
}

async function getSeriesAndBooks(libraryId: string = "2"): Promise<{ series: BookSeries[]; books: Book[] }> {
  const seriesData = await komgaFetch(`/series?library_id=${libraryId}`);
  const series: BookSeries[] = (seriesData.content || []).map((s: any) => ({
    id: s.id,
    name: s.metadata?.title || s.name,
    booksCount: s.booksCount || 0,
  }));

  const books: Book[] = [];
  for (const s of series) {
    const bookData = await komgaFetch(`/series/${s.id}/books`);
    for (const b of bookData.content || []) {
      books.push({
        id: b.id,
        seriesId: s.id,
        seriesName: s.name,
        title: b.metadata?.title || b.name,
        authors: b.metadata?.authors?.map((a: any) => a.name) || [],
      });
    }
  }

  return { series, books };
}

async function ensureBookInDb(book: Book): Promise<number> {
  const res = await db.query(
    `INSERT INTO artest.books (booklore_book_id, title, author, series)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (booklore_book_id) DO UPDATE SET title = $2, author = $3, series = $4
     RETURNING id`,
    [book.id, book.title, book.authors.join(", "), book.seriesName]
  );
  return res.rows[0].id;
}

async function generateQuestionsForChapter(
  bookTitle: string,
  bookAuthor: string,
  chapter: { number: number; title: string; text: string }
): Promise<{ question: string; options: string[]; correct: number }[]> {
  // Truncate chapter text to 6000 chars to fit context window
  const truncated = chapter.text.slice(0, 6000);

  const payload = {
    model: process.env.LLAMA_MODEL || "/root/models/agents-a1-mtp-apex-compact.gguf",
    messages: [
      {
        role: "system",
        content: `You are a reading comprehension test generator for children ages 8-12. Below is a chapter from "${bookTitle}" by ${bookAuthor}. Generate 5 multiple-choice questions that test whether the student read and understood THIS chapter. Questions should cover key events, character motivations, and important details from the text. Return ONLY a valid JSON array, no markdown. Format: [{"question":"...","options":["A","B","C","D"],"correct":0}] where correct is the index (0-3) of the right answer.`,
      },
      {
        role: "user",
        content: `=== CHAPTER ${chapter.number}: ${chapter.title} ===\n${truncated}\n=== END CHAPTER ===`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  };

  const res = await fetch(
    `${process.env.LLAMA_API_URL}/chat/completions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) throw new Error(`llama.cpp error: ${res.status}`);

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  if (!content) throw new Error("Empty content from model");

  let questions: { question: string; options: string[]; correct: number }[];
  try {
    questions = JSON.parse(content);
  } catch {
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      questions = JSON.parse(match[0]);
    } else {
      throw new Error("Failed to parse questions JSON");
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("No questions returned");
  }

  return questions.slice(0, 5); // Max 5 per chapter
}

export async function generateQuizForBook(bookId: string): Promise<void> {
  // Get book metadata from Komga
  const bookMeta = await getBookMetadata(bookId);
  const book: Book = {
    id: bookMeta.id,
    seriesId: bookMeta.seriesId,
    seriesName: bookMeta.seriesTitle,
    title: bookMeta.metadata?.title || bookMeta.name,
    authors: bookMeta.metadata?.authors?.map((a: any) => a.name) || [],
  };

  console.log(`[ARTest] Processing: ${book.title} by ${book.authors.join(", ")}`);

  // Ensure book in DB
  const dbBookId = await ensureBookInDb(book);

  // Delete old chapters + questions if regenerating
  await db.query("DELETE FROM artest.book_chapters WHERE book_id = $1", [dbBookId]);

  // Download EPUB
  console.log(`[ARTest] Downloading EPUB...`);
  const epubBuffer = await downloadEpub(bookId);

  // Extract chapters
  console.log(`[ARTest] Extracting chapters...`);
  const chapters = extractChaptersFromEpub(epubBuffer);
  console.log(`[ARTest] Found ${chapters.length} chapters`);

  // Store chapters and generate questions
  for (const chapter of chapters) {
    console.log(`[ARTest] Chapter ${chapter.number}: "${chapter.title}" (${chapter.charCount} chars)`);

    // Store chapter text
    const chapterRes = await db.query(
      `INSERT INTO artest.book_chapters (book_id, chapter_number, chapter_title, text, char_count)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [dbBookId, chapter.number, chapter.title, chapter.text, chapter.charCount]
    );
    const chapterDbId = chapterRes.rows[0].id;

    // Generate questions
    try {
      console.log(`[ARTest] Generating questions for chapter ${chapter.number}...`);
      const questions = await generateQuestionsForChapter(
        book.title,
        book.authors.join(", "),
        chapter
      );
      console.log(`[ARTest] Got ${questions.length} questions for chapter ${chapter.number}`);

      // Store questions
      for (const q of questions) {
        await db.query(
          `INSERT INTO artest.chapter_questions (book_id, chapter_id, question, options, correct)
           VALUES ($1, $2, $3, $4, $5)`,
          [dbBookId, chapterDbId, q.question, JSON.stringify(q.options), q.correct]
        );
      }
    } catch (e) {
      console.error(`[ARTest] Failed chapter ${chapter.number}:`, e);
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Mark as ready
  await db.query(
    `UPDATE artest.books SET quiz_ready = TRUE, generated_at = NOW(), chapter_count = $2 WHERE id = $1`,
    [dbBookId, chapters.length]
  );

  console.log(`[ARTest] Done: ${book.title} — ${chapters.length} chapters, quiz ready`);
}

export async function generateAllQuizzes(): Promise<void> {
  const { books } = await getSeriesAndBooks("2");
  console.log(`[ARTest] Found ${books.length} books in Children library`);

  for (const book of books) {
    // Check if quiz already exists and is ready
    const res = await db.query(
      "SELECT id, quiz_ready FROM artest.books WHERE booklore_book_id = $1",
      [book.id]
    );

    if (res.rows.length > 0 && res.rows[0].quiz_ready) {
      console.log(`[ARTest] Skipping ${book.title} — quiz already ready`);
      continue;
    }

    try {
      await generateQuizForBook(book.id);
    } catch (e) {
      console.error(`[ARTest] Failed book ${book.title}:`, e);
    }
  }

  console.log("[ARTest] All done.");
}

// Run if called directly
if (require.main === module) {
  generateAllQuizzes().catch(console.error);
}