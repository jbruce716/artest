import { auth, signOut } from "@/auth";
import { getAllBooks } from "@/lib/booklore";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    return <div>Please log in</div>;
  }

  const user = session.user as any;
  const isParent = user.groups?.some((g: string) =>
    ["parents", "admin"].some((k) => g.toLowerCase().includes(k))
  );

  let books: Awaited<ReturnType<typeof getAllBooks>> = [];
  let loadError = false;
  try {
    books = await getAllBooks("2");
  } catch {
    loadError = true;
  }

  return (
    <div className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Hi, {user.name || user.username}! 👋</h1>
          <p className="text-zinc-400 mt-1">Pick a book to take a reading test.</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Log out
          </button>
        </form>
      </div>

      {loadError && (
        <div className="bg-red-950 border border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-200 text-sm">
            Couldn&apos;t load books from BookLore. Check that the Komga API is enabled.
          </p>
        </div>
      )}

      {books.length === 0 && !loadError && (
        <div className="text-center py-12">
          <p className="text-zinc-500">No books found in the Children library.</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {books.map((book) => (
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

      {isParent && (
        <div className="mt-8 pt-8 border-t border-zinc-800">
          <a
            href="/admin"
            className="text-orange-500 hover:text-orange-400 text-sm"
          >
            View test results →
          </a>
        </div>
      )}
    </div>
  );
}