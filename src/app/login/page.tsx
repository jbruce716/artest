import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-5xl font-bold tracking-tight mb-3">ARTest</h1>
          <p className="text-zinc-400 text-lg">
            Reading comprehension tests for kids
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signIn("authentik", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
          >
            Sign in with SSO
          </button>
        </form>
        <p className="mt-6 text-sm text-zinc-500">
          Log in with your family account to get started.
        </p>
      </div>
    </div>
  );
}