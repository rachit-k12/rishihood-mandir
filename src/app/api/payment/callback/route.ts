import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updateDonationStatus, getDonationByTxnId } from "@/lib/db";
import { generateReceiptPDF } from "@/lib/receipt";

export async function POST(request: NextRequest) {
  try {
    // Easebuzz sends form-encoded POST data
    const formData = await request.formData();

    const txnid = formData.get("txnid") as string;
    const amount = formData.get("amount") as string;
    const productinfo = formData.get("productinfo") as string;
    const firstname = formData.get("firstname") as string;
    const email = formData.get("email") as string;
    const status = formData.get("status") as string;
    const hash = formData.get("hash") as string;
    const key = formData.get("key") as string;
    const udf1 = (formData.get("udf1") as string) || "";
    const udf2 = (formData.get("udf2") as string) || "";
    const udf3 = (formData.get("udf3") as string) || "";
    const udf4 = (formData.get("udf4") as string) || "";
    const udf5 = (formData.get("udf5") as string) || "";
    const mode = (formData.get("mode") as string) || "";
    const bankRefNum = (formData.get("bank_ref_num") as string) || "";

    const salt = process.env.EASEBUZZ_SALT!;

    // Verify response hash (reverse order from initiation)
    // SALT|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    const reverseHashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const calculatedHash = crypto
      .createHash("sha512")
      .update(reverseHashString)
      .digest("hex");

    if (calculatedHash !== hash) {
      console.error("Hash mismatch for txnid:", txnid);
      const origin = request.nextUrl.origin;
      return NextResponse.redirect(
        `${origin}/donation/failed?txnid=${txnid}&reason=hash_mismatch`
      );
    }

    // Update donation in database
    let receiptDataUri: string | undefined;

    if (status === "success") {
      // Fetch existing donation to get donor details for receipt
      const donation = await getDonationByTxnId(txnid);

      if (donation) {
        // Generate PDF receipt
        receiptDataUri = generateReceiptPDF({
          date: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          txnid,
          amount: parseFloat(amount),
          fullName: donation.donor.fullName,
          address: donation.donor.address,
          pan: donation.donor.pan || undefined,
          aadhaar: donation.donor.aadhaarMasked || undefined,
          paymentMode: mode,
          bankRefNum,
          digilockerVerified: donation.donor.digilockerVerified,
          hasPanDoc: !!donation.donor.panDocUrl,
          hasAadhaarDoc: !!donation.donor.aadhaarDocUrl,
        });
      }

      await updateDonationStatus(txnid, {
        status: "success",
        paymentMode: mode,
        bankRefNum,
        receiptUrl: receiptDataUri ? "generated" : undefined,
      });
    } else {
      await updateDonationStatus(txnid, {
        status: status === "userCancelled" ? "cancelled" : "failure",
        paymentMode: mode || undefined,
        bankRefNum: bankRefNum || undefined,
      });
    }

    // Redirect user to appropriate page
    const origin = request.nextUrl.origin;
    if (status === "success") {
      return NextResponse.redirect(
        `${origin}/donation/success?txnid=${txnid}`
      );
    } else {
      return NextResponse.redirect(
        `${origin}/donation/failed?txnid=${txnid}`
      );
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(`${origin}/donation/failed`);
  }
}
