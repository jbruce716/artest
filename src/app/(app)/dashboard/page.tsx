import { auth, signOut } from "@/auth";
import { getAllBooks } from "@/lib/booklore";
import BookSearch from "@/components/BookSearch";

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
      <div className="flex items-center justify-between mb-6">
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

      {!loadError && <BookSearch books={books} />}

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