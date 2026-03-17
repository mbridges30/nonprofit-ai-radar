import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://radar.bridgesstrategy.com";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const normalised = email.trim().toLowerCase();

    // Check if already subscribed
    const existing = db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, normalised))
      .get();

    if (existing?.confirmed) {
      return NextResponse.json({ message: "Already subscribed!" });
    }

    const confirmToken = crypto.randomUUID();
    const unsubscribeToken = crypto.randomUUID();

    if (existing) {
      // Re-send confirmation
      db.update(subscribers)
        .set({ confirm_token: confirmToken })
        .where(eq(subscribers.id, existing.id))
        .run();
    } else {
      db.insert(subscribers)
        .values({
          email: normalised,
          confirmed: 0,
          confirm_token: confirmToken,
          unsubscribe_token: unsubscribeToken,
        })
        .run();
    }

    // Send confirmation email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Nonprofit AI Radar <noreply@bridgesstrategy.com>",
        to: normalised,
        subject: "Confirm your AI News Digest subscription",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #4a8284;">Confirm your subscription</h2>
            <p>Click the button below to start receiving the weekly AI in Nonprofits news digest.</p>
            <a href="${SITE_URL}/api/subscribe/confirm?token=${confirmToken}"
               style="display: inline-block; background: #5f9ea0; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
              Confirm Subscription
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ message: "Check your email to confirm!" });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
