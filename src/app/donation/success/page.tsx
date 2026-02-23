"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Download, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
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
    phone: string;
    address: string;
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
        address: donation.donor.address || "",
        pan: donation.donor.pan || undefined,
        aadhaar: donation.donor.aadhaar || undefined,
        paymentMode: donation.paymentMode,
        bankRefNum: donation.bankRefNum,
        digilockerVerified: donation.donor.digilockerVerified,
      });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-temple-crimson" />
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-heading text-temple-crimson text-2xl font-semibold mb-3">
            Donation Not Found
          </h1>
          <p className="font-body text-medium text-sm mb-6">
            We couldn&apos;t find your donation details. Please check your
            transaction reference.
          </p>
          <Link
            href="/"
            className="inline-block bg-temple-red text-cream font-body font-semibold text-sm px-8 py-3 rounded-lg hover:bg-temple-crimson-hover transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const donationDate = new Date(donation.createdAt).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-devanagari text-accent-saffron text-xl md:text-2xl mb-2"
          >
            ॐ नमः शिवाय
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-heading text-temple-crimson text-3xl md:text-4xl font-semibold"
          >
            Thank You
          </motion.h1>
        </div>

        {/* Scroll / Parchment Acknowledgement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative mx-auto max-w-xl"
        >
          {/* Vintage scroll background */}
          <div className="absolute -inset-y-16 -inset-x-12 md:-inset-y-20 md:-inset-x-24">
            <Image
              src="/assets/vintage-scroll.png"
              alt=""
              fill
              className="object-fill"
              aria-hidden="true"
            />
          </div>

          {/* Content on the scroll */}
          <div className="relative z-10 px-4 md:px-14 py-12 md:py-16">
            {/* Acknowledgement Title */}
            <h2 className="font-letter italic font-bold text-ink-sepia text-lg md:text-2xl text-center mb-1">
              Acknowledgement of Donation
            </h2>
            <p className="font-letter italic text-ink-sepia/70 text-xs md:text-sm text-center mb-6">
              Rishihood Foundation
            </p>

            {/* Divider */}
            <div className="w-16 h-px bg-ink-sepia/30 mx-auto mb-6" />

            {/* Greeting */}
            <p className="font-letter italic font-bold text-ink-sepia text-sm md:text-base leading-[1.8] mb-5">
              Dear{" "}
              <span className="underline decoration-ink-sepia/30 underline-offset-4">
                {donation.donor.fullName}
              </span>
              ,
            </p>

            <p className="font-letter italic font-bold text-ink-sepia text-sm md:text-base leading-[1.8] mb-5">
              We are deeply grateful for your generous contribution of{" "}
              <span className="text-temple-crimson font-bold not-italic">
                {formatCurrency(donation.amount)}
              </span>{" "}
              towards the Shiva Temple at Rishihood University. Your support
              helps transform a collective dream into a living reality.
            </p>

            {/* Details Table */}
            <div className="space-y-2.5 mb-5 border-y border-ink-sepia/20 py-4">
              <div className="flex justify-between font-letter text-xs md:text-sm">
                <span className="text-ink-sepia/70 italic">Date</span>
                <span className="text-ink-sepia font-bold italic">
                  {donationDate}
                </span>
              </div>
              <div className="flex justify-between font-letter text-xs md:text-sm gap-2">
                <span className="text-ink-sepia/70 italic shrink-0">Transaction ID</span>
                <span className="text-ink-sepia font-bold italic font-mono text-[10px] md:text-[11px] break-all text-right">
                  {donation.txnid}
                </span>
              </div>
              <div className="flex justify-between font-letter text-xs md:text-sm">
                <span className="text-ink-sepia/70 italic">Amount</span>
                <span className="text-ink-sepia font-bold italic">
                  {formatCurrency(donation.amount)}
                </span>
              </div>
              <div className="flex justify-between font-letter text-xs md:text-sm">
                <span className="text-ink-sepia/70 italic">Payment Mode</span>
                <span className="text-ink-sepia font-bold italic">
                  {donation.paymentMode || "Online"}
                </span>
              </div>
              {donation.bankRefNum && (
                <div className="flex justify-between font-letter text-xs md:text-sm gap-2">
                  <span className="text-ink-sepia/70 italic shrink-0">
                    Bank Reference
                  </span>
                  <span className="text-ink-sepia font-bold italic font-mono text-[10px] md:text-[11px] break-all text-right">
                    {donation.bankRefNum}
                  </span>
                </div>
              )}
              {donation.donor.digilockerVerified && (
                <div className="flex justify-between font-letter text-xs md:text-sm items-center">
                  <span className="text-ink-sepia/70 italic">
                    Identity Verified
                  </span>
                  <span className="flex items-center gap-1 text-ink-sepia font-bold italic">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    DigiLocker
                  </span>
                </div>
              )}
            </div>

            {/* 80G Note */}
            <p className="font-letter italic text-ink-sepia/70 text-[11px] md:text-xs leading-[1.7] mb-5">
              Your donation is eligible for tax benefits under Section 80G of
              the Income Tax Act. A formal 80G receipt will be issued by
              Rishihood Foundation upon verification.
            </p>

            {/* Closing */}
            <p className="font-letter italic font-bold text-ink-sepia text-sm md:text-base leading-[1.8]">
              With reverence and gratitude,
            </p>
            <p className="font-letter italic font-bold text-temple-crimson text-sm md:text-base">
              Rishihood University
            </p>
          </div>
        </motion.div>

        {/* Actions below the scroll */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={handleDownloadReceipt}
            disabled={receiptLoading}
            className="inline-flex items-center gap-2 bg-temple-red text-cream font-body font-semibold text-sm px-6 py-3 rounded-lg hover:bg-temple-crimson-hover transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {receiptLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Receipt...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Tax Receipt (PDF)
              </>
            )}
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 border border-temple-gold-muted text-dark font-body font-semibold text-sm px-6 py-3 rounded-lg hover:bg-cream-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return Home
          </Link>
        </motion.div>

        {/* Contact note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="font-body text-light text-[11px] text-center mt-6"
        >
          For queries, contact us at{" "}
          <a
            href="mailto:namaste@rishihood.edu.in"
            className="text-temple-crimson underline hover:text-temple-crimson-hover"
          >
            namaste@rishihood.edu.in
          </a>
        </motion.p>
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
