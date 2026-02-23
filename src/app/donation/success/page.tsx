"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/constants";

interface DonationData {
  txnid: string;
  amount: number;
  status: string;
  paymentMode: string;
  bankRefNum: string;
  createdAt: string;
  donor: {
    fullName: string;
    email: string;
    pan: string | null;
    aadhaar: string | null;
    digilockerVerified: boolean;
  };
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const txnid = searchParams.get("txnid");
  const [donation, setDonation] = useState<DonationData | null>(null);
  const [loading, setLoading] = useState(!!txnid);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const isDonationSuccess = donation?.status === "success";

  useEffect(() => {
    if (!txnid) return;

    fetch(`/api/donation/${txnid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDonation(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [txnid]);

  const handleDownloadReceipt = async () => {
    if (!donation) return;
    setReceiptLoading(true);
    try {
      // Generate receipt client-side using the donation data
      const { generateReceiptPDF } = await import("@/lib/receipt");
      const dataUri = generateReceiptPDF({
        date: new Date(donation.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        txnid: donation.txnid,
        amount: donation.amount,
        fullName: donation.donor.fullName,
        address: "",
        pan: donation.donor.pan || undefined,
        aadhaar: donation.donor.aadhaar || undefined,
        paymentMode: donation.paymentMode,
        bankRefNum: donation.bankRefNum,
        digilockerVerified: donation.donor.digilockerVerified,
      });

      // Download the PDF
      const link = document.createElement("a");
      link.href = dataUri;
      link.download = `donation-receipt-${donation.txnid}.pdf`;
      link.click();
    } catch (err) {
      console.error("Receipt generation failed:", err);
    } finally {
      setReceiptLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" as const }}
        className="max-w-lg w-full text-center"
      >
        <div className="relative w-20 h-20 mx-auto mb-6">
          <Image
            src="/assets/mandala-pattern.png"
            alt=""
            fill
            className="object-contain opacity-20 animate-mandala-spin"
          />
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
        </motion.div>

        <h1 className="font-heading text-temple-crimson text-3xl md:text-4xl font-bold mb-4">
          {isDonationSuccess ? "Thank You" : "Payment Status"}
        </h1>

        <p className="font-devanagari text-accent-saffron text-lg mb-6">
          ॐ नमः शिवाय
        </p>

        <p className="font-body text-dark text-base md:text-lg leading-relaxed mb-4">
          {isDonationSuccess
            ? "Your generous contribution to the Shiva Temple at Rishihood University has been received. You have become a part of something sacred and timeless."
            : "We are checking your transaction status. If your payment did not complete, please use the action below to retry."}
        </p>

        {/* Transaction Details */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin text-temple-crimson" />
            <span className="font-body text-medium text-sm">
              Loading details...
            </span>
          </div>
        ) : donation ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-warm-white rounded-xl p-5 mb-6 border border-temple-gold-light/20 text-left"
          >
            <div className="space-y-2.5">
              <div className="flex justify-between font-body text-sm">
                <span className="text-medium">Transaction ID</span>
                <span className="text-dark font-mono text-xs">
                  {donation.txnid}
                </span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-medium">Amount</span>
                <span className="text-dark font-semibold">
                  {formatCurrency(donation.amount)}
                </span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-medium">Payment Mode</span>
                <span className="text-dark">{donation.paymentMode || "Online"}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-medium">Date</span>
                <span className="text-dark">
                  {new Date(donation.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {donation.donor.digilockerVerified && (
                <div className="flex justify-between font-body text-sm">
                  <span className="text-medium">Identity</span>
                  <span className="text-green-600 font-semibold text-xs">
                    DigiLocker Verified
                  </span>
                </div>
              )}
            </div>

            {isDonationSuccess ? (
              <button
                onClick={handleDownloadReceipt}
                disabled={receiptLoading}
                className="w-full mt-4 bg-temple-crimson/10 text-temple-crimson font-body font-semibold text-sm py-2.5 rounded-lg hover:bg-temple-crimson/20 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {receiptLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Receipt (PDF)
                  </>
                )}
              </button>
            ) : (
              <Link
                href={`/donation/failed?txnid=${donation.txnid}&status=${donation.status}`}
                className="w-full mt-4 bg-temple-crimson/10 text-temple-crimson font-body font-semibold text-sm py-2.5 rounded-lg hover:bg-temple-crimson/20 transition-colors inline-flex items-center justify-center"
              >
                View Payment Result
              </Link>
            )}
          </motion.div>
        ) : null}

        {isDonationSuccess && (
          <p className="font-body text-medium text-sm leading-relaxed mb-8">
            Your donation is eligible for tax benefits under Section 80G.
          </p>
        )}

        <Link
          href="/"
          className="inline-block bg-temple-red text-cream font-body font-semibold tracking-wider text-sm px-8 py-3 rounded-lg hover:bg-temple-crimson-hover transition-colors"
        >
          Return Home
        </Link>
      </motion.div>
    </div>
  );
}

export default function DonationSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-temple-crimson" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
