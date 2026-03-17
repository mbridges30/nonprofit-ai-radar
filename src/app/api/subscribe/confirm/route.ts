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
    .where(eq(subscribers.confirm_token, token))
    .get();

  if (!sub) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h2>Invalid or expired link</h2>
        <p>This confirmation link is no longer valid.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  db.update(subscribers)
    .set({ confirmed: 1, confirm_token: null })
    .where(eq(subscribers.id, sub.id))
    .run();

  return new NextResponse(
    `<html><body style="font-family:sans-serif;text-align:center;padding:60px;">
      <h2 style="color:#4a8284;">You're subscribed!</h2>
      <p>You'll receive the weekly AI in Nonprofits digest every Monday morning.</p>
      <a href="/news" style="color:#5f9ea0;">Back to News</a>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
