"use client";

import { useState, useMemo } from "react";

interface Book {
  id: string;
  seriesId: string;
  seriesName: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  releaseDate?: string;
  number?: number;
}

export default function BookSearch({ books }: { books: Book[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return books;
    const q = query.toLowerCase();
    return books.filter((b) => {
      const haystack = [
        b.title,
        b.seriesName,
        b.authors.join(" "),
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query, books]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search title, author, or series..."
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-orange-500 focus:outline-none mb-6"
      />
      {filtered.length === 0 && query.trim() && (
        <p className="text-zinc-500 text-center py-8">No books found.</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((book) => (
          <a
            key={book.id}
            href={`/quiz/start?bookId=${book.id}&title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.authors.join(", "))}`}
            className="bg-zinc-900 rounded-lg p-3 border border-zinc-800 hover:border-orange-500 transition-colors group"
          >
            <div className="aspect-[2/3] bg-zinc-800 rounded mb-3 overflow-hidden">
              <img
                src={`/api/books/${book.id}/cover`}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
              />
            </div>
            <p className="text-sm font-medium text-zinc-200 line-clamp-2">{book.title}</p>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{book.authors.join(", ")}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{book.seriesName}</p>
          </a>
        ))}
      </div>
    </div>
  );
}