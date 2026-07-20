import { auth, signOut } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    return <div>Please log in</div>;
  }

  const user = session.user as any;
  const isParent = user.groups?.some((g: string) =>
    ["parents", "admin"].some((k) => g.toLowerCase().includes(k))
  );

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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 animate-pulse"
          >
            <div className="aspect-[2/3] bg-zinc-800 rounded mb-3" />
            <div className="h-3 bg-zinc-800 rounded w-3/4" />
            <div className="h-2 bg-zinc-800 rounded w-1/2 mt-2" />
          </div>
        ))}
      </div>

      <p className="text-center text-zinc-500 mt-12 text-sm">
        Books will appear here once BookLore integration is configured.
      </p>

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