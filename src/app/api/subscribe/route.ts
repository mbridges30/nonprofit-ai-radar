import { NextRequest, NextResponse } from "next/server";

// Kit v4 uses one API key for everything (subscribe, broadcasts). KIT_V4_API_KEY
// is accepted as an alias so an older deployment keeps working.
const KIT_API_KEY = process.env.KIT_API_KEY || process.env.KIT_V4_API_KEY;
const KIT_FORM_ID = process.env.KIT_FORM_ID || "9219010";
const KIT_API = "https://api.kit.com/v4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://bridgesstrategy.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: CORS_HEADERS });
}

function kitHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Kit-Api-Key": KIT_API_KEY as string,
  };
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

    // Step 1: upsert the subscriber (200 if they already exist, 201 if new).
    const createRes = await fetch(`${KIT_API}/subscribers`, {
      method: "POST",
      headers: kitHeaders(),
      body: JSON.stringify({ email_address: normalised }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error("Kit create-subscriber error:", createRes.status, err);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Step 2: attach them to the form, which is what triggers the form's
    // confirmation/welcome sequence. v4 requires the subscriber to exist first.
    const formRes = await fetch(`${KIT_API}/forms/${KIT_FORM_ID}/subscribers`, {
      method: "POST",
      headers: kitHeaders(),
      body: JSON.stringify({ email_address: normalised }),
    });

    if (!formRes.ok) {
      const err = await formRes.text();
      console.error("Kit add-to-form error:", formRes.status, err);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { message: "You're subscribed. Check your email to confirm." },
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
