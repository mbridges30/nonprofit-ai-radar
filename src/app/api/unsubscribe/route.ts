import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const sub = db
    .select()
    .from(subscribers)
    .where(eq(subscribers.unsubscribe_token, token))
    .get();

  if (!sub) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h2>Invalid link</h2>
        <p>This unsubscribe link is not valid.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  db.delete(subscribers).where(eq(subscribers.id, sub.id)).run();

  return new NextResponse(
    `<html><body style="font-family:sans-serif;text-align:center;padding:60px;">
      <h2>Unsubscribed</h2>
      <p>You've been removed from the AI in Nonprofits digest. Sorry to see you go!</p>
      <a href="/news" style="color:#5f9ea0;">Back to News</a>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
