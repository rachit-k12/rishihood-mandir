import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { upsertDonor, createDonation } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      firstname,
      email,
      phone,
      address,
      pan,
      aadhaar,
      anonymous,
      digilockerVerified,
      digilockerId,
      panDocUrl,
      aadhaarDocUrl,
      dateOfBirth,
      gender,
      _createDonorOnly,
    } = body;

    // If _createDonorOnly, just upsert the donor and return the ID
    if (_createDonorOnly) {
      const donor = await upsertDonor({
        fullName: firstname || "Donor",
        email,
        phone,
        address: address || "",
        pan: pan || undefined,
        aadhaarMasked: aadhaar || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        digilockerVerified: digilockerVerified || false,
        digilockerId: digilockerId || undefined,
        panDocUrl: panDocUrl || undefined,
        aadhaarDocUrl: aadhaarDocUrl || undefined,
      });
      return NextResponse.json({ success: true, donorId: donor.id });
    }

    const key = process.env.EASEBUZZ_KEY;
    const salt = process.env.EASEBUZZ_SALT;
    const env = process.env.EASEBUZZ_ENV || "test";

    if (!key || !salt) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Generate unique transaction ID
    const txnid = `RMD${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const productinfo = "Rishihood Mandir Donation";

    // --- Save donor and donation to database ---
    const donor = await upsertDonor({
      fullName: firstname,
      email,
      phone,
      address: address || "",
      pan: pan || undefined,
      aadhaarMasked: aadhaar || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined,
      digilockerVerified: digilockerVerified || false,
      digilockerId: digilockerId || undefined,
      panDocUrl: panDocUrl || undefined,
      aadhaarDocUrl: aadhaarDocUrl || undefined,
    });

    await createDonation({
      donorId: donor.id,
      txnid,
      amount: parseFloat(amount),
      anonymous: anonymous || false,
    });

    // --- Easebuzz hash generation ---
    // key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
    // udf1 = phone, udf2 = address, udf3 = pan, udf4 = aadhaar, udf5 = anonymous
    const hashString = `${key}|${txnid}|${parseFloat(amount).toFixed(1)}|${productinfo}|${firstname}|${email}|${phone || ""}|${address || ""}|${pan || ""}|${aadhaar || ""}|${anonymous ? "1" : "0"}||||||${salt}`;

    const hash = crypto
      .createHash("sha512")
      .update(hashString)
      .digest("hex");

    const origin = request.nextUrl.origin;

    const baseUrl =
      env === "production"
        ? "https://pay.easebuzz.in/payment/initiateLink"
        : "https://testpay.easebuzz.in/payment/initiateLink";

    // surl and furl now point to the callback handler
    const params = new URLSearchParams({
      key,
      txnid,
      amount: parseFloat(amount).toFixed(1),
      productinfo,
      firstname,
      email,
      phone: phone || "",
      udf1: phone || "",
      udf2: address || "",
      udf3: pan || "",
      udf4: aadhaar || "",
      udf5: anonymous ? "1" : "0",
      surl: `${origin}/api/payment/callback`,
      furl: `${origin}/api/payment/callback`,
      hash,
    });

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.status === 1) {
      return NextResponse.json({
        success: true,
        data: data.data,
        env,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: data.error_desc || "Payment initiation failed",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
