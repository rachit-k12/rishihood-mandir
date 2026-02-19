"use client";

import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function DonationFailed() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" as const }}
        className="max-w-lg w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <XCircle className="w-16 h-16 text-temple-red mx-auto" />
        </motion.div>

        <h1 className="font-heading text-temple-crimson text-3xl md:text-4xl font-bold mb-4">
          Payment Unsuccessful
        </h1>

        <p className="font-body text-dark text-base md:text-lg leading-relaxed mb-4">
          We&apos;re sorry, but your payment could not be processed. No amount
          has been deducted from your account.
        </p>

        <p className="font-body text-medium text-sm leading-relaxed mb-8">
          Please try again or contact us at{" "}
          <a
            href="mailto:namaste@rishihood.edu.in"
            className="text-temple-crimson underline hover:text-temple-crimson-hover"
          >
            namaste@rishihood.edu.in
          </a>{" "}
          for assistance.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/#donation"
            className="inline-block bg-temple-red text-cream font-body font-semibold tracking-wider text-sm px-8 py-3 rounded-lg hover:bg-temple-crimson-hover transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="inline-block border border-temple-gold-muted text-dark font-body font-semibold tracking-wider text-sm px-8 py-3 rounded-lg hover:bg-cream-dark transition-colors"
          >
            Return Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
