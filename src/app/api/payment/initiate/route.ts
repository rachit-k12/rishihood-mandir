import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
    } = body;

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

    // Easebuzz hash: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
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
      surl: `${origin}/donation/success`,
      furl: `${origin}/donation/failed`,
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
