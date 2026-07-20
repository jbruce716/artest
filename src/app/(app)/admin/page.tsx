import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;
  const isParent = user.groups?.some((g: string) =>
    ["parents", "admin"].some((k) => g.toLowerCase().includes(k))
  );

  if (!isParent) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-zinc-400">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Test Results</h1>
        <p className="text-zinc-400 mt-1">
          All reading test results from the kids.
        </p>
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 text-center">
        <p className="text-zinc-500">
          No test results yet. Results will appear here once kids start taking tests.
        </p>
      </div>
    </div>
  );
}