import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  fetchIssuedDocuments,
  extractDonorData,
  validateSignedState,
  deriveCodeVerifierFromState,
} from "@/lib/digilocker";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle DigiLocker errors
    if (error) {
      const origin = request.nextUrl.origin;
      return NextResponse.redirect(
        `${origin}/donate?digilocker_error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { success: false, error: "Missing code or state parameter" },
        { status: 400 }
      );
    }

    // Validate CSRF state
    const storedState = request.cookies.get("digilocker_state")?.value;
    const isCookieStateValid = !!storedState && storedState === state;
    const isSignedStateValid = validateSignedState(state);

    if (!isCookieStateValid && !isSignedStateValid) {
      return NextResponse.json(
        { success: false, error: "Invalid state parameter" },
        { status: 403 }
      );
    }

    // Retrieve PKCE code_verifier from cookie, fallback to deterministic derivation from signed state
    let codeVerifier = request.cookies.get(
      "digilocker_code_verifier"
    )?.value;
    if (!codeVerifier && isSignedStateValid) {
      codeVerifier = deriveCodeVerifierFromState(state);
    }

    if (!codeVerifier) {
      return NextResponse.json(
        { success: false, error: "Missing PKCE code verifier" },
        { status: 400 }
      );
    }

    // Exchange code for access token (with PKCE code_verifier)
    const tokenData = await exchangeCodeForToken(code, codeVerifier);
    const accessToken = tokenData.access_token;

    // Fetch issued documents (contains Aadhaar data)
    const issuedDocs = await fetchIssuedDocuments(accessToken);

    // Extract donor data from DigiLocker response
    let donorData = {
      fullName: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      aadhaarMasked: "",
      pan: "",
      digilockerId: "",
      panDocUrl: "",
      aadhaarDocUrl: "",
    };

    if (issuedDocs) {
      const aadhaarData = issuedDocs.aadhaar || issuedDocs;
      const extracted = extractDonorData(aadhaarData);
      donorData = { ...donorData, ...extracted };

      // Check for PAN in issued documents
      if (issuedDocs.items) {
        const panDoc = issuedDocs.items.find(
          (doc: { type?: string; doctype?: string }) =>
            doc.type === "PANCR" || doc.doctype === "PANCR"
        );
        if (panDoc) {
          donorData.pan = panDoc.number || panDoc.id || "";
          donorData.panDocUrl = panDoc.uri || "";
        }
      }

      donorData.digilockerId = issuedDocs.digilockerId || "";
    }

    // Encode the data and redirect back to donation page
    const encodedData = Buffer.from(JSON.stringify(donorData)).toString(
      "base64url"
    );

    const origin = request.nextUrl.origin;
    const redirectUrl = `${origin}/donate?digilocker_data=${encodedData}`;

    const response = NextResponse.redirect(redirectUrl);

    // Clear PKCE and state cookies
    response.cookies.delete("digilocker_state");
    response.cookies.delete("digilocker_code_verifier");

    // Store DigiLocker access token for potential document fetching
    response.cookies.set("digilocker_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("DigiLocker callback error:", error);
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(
      `${origin}/donate?digilocker_error=callback_failed`
    );
  }
}
