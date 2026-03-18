import { NextRequest, NextResponse } from "next/server";

const KIT_API_KEY = process.env.KIT_API_KEY;
const KIT_FORM_ID = process.env.KIT_FORM_ID || "9219010";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://bridgesstrategy.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const normalised = email.trim().toLowerCase();

    if (!KIT_API_KEY) {
      console.error("KIT_API_KEY not configured");
      return NextResponse.json(
        { error: "Subscription service unavailable" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Add subscriber to Kit form
    const kitRes = await fetch(
      `https://api.convertkit.com/v3/forms/${KIT_FORM_ID}/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: KIT_API_KEY,
          email: normalised,
        }),
      }
    );

    if (!kitRes.ok) {
      const err = await kitRes.text();
      console.error("Kit API error:", err);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { message: "You're subscribed! Check your email to confirm." },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
