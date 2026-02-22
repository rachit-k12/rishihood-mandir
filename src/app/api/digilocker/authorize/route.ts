import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getAuthorizationUrl,
  generateCodeVerifier,
  generateCodeChallenge,
} from "@/lib/digilocker";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DIGILOCKER_CLIENT_ID) {
      return NextResponse.json(
        { success: false, error: "DigiLocker not configured" },
        { status: 500 }
      );
    }

    // Generate CSRF state token
    const state = crypto.randomBytes(16).toString("hex");

    // Generate PKCE pair (S256)
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const authUrl = getAuthorizationUrl(state, codeChallenge);

    const response = NextResponse.json({ success: true, url: authUrl });

    // Store state + code_verifier in cookies for validation on callback
    response.cookies.set("digilocker_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    response.cookies.set("digilocker_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("DigiLocker authorize error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initiate DigiLocker authentication" },
      { status: 500 }
    );
  }
}
