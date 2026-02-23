import crypto from "crypto";

const BASE_URL =
  process.env.DIGILOCKER_BASE_URL ||
  "https://api.digitallocker.gov.in/public/oauth2/1";

const CLIENT_ID = () => process.env.DIGILOCKER_CLIENT_ID!;
const CLIENT_SECRET = () => process.env.DIGILOCKER_CLIENT_SECRET!;
const REDIRECT_URI = () => process.env.DIGILOCKER_REDIRECT_URI!;

const STATE_MAX_AGE_SECONDS = 600;

function getStateSecret(): string {
  const secret = process.env.DIGILOCKER_STATE_SECRET || CLIENT_SECRET();
  if (!secret) {
    throw new Error(
      "DigiLocker state secret is not configured. Set DIGILOCKER_STATE_SECRET or DIGILOCKER_CLIENT_SECRET"
    );
  }
  return secret;
}

// --- PKCE (Proof Key for Code Exchange) with S256 ---

/**
 * Generate a cryptographically random code_verifier for PKCE.
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Generate code_challenge from code_verifier using SHA-256 (S256 method).
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function generateSignedState(): string {
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("base64url");
  const payload = `${ts}.${nonce}`;
  const signature = crypto
    .createHmac("sha256", getStateSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function deriveCodeVerifierFromState(state: string): string {
  const [ts, nonce] = state.split(".");
  return crypto
    .createHmac("sha256", getStateSecret())
    .update(`pkce.${ts}.${nonce}`)
    .digest("base64url");
}

export function validateSignedState(state: string): boolean {
  const parts = state.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [ts, nonce, signature] = parts;
  const timestamp = Number(ts);

  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (timestamp > now + 60 || now - timestamp > STATE_MAX_AGE_SECONDS) {
    return false;
  }

  const payload = `${ts}.${nonce}`;
  const expectedSignature = crypto
    .createHmac("sha256", getStateSecret())
    .update(payload)
    .digest("base64url");

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(provided, expected);
}

// --- OAuth2 Authorization Code Flow ---

/**
 * Build the DigiLocker OAuth2 authorization URL with PKCE.
 * @param state - CSRF token for validation on callback
 * @param codeChallenge - SHA-256 hash of the code_verifier
 */
export function getAuthorizationUrl(
  state: string,
  codeChallenge: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID(),
    redirect_uri: REDIRECT_URI(),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${BASE_URL}/authorize?${params.toString()}`;
}

/**
 * Exchange the authorization code for an access token.
 * Includes code_verifier for PKCE validation.
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<{ access_token: string; token_type: string; expires_in: number }> {
  const response = await fetch(`${BASE_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: CLIENT_ID(),
      client_secret: CLIENT_SECRET(),
      redirect_uri: REDIRECT_URI(),
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DigiLocker token exchange failed: ${text}`);
  }

  return response.json();
}

// --- Document Fetching ---

/**
 * Fetch the list of documents issued to the user in their DigiLocker.
 */
export async function fetchIssuedDocuments(accessToken: string) {
  const response = await fetch(`${BASE_URL}/files/issued`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DigiLocker issued docs fetch failed: ${text}`);
  }

  return response.json();
}

/**
 * Fetch a specific document by its URI.
 * Returns the document content (PDF/XML) as a Buffer along with content-type.
 */
export async function fetchDocument(
  accessToken: string,
  docUri: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(
    `${BASE_URL}/file/${encodeURIComponent(docUri)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DigiLocker document fetch failed: ${text}`);
  }

  const contentType =
    response.headers.get("content-type") || "application/pdf";
  const arrayBuffer = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

// --- Data Extraction ---

/**
 * Extracts relevant donor data from DigiLocker Aadhaar response.
 * Normalizes the data into our application format.
 */
export function extractDonorData(aadhaarData: {
  name?: string;
  dob?: string;
  gender?: string;
  address?: {
    house?: string;
    street?: string;
    landmark?: string;
    locality?: string;
    vtc?: string;
    district?: string;
    state?: string;
    pincode?: string;
    careOf?: string;
  };
  maskedNumber?: string;
  photo?: string;
}) {
  const addr = aadhaarData.address || {};
  const addressParts = [
    addr.house,
    addr.street,
    addr.landmark,
    addr.locality,
    addr.vtc,
    addr.district,
    addr.state,
    addr.pincode,
  ].filter(Boolean);

  return {
    fullName: aadhaarData.name || "",
    dateOfBirth: aadhaarData.dob || "",
    gender: aadhaarData.gender || "",
    address: addressParts.join(", "),
    aadhaarMasked: aadhaarData.maskedNumber || "",
  };
}
