import { NextRequest, NextResponse } from "next/server";
import { getDonationByTxnId } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ txnid: string }> }
) {
  try {
    const { txnid } = await params;

    if (!txnid) {
      return NextResponse.json(
        { success: false, error: "Transaction ID required" },
        { status: 400 }
      );
    }

    const donation = await getDonationByTxnId(txnid);

    if (!donation) {
      return NextResponse.json(
        { success: false, error: "Donation not found" },
        { status: 404 }
      );
    }

    // Return sanitized donation data (no sensitive fields)
    return NextResponse.json({
      success: true,
      data: {
        txnid: donation.txnid,
        amount: Number(donation.amount),
        status: donation.status,
        paymentMode: donation.paymentMode,
        bankRefNum: donation.bankRefNum,
        anonymous: donation.anonymous,
        createdAt: donation.createdAt,
        donor: {
          fullName: donation.anonymous ? "Anonymous" : donation.donor.fullName,
          email: donation.donor.email,
          pan: donation.donor.pan
            ? `${donation.donor.pan.substring(0, 2)}****${donation.donor.pan.substring(8)}`
            : null,
          aadhaar: donation.donor.aadhaarMasked,
          digilockerVerified: donation.donor.digilockerVerified,
        },
      },
    });
  } catch (error) {
    console.error("Donation fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
