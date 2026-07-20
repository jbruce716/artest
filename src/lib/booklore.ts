export interface BookSeries {
  id: string;
  name: string;
  booksCount: number;
  authors: string[];
  coverUrl?: string;
}

export interface Book {
  id: string;
  seriesId: string;
  seriesName: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  releaseDate?: string;
  number?: number;
}

const API_URL = process.env.BOOKLORE_API_URL || "https://library.brucehome.dev/komga/api/v1";
const AUTH = Buffer.from(
  `${process.env.BOOKLORE_API_USER}:${process.env.BOOKLORE_API_PASS}`
).toString("base64");

async function komgaFetch(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Basic ${AUTH}`,
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`BookLore API error: ${res.status}`);
  return res.json();
}

export async function getSeries(libraryId: string = "2"): Promise<BookSeries[]> {
  const data = await komgaFetch(`/series?library_id=${libraryId}`);
  return (data.content || []).map((s: any) => ({
    id: s.id,
    name: s.metadata?.title || s.name,
    booksCount: s.booksCount || 0,
    authors: s.booksMetadata?.authors?.map((a: any) => a.name) || [],
  }));
}

export async function getBooksBySeries(seriesId: string, seriesName: string): Promise<Book[]> {
  const data = await komgaFetch(`/series/${seriesId}/books`);
  return (data.content || []).map((b: any) => ({
    id: b.id,
    seriesId,
    seriesName,
    title: b.metadata?.title || b.name,
    authors: b.metadata?.authors?.map((a: any) => a.name) || [],
    coverUrl: `/komga/api/v1/books/${b.id}/thumbnail`,
    releaseDate: b.metadata?.releaseDate,
    number: b.metadata?.number,
  }));
}

export async function getAllBooks(libraryId: string = "2"): Promise<Book[]> {
  const series = await getSeries(libraryId);
  const books = await Promise.all(
    series.map((s) => getBooksBySeries(s.id, s.name))
  );
  return books.flat();
}

export function coverUrl(bookId: string): string {
  return `${API_URL}/books/${bookId}/thumbnail`;
}