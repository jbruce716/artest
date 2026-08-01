import { NextRequest, NextResponse } from "next/server";
import { generateNewQuizzesOnly } from "@/lib/generate";

// Internal polling endpoint — triggered hourly by a setInterval in the app
// Auth: X-ARTest-Service-Token header must match AUTH_SECRET
export async function POST(req: NextRequest) {
  const serviceToken = req.headers.get("x-artest-service-token");
  const expectedToken = process.env.AUTH_SECRET;

  if (!expectedToken || serviceToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fire and forget — don't block the request
  generateNewQuizzesOnly()
    .then((result) => {
      console.log(`[ARTest] Hourly poll: ${result.generated} new, ${result.skipped} existing`);
    })
    .catch(console.error);

  return NextResponse.json({ message: "Polling triggered" });
}