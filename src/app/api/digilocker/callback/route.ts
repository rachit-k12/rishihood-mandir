import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  aggregateDonorData,
  fetchDocumentBuffers,
  validateSignedState,
  deriveCodeVerifierFromState,
} from "@/lib/digilocker";
import { upsertDonor, storeDocumentForDonor } from "@/lib/db";

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
    // With scope=openid, this also returns an id_token JWT
    const tokenData = await exchangeCodeForToken(code, codeVerifier);
    const accessToken = tokenData.access_token;

    console.log(
      "DigiLocker token response keys:",
      Object.keys(tokenData),
      "has id_token:",
      !!tokenData.id_token
    );

    // Aggregate donor data from all sources:
    // 1. id_token JWT (name, email, phone, PAN, masked Aadhaar)
    // 2. /user endpoint (name, DOB, gender)
    // 3. /files/issued (document URIs → PAN/Aadhaar numbers)
    // 4. eAadhaar XML document (address, full demographic data)
    const donorData = await aggregateDonorData(tokenData, accessToken);

    console.log("DigiLocker aggregated donor data:", {
      hasName: !!donorData.fullName,
      hasEmail: !!donorData.email,
      hasPhone: !!donorData.phone,
      hasPan: !!donorData.pan,
      hasAadhaar: !!donorData.aadhaarMasked,
      hasAddress: !!donorData.address,
    });

    // Fetch and store actual document PDFs if we have URIs and donor info
    if (
      donorData.email &&
      donorData.phone &&
      (donorData.panDocUrl || donorData.aadhaarDocUrl)
    ) {
      try {
        const docBuffers = await fetchDocumentBuffers(
          accessToken,
          donorData.panDocUrl,
          donorData.aadhaarDocUrl
        );

        // Upsert donor to get an ID for document storage
        const donor = await upsertDonor({
          fullName: donorData.fullName || "Unknown",
          email: donorData.email,
          phone: donorData.phone,
          address: donorData.address || "",
          pan: donorData.pan,
          aadhaarMasked: donorData.aadhaarMasked,
          dateOfBirth: donorData.dateOfBirth,
          gender: donorData.gender,
          digilockerVerified: true,
          digilockerId: donorData.digilockerId,
        });

        if (docBuffers.pan) {
          const docUrl = `/api/documents/${donor.id}/pan`;
          await storeDocumentForDonor(
            donor.id,
            "pan",
            docBuffers.pan.base64,
            docBuffers.pan.mimeType,
            docUrl
          );
          donorData.panDocUrl = docUrl;
        }

        if (docBuffers.aadhaar) {
          const docUrl = `/api/documents/${donor.id}/aadhaar`;
          await storeDocumentForDonor(
            donor.id,
            "aadhaar",
            docBuffers.aadhaar.base64,
            docBuffers.aadhaar.mimeType,
            docUrl
          );
          donorData.aadhaarDocUrl = docUrl;
        }

        console.log("DigiLocker documents stored:", {
          pan: !!docBuffers.pan,
          aadhaar: !!docBuffers.aadhaar,
        });
      } catch (err) {
        console.error("Non-blocking: failed to fetch/store documents:", err);
      }
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
      maxAge: 3600,
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
