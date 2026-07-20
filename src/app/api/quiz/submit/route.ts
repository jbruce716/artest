import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { bookTitle, score, total } = body;

  // Phase 4: Save to Postgres + send email
  // For now, just log it
  console.log(`[ARTest] ${session.user?.name} scored ${score}/${total} on "${bookTitle}"`);

  return NextResponse.json({ success: true });
}