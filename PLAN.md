# Implementation Plan — DigiLocker + Supabase + PDF Receipt

## Summary
Integrate DigiLocker for identity verification & document fetch, Supabase (PostgreSQL) for persistence, proper Easebuzz webhook handling, and PDF receipt generation.

**Skipped:** CRM dashboard, email confirmations (for now).

---

## New Dependencies to Install

```
npm install @supabase/supabase-js jspdf
```

- `@supabase/supabase-js` — Supabase client for DB operations
- `jspdf` — PDF generation for donation receipts (runs server-side & client-side)

---

## Environment Variables Needed (`.env.local`)

```env
# Existing
EASEBUZZ_KEY=...
EASEBUZZ_SALT=...
EASEBUZZ_ENV=test

# New — DigiLocker Direct Partner API
DIGILOCKER_CLIENT_ID=...
DIGILOCKER_CLIENT_SECRET=...
DIGILOCKER_HMAC_KEY=...
DIGILOCKER_REDIRECT_URI=http://localhost:3000/api/digilocker/callback
DIGILOCKER_BASE_URL=https://api.digitallocker.gov.in/public/oauth2/1

# New — Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Step 1: Supabase Database Setup

### 1a. Create file: `src/lib/supabase.ts`
Supabase client initialization (two clients: public for client-side, service-role for server-side API routes).

### 1b. Database tables (run in Supabase SQL editor)

**Table: `donors`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | auto-generated |
| full_name | text | from DigiLocker or manual |
| email | text | |
| phone | text | |
| address | text | |
| pan | text (nullable) | |
| aadhaar_masked | text (nullable) | store masked only: XXXX-XXXX-1234 |
| date_of_birth | text (nullable) | from DigiLocker |
| gender | text (nullable) | from DigiLocker |
| digilocker_verified | boolean | default false |
| digilocker_id | text (nullable) | DigiLocker user ID |
| pan_doc_url | text (nullable) | S3 URL from DigiLocker |
| aadhaar_doc_url | text (nullable) | S3 URL from DigiLocker |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto |

**Table: `donations`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | auto-generated |
| donor_id | uuid (FK → donors) | |
| txnid | text (unique) | Easebuzz transaction ID |
| amount | decimal | |
| status | text | pending / success / failure / userCancelled |
| payment_mode | text (nullable) | CC, DC, NB, UPI, etc. |
| bank_ref_num | text (nullable) | bank reference |
| easebuzz_hash | text (nullable) | for verification |
| anonymous | boolean | default false |
| receipt_url | text (nullable) | generated PDF URL |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto |

### 1c. Create file: `src/lib/db.ts`
Helper functions:
- `createDonor(data)` — upsert donor by email+phone
- `createDonation(donorId, txnData)` — insert donation record with status "pending"
- `updateDonationStatus(txnid, status, paymentDetails)` — called by webhook
- `getDonationByTxnId(txnid)` — for success/failed pages

---

## Step 2: DigiLocker OAuth2 Integration

### 2a. Create file: `src/app/api/digilocker/authorize/route.ts`
- Generates the DigiLocker authorization URL
- Includes `client_id`, `redirect_uri`, `state` (CSRF token stored in cookie)
- Returns the URL for frontend to redirect the user

### 2b. Create file: `src/app/api/digilocker/callback/route.ts`
- Receives the `?code=...&state=...` from DigiLocker redirect
- Validates CSRF state token
- Exchanges authorization code for access token via POST to `/token`
- Fetches user's Aadhaar data (name, address, DOB, masked Aadhaar, gender)
- Fetches issued documents list (PAN, ITR if available)
- Fetches PAN document if available
- Stores fetched data in a temporary session (cookie or URL params)
- Redirects user back to the donation page with data pre-filled

### 2c. Create file: `src/lib/digilocker.ts`
Helper functions:
- `getAuthorizationUrl(state)` — builds the OAuth URL
- `exchangeCodeForToken(code)` — POST to DigiLocker /token
- `fetchAadhaarData(accessToken)` — GET issued Aadhaar eKYC data
- `fetchIssuedDocuments(accessToken)` — GET list of documents
- `fetchDocument(accessToken, docUri)` — GET a specific document (PAN PDF, etc.)
- `generateHmac(data)` — HMAC-SHA256 signing if needed for account verification

### 2d. Session handling for DigiLocker data
- After DigiLocker callback, store the fetched data in an encrypted cookie or redirect with data in query params (encrypted)
- The DonationSection component reads this data and pre-fills the form
- Fields filled via DigiLocker are marked as read-only with a "Verified" badge

---

## Step 3: Update Donation Form (`DonationSection.tsx`)

### Changes:
1. **Add "Verify with DigiLocker" button** at the top of the form
   - Primary CTA with DigiLocker logo
   - When clicked, calls `/api/digilocker/authorize`, then redirects user
   - Below it, a subtle "or fill manually" text

2. **Auto-fill logic**
   - On page load, check for DigiLocker session data (from URL params or cookie)
   - If present, populate: fullName, address, pan, aadhaar
   - Mark these fields as `readOnly` with a green "Verified" badge
   - User still needs to enter: email, phone (may get from DigiLocker), amount

3. **New state: `digilockerVerified: boolean`**
   - Tracks whether the data came from DigiLocker
   - Sent to the backend so the donation record reflects verified identity

4. **Store document URLs in form state**
   - `panDocUrl`, `aadhaarDocUrl` — passed to backend when creating donation

---

## Step 4: Update Payment Initiation (`/api/payment/initiate/route.ts`)

### Changes:
1. **Before calling Easebuzz**, create/upsert the donor in Supabase
2. **Create a donation record** in Supabase with status "pending"
3. **Change `surl` and `furl`** to point to a **webhook handler** instead of directly to success/failed pages:
   - `surl` → `/api/payment/callback` (handles both success redirect + DB update)
   - `furl` → `/api/payment/callback` (same endpoint, different status)
4. **Pass additional fields**: `digilockerVerified`, `panDocUrl`, `aadhaarDocUrl`, `donorId`

---

## Step 5: Payment Callback Handler (replaces direct redirect)

### Create file: `src/app/api/payment/callback/route.ts`
- Receives POST from Easebuzz with form-encoded data
- **Verifies response hash** (reverse-order SHA-512) — critical for security
- Extracts: `txnid`, `status`, `amount`, `mode`, `bank_ref_num`, `hash`
- **Updates donation record** in Supabase: status, payment_mode, bank_ref_num
- **If success**: generates PDF receipt, stores URL in donation record
- **Redirects user** to `/donation/success?txnid=XXX` or `/donation/failed?txnid=XXX`

---

## Step 6: PDF Receipt Generation

### Create file: `src/lib/receipt.ts`
- Uses `jspdf` to generate the RF Donation Application form as a PDF
- Fills in:
  - Date (from donation record)
  - Payment reference / Transaction ID
  - Amount (in figures and words)
  - PAN Number
  - Aadhaar Number
  - Donor Name, Address
  - Enclosures checklist: PAN copy, Aadhaar copy (marked based on what's available)
- Returns PDF as a Buffer
- The PDF is uploaded to Supabase Storage and URL is saved in the donation record

### Create file: `src/lib/amount-to-words.ts`
- Converts a number like 11000 to "Eleven Thousand Rupees Only"
- Used in the PDF receipt

---

## Step 7: Update Success Page (`/donation/success/page.tsx`)

### Changes:
1. Read `txnid` from URL search params
2. Fetch donation details from Supabase via a new API route: `GET /api/donation/[txnid]`
3. Display:
   - Transaction ID
   - Amount paid
   - Payment method
   - Date
   - "Download Receipt" button (links to stored PDF URL)
4. Keep existing thank-you messaging and animations

---

## Step 8: Update Failed Page (`/donation/failed/page.tsx`)

### Changes:
1. Read `txnid` from URL search params (if available)
2. Display transaction ID and error info if available
3. "Try Again" still links to `/#donation`

---

## New Files Summary

```
src/
├── lib/
│   ├── supabase.ts          — Supabase client init
│   ├── db.ts                — Database helper functions
│   ├── digilocker.ts        — DigiLocker API helpers
│   ├── receipt.ts           — PDF receipt generation
│   └── amount-to-words.ts   — Number to words converter
├── app/
│   └── api/
│       ├── digilocker/
│       │   ├── authorize/route.ts   — Start DigiLocker OAuth
│       │   └── callback/route.ts    — Handle DigiLocker redirect
│       ├── payment/
│       │   ├── initiate/route.ts    — (UPDATE existing)
│       │   └── callback/route.ts    — Handle Easebuzz response
│       └── donation/
│           └── [txnid]/route.ts     — GET donation details
```

## Modified Files Summary

```
src/
├── components/sections/
│   └── DonationSection.tsx    — Add DigiLocker button, auto-fill, read-only fields
├── app/
│   ├── donation/
│   │   ├── success/page.tsx   — Show txn details, download receipt
│   │   └── failed/page.tsx    — Show txn ID if available
│   └── api/payment/
│       └── initiate/route.ts  — Add DB writes, update surl/furl
```

---

## Order of Implementation

1. Install dependencies (`@supabase/supabase-js`, `jspdf`)
2. `src/lib/supabase.ts` — Supabase clients
3. SQL migration (provide to user for Supabase dashboard)
4. `src/lib/db.ts` — Database helpers
5. `src/lib/digilocker.ts` — DigiLocker API helpers
6. `src/app/api/digilocker/authorize/route.ts`
7. `src/app/api/digilocker/callback/route.ts`
8. `src/lib/amount-to-words.ts`
9. `src/lib/receipt.ts` — PDF generation
10. `src/app/api/payment/callback/route.ts` — Easebuzz webhook
11. Update `src/app/api/payment/initiate/route.ts` — Add DB writes
12. `src/app/api/donation/[txnid]/route.ts` — GET donation
13. Update `src/components/sections/DonationSection.tsx` — DigiLocker button + auto-fill
14. Update `src/app/donation/success/page.tsx` — Show details + receipt download
15. Update `src/app/donation/failed/page.tsx` — Show txn ID
