import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updateDonationStatus, getDonationByTxnId } from "@/lib/db";
import { generateReceiptPDF } from "@/lib/receipt";

type CallbackPayload = {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  status: string;
  hash: string;
  key: string;
  udf1: string;
  udf2: string;
  udf3: string;
  udf4: string;
  udf5: string;
  udf6: string;
  udf7: string;
  udf8: string;
  udf9: string;
  udf10: string;
  additionalCharges: string;
  mode: string;
  bankRefNum: string;
};

function normalizeStatus(status: string): "success" | "cancelled" | "failure" {
  const normalized = (status || "").toLowerCase();

  if (normalized === "success") return "success";
  if (
    normalized === "usercancelled" ||
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "dropped"
  ) {
    return "cancelled";
  }

  return "failure";
}

function parsePayloadFromSearchParams(searchParams: URLSearchParams): CallbackPayload {
  return {
    txnid: searchParams.get("txnid") || "",
    amount: searchParams.get("amount") || "",
    productinfo: searchParams.get("productinfo") || "",
    firstname: searchParams.get("firstname") || "",
    email: searchParams.get("email") || "",
    status: searchParams.get("status") || "",
    hash: searchParams.get("hash") || "",
    key: searchParams.get("key") || "",
    udf1: searchParams.get("udf1") || "",
    udf2: searchParams.get("udf2") || "",
    udf3: searchParams.get("udf3") || "",
    udf4: searchParams.get("udf4") || "",
    udf5: searchParams.get("udf5") || "",
    udf6: searchParams.get("udf6") || "",
    udf7: searchParams.get("udf7") || "",
    udf8: searchParams.get("udf8") || "",
    udf9: searchParams.get("udf9") || "",
    udf10: searchParams.get("udf10") || "",
    additionalCharges: searchParams.get("additionalCharges") || "",
    mode: searchParams.get("mode") || "",
    bankRefNum: searchParams.get("bank_ref_num") || "",
  };
}

function verifyHash(payload: CallbackPayload): boolean {
  const salt = process.env.EASEBUZZ_SALT;
  if (!salt || !payload.hash) {
    return false;
  }

  // Reverse hash: SALT|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  // With additionalCharges: additionalCharges|SALT|status|...|key
  const baseHashString = `${salt}|${payload.status}|${payload.udf10}|${payload.udf9}|${payload.udf8}|${payload.udf7}|${payload.udf6}|${payload.udf5}|${payload.udf4}|${payload.udf3}|${payload.udf2}|${payload.udf1}|${payload.email}|${payload.firstname}|${payload.productinfo}|${payload.amount}|${payload.txnid}|${payload.key}`;
  const reverseHashString = payload.additionalCharges
    ? `${payload.additionalCharges}|${baseHashString}`
    : baseHashString;

  const calculatedHash = crypto
    .createHash("sha512")
    .update(reverseHashString)
    .digest("hex");

  if (calculatedHash !== payload.hash) {
    console.error("Hash mismatch for txnid:", payload.txnid);
    console.error("Reverse hash input:", reverseHashString);
    console.error("Calculated:", calculatedHash);
    console.error("Received:", payload.hash);
  }

  return calculatedHash === payload.hash;
}

async function handleCallback(
  request: NextRequest,
  payload: CallbackPayload
) {
  const origin = request.nextUrl.origin;

  if (!payload.txnid) {
    return NextResponse.redirect(`${origin}/donation/failed?reason=missing_txnid`, 303);
  }

  if (!verifyHash(payload)) {
    console.error("Hash mismatch for txnid:", payload.txnid);
    return NextResponse.redirect(
      `${origin}/donation/failed?txnid=${payload.txnid}&reason=hash_mismatch`,
      303
    );
  }

  const normalizedStatus = normalizeStatus(payload.status);

  let receiptDataUri: string | undefined;
  if (normalizedStatus === "success") {
    const donation = await getDonationByTxnId(payload.txnid);

    if (donation) {
      receiptDataUri = generateReceiptPDF({
        date: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        txnid: payload.txnid,
        amount: parseFloat(payload.amount),
        fullName: donation.donor.fullName,
        address: donation.donor.address,
        pan: donation.donor.pan || undefined,
        aadhaar: donation.donor.aadhaarMasked || undefined,
        paymentMode: payload.mode,
        bankRefNum: payload.bankRefNum,
        digilockerVerified: donation.donor.digilockerVerified,
        hasPanDoc: !!donation.donor.panDocUrl,
        hasAadhaarDoc: !!donation.donor.aadhaarDocUrl,
      });
    }

    await updateDonationStatus(payload.txnid, {
      status: "success",
      paymentMode: payload.mode,
      bankRefNum: payload.bankRefNum,
      receiptUrl: receiptDataUri ? "generated" : undefined,
    });

    return NextResponse.redirect(
      `${origin}/donation/success?txnid=${payload.txnid}`,
      303
    );
  }

  await updateDonationStatus(payload.txnid, {
    status: normalizedStatus,
    paymentMode: payload.mode || undefined,
    bankRefNum: payload.bankRefNum || undefined,
  });

  return NextResponse.redirect(
    `${origin}/donation/failed?txnid=${payload.txnid}&status=${normalizedStatus}`,
    303
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const payload: CallbackPayload = {
      txnid: (formData.get("txnid") as string) || "",
      amount: (formData.get("amount") as string) || "",
      productinfo: (formData.get("productinfo") as string) || "",
      firstname: (formData.get("firstname") as string) || "",
      email: (formData.get("email") as string) || "",
      status: (formData.get("status") as string) || "",
      hash: (formData.get("hash") as string) || "",
      key: (formData.get("key") as string) || "",
      udf1: (formData.get("udf1") as string) || "",
      udf2: (formData.get("udf2") as string) || "",
      udf3: (formData.get("udf3") as string) || "",
      udf4: (formData.get("udf4") as string) || "",
      udf5: (formData.get("udf5") as string) || "",
      udf6: (formData.get("udf6") as string) || "",
      udf7: (formData.get("udf7") as string) || "",
      udf8: (formData.get("udf8") as string) || "",
      udf9: (formData.get("udf9") as string) || "",
      udf10: (formData.get("udf10") as string) || "",
      additionalCharges: (formData.get("additionalCharges") as string) || "",
      mode: (formData.get("mode") as string) || "",
      bankRefNum: (formData.get("bank_ref_num") as string) || "",
    };

    return handleCallback(request, payload);
  } catch (error) {
    console.error("Payment callback POST error:", error);
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(`${origin}/donation/failed?reason=callback_post_failed`, 303);
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = parsePayloadFromSearchParams(request.nextUrl.searchParams);
    return handleCallback(request, payload);
  } catch (error) {
    console.error("Payment callback GET error:", error);
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(`${origin}/donation/failed?reason=callback_get_failed`, 303);
  }
}
