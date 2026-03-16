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

export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

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

// --- OAuth2 Authorization Code Flow with OpenID Connect ---

/**
 * Build the DigiLocker OAuth2 authorization URL with PKCE and OpenID Connect.
 * scope=openid ensures the token response includes an id_token JWT
 * with user data (name, email, phone, PAN, masked Aadhaar).
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

  // Only include scope if configured — requires openid to be enabled
  // in the DigiLocker partner portal for this application
  const scope = process.env.DIGILOCKER_SCOPE;
  if (scope) {
    params.set("scope", scope);
  }
  return `${BASE_URL}/authorize?${params.toString()}`;
}

// Token response type (includes optional id_token from OpenID Connect)
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
}

/**
 * Exchange the authorization code for an access token.
 * With scope=openid, the response includes an id_token JWT.
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
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

// --- ID Token Decoding ---

export interface IdTokenClaims {
  given_name?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  phone_number?: string;
  birthdate?: string;
  dob?: string;
  gender?: string;
  pan_number?: string;
  masked_aadhaar?: string;
  user_sso_id?: string;
  digilockerid?: string;
  sub?: string;
}

/**
 * Decode the id_token JWT payload (no signature verification needed since
 * it came directly from DigiLocker over HTTPS in the token response).
 */
export function decodeIdToken(idToken: string): IdTokenClaims | null {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    console.error("Failed to decode DigiLocker id_token");
    return null;
  }
}

// --- User Profile ---

export interface UserProfile {
  digilockerid?: string;
  name?: string;
  dob?: string;
  gender?: string;
  eaadhaar?: string;
  reference_key?: string;
}

/**
 * Fetch user profile from DigiLocker /user endpoint.
 */
export async function fetchUserProfile(
  accessToken: string
): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${BASE_URL}/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error("DigiLocker /user failed:", await response.text());
      return null;
    }

    return response.json();
  } catch (err) {
    console.error("DigiLocker /user error:", err);
    return null;
  }
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

/**
 * Fetch PAN and Aadhaar document buffers from DigiLocker.
 * Returns base64-encoded content and mime type for each document found.
 */
export async function fetchDocumentBuffers(
  accessToken: string,
  panDocUri: string,
  aadhaarDocUri: string
): Promise<{
  pan: { base64: string; mimeType: string } | null;
  aadhaar: { base64: string; mimeType: string } | null;
}> {
  const result: {
    pan: { base64: string; mimeType: string } | null;
    aadhaar: { base64: string; mimeType: string } | null;
  } = { pan: null, aadhaar: null };

  if (panDocUri) {
    try {
      const { buffer, contentType } = await fetchDocument(
        accessToken,
        panDocUri
      );
      result.pan = {
        base64: buffer.toString("base64"),
        mimeType: contentType,
      };
    } catch (err) {
      console.error("Failed to fetch PAN document:", err);
    }
  }

  if (aadhaarDocUri) {
    try {
      const { buffer, contentType } = await fetchDocument(
        accessToken,
        aadhaarDocUri
      );
      result.aadhaar = {
        base64: buffer.toString("base64"),
        mimeType: contentType,
      };
    } catch (err) {
      console.error("Failed to fetch Aadhaar document:", err);
    }
  }

  return result;
}

// --- eAadhaar XML Parsing ---

/**
 * Fetch eAadhaar XML and parse for demographic data.
 * Tries the v3 endpoint first, falls back to fetching via document URI.
 */
export async function fetchEaadhaarData(
  accessToken: string,
  aadhaarUri?: string
): Promise<{
  name: string;
  dob: string;
  gender: string;
  address: string;
  maskedAadhaar: string;
} | null> {
  try {
    // Try fetching eAadhaar XML via the document URI
    let xmlText: string | null = null;

    if (aadhaarUri) {
      try {
        const { buffer, contentType } = await fetchDocument(
          accessToken,
          aadhaarUri
        );
        if (contentType.includes("xml")) {
          xmlText = buffer.toString("utf-8");
        }
      } catch (err) {
        console.error("eAadhaar document fetch failed:", err);
      }
    }

    // Also try the dedicated eAadhaar endpoint
    if (!xmlText) {
      try {
        // Try v3 endpoint for eAadhaar
        const baseOrigin = BASE_URL.replace(/\/oauth2\/\d+$/, "");
        const response = await fetch(`${baseOrigin}/oauth2/3/xml/eaadhaar`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          xmlText = await response.text();
        }
      } catch {
        // Silently fail — this endpoint may not be available
      }
    }

    if (!xmlText) return null;

    return parseEaadhaarXml(xmlText);
  } catch (err) {
    console.error("eAadhaar data fetch error:", err);
    return null;
  }
}

/**
 * Parse eAadhaar XML to extract demographic data.
 * Handles both the KycRes format and the PrintLetterBitmapBytes format.
 */
function parseEaadhaarXml(xml: string): {
  name: string;
  dob: string;
  gender: string;
  address: string;
  maskedAadhaar: string;
} | null {
  try {
    // Try KycRes format: <Poi name="..." dob="..." gender="..." />
    const poiMatch = xml.match(/<Poi\s+([^>]+)\/?>/i);
    const poaMatch = xml.match(/<Poa\s+([^>]+)\/?>/i);
    const uidMatch = xml.match(/uid="([^"]+)"/i);

    if (poiMatch) {
      const poiAttrs = poiMatch[1];
      const name = extractAttr(poiAttrs, "name") || "";
      const dob = extractAttr(poiAttrs, "dob") || "";
      const gender = extractAttr(poiAttrs, "gender") || "";

      let address = "";
      if (poaMatch) {
        const poaAttrs = poaMatch[1];
        const addrParts = [
          extractAttr(poaAttrs, "co"),
          extractAttr(poaAttrs, "house"),
          extractAttr(poaAttrs, "street"),
          extractAttr(poaAttrs, "lm"),
          extractAttr(poaAttrs, "loc"),
          extractAttr(poaAttrs, "vtc"),
          extractAttr(poaAttrs, "subdist"),
          extractAttr(poaAttrs, "dist"),
          extractAttr(poaAttrs, "state"),
          extractAttr(poaAttrs, "pc"),
        ].filter(Boolean);
        address = addrParts.join(", ");
      }

      const maskedAadhaar = uidMatch?.[1]?.replace(/\s+/g, "") || "";

      return { name, dob, gender, address, maskedAadhaar };
    }

    // Try PrintLetterBitmapBytes format
    const nameMatch = xml.match(/<name>([^<]+)<\/name>/i);
    const dobMatch = xml.match(/<dob>([^<]+)<\/dob>/i);
    const genderMatch = xml.match(/<gender>([^<]+)<\/gender>/i);
    const uidAttrMatch = xml.match(/uid="([^"]+)"/i);

    if (nameMatch) {
      return {
        name: nameMatch[1] || "",
        dob: dobMatch?.[1] || "",
        gender: genderMatch?.[1] || "",
        address: "",
        maskedAadhaar: uidAttrMatch?.[1]?.replace(/\s+/g, "") || "",
      };
    }

    return null;
  } catch {
    return null;
  }
}

function extractAttr(attrString: string, name: string): string {
  const match = attrString.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return match?.[1] || "";
}

// --- Document Number Extraction from URIs ---

interface IssuedDocument {
  name?: string;
  type?: string;
  doctype?: string;
  uri?: string;
  issuerid?: string;
  issuer?: string;
  mime?: string | string[];
  date?: string;
  description?: string;
  number?: string;
  id?: string;
}

/**
 * Extract PAN and Aadhaar numbers from the issued documents list.
 * Document URIs follow the format: {issuerid}-{doctype}-{identifier}
 * The identifier is often the actual document number.
 */
export function extractFromIssuedDocs(issuedDocs: {
  items?: IssuedDocument[];
}): {
  pan: string;
  panDocUrl: string;
  aadhaarNumber: string;
  aadhaarDocUrl: string;
  digilockerId: string;
} {
  const result = {
    pan: "",
    panDocUrl: "",
    aadhaarNumber: "",
    aadhaarDocUrl: "",
    digilockerId: (issuedDocs as { digilockerid?: string }).digilockerid || "",
  };

  const items = issuedDocs?.items || [];

  for (const doc of items) {
    const docType = doc.type || doc.doctype || "";
    const uri = doc.uri || "";

    if (docType === "PANCR" || docType === "PCARD") {
      // Extract PAN number from URI: in.gov.cbdt-PANCR-ABCDE1234F
      result.pan = doc.number || doc.id || extractNumberFromUri(uri) || "";
      result.panDocUrl = uri;
    }

    if (docType === "ADHAR" || docType === "AADHAAR") {
      // Extract Aadhaar from URI: in.gov.uidai-ADHAR-XXXXXXXXXXXX
      result.aadhaarNumber =
        doc.number || doc.id || extractNumberFromUri(uri) || "";
      result.aadhaarDocUrl = uri;
    }
  }

  return result;
}

/**
 * Extract the document number from a DigiLocker document URI.
 * URI format: {issuerid}-{doctype}-{number}
 * e.g., in.gov.uidai-ADHAR-123456789012
 */
function extractNumberFromUri(uri: string): string {
  if (!uri) return "";
  // Split by '-' and take everything after the doctype
  const parts = uri.split("-");
  if (parts.length >= 3) {
    // The number is everything after the second '-'
    return parts.slice(2).join("-");
  }
  return "";
}

// --- Aggregated Data Extraction ---

export interface DigiLockerDonorData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  aadhaarMasked: string;
  pan: string;
  digilockerId: string;
  panDocUrl: string;
  aadhaarDocUrl: string;
}

/**
 * Aggregate donor data from all available DigiLocker sources.
 * Priority: id_token > user profile > eAadhaar XML > issued doc URIs
 */
export async function aggregateDonorData(
  tokenResponse: TokenResponse,
  accessToken: string
): Promise<DigiLockerDonorData> {
  const data: DigiLockerDonorData = {
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    aadhaarMasked: "",
    pan: "",
    digilockerId: "",
    panDocUrl: "",
    aadhaarDocUrl: "",
  };

  // 1. Decode id_token (best source — has name, email, phone, PAN, Aadhaar)
  if (tokenResponse.id_token) {
    const claims = decodeIdToken(tokenResponse.id_token);
    if (claims) {
      console.log("DigiLocker id_token claims keys:", Object.keys(claims));
      data.fullName = claims.given_name || claims.name || "";
      data.email = claims.email || "";
      data.phone = claims.phone_number || "";
      data.dateOfBirth = claims.birthdate || claims.dob || "";
      data.pan = claims.pan_number || "";
      data.aadhaarMasked = claims.masked_aadhaar || "";
      data.digilockerId =
        claims.digilockerid ||
        claims.preferred_username ||
        claims.sub ||
        "";
    }
  }

  // 2. Fetch user profile (fills in name, DOB, gender if not in id_token)
  const userProfile = await fetchUserProfile(accessToken);
  if (userProfile) {
    console.log("DigiLocker /user response keys:", Object.keys(userProfile));
    if (!data.fullName) data.fullName = userProfile.name || "";
    if (!data.dateOfBirth) data.dateOfBirth = userProfile.dob || "";
    if (!data.gender) data.gender = userProfile.gender || "";
    if (!data.digilockerId)
      data.digilockerId = userProfile.digilockerid || "";
  }

  // 3. Fetch issued documents (for PAN/Aadhaar numbers from URIs)
  let issuedDocs: { items?: IssuedDocument[] } | null = null;
  try {
    issuedDocs = await fetchIssuedDocuments(accessToken);
    console.log(
      "DigiLocker issued docs:",
      JSON.stringify(issuedDocs, null, 2).substring(0, 500)
    );
  } catch (err) {
    console.error("Failed to fetch issued docs:", err);
  }

  if (issuedDocs) {
    const docData = extractFromIssuedDocs(issuedDocs);
    if (!data.pan && docData.pan) data.pan = docData.pan;
    if (!data.aadhaarMasked && docData.aadhaarNumber)
      data.aadhaarMasked = docData.aadhaarNumber;
    data.panDocUrl = docData.panDocUrl;
    data.aadhaarDocUrl = docData.aadhaarDocUrl;
    if (!data.digilockerId && docData.digilockerId)
      data.digilockerId = docData.digilockerId;

    // 4. Try to fetch eAadhaar XML for address data
    if (!data.address || !data.fullName) {
      const aadhaarData = await fetchEaadhaarData(
        accessToken,
        docData.aadhaarDocUrl
      );
      if (aadhaarData) {
        if (!data.fullName) data.fullName = aadhaarData.name;
        if (!data.dateOfBirth) data.dateOfBirth = aadhaarData.dob;
        if (!data.gender) data.gender = aadhaarData.gender;
        if (!data.address) data.address = aadhaarData.address;
        if (!data.aadhaarMasked)
          data.aadhaarMasked = aadhaarData.maskedAadhaar;
      }
    }
  }

  // Mask Aadhaar for display (show last 4 digits only)
  if (data.aadhaarMasked && data.aadhaarMasked.length >= 8) {
    const clean = data.aadhaarMasked.replace(/[\s-]/g, "");
    if (/^\d{12}$/.test(clean)) {
      data.aadhaarMasked = `XXXX XXXX ${clean.slice(-4)}`;
    }
  }

  return data;
}

// Legacy exports for backwards compatibility
export { extractNumberFromUri };
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
