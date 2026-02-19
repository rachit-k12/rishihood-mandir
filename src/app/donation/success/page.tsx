"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function DonationSuccess() {
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
          Thank You
        </h1>

        <p className="font-devanagari text-accent-saffron text-lg mb-6">
          ॐ नमः शिवाय
        </p>

        <p className="font-body text-dark text-base md:text-lg leading-relaxed mb-4">
          Your generous contribution to the Shiva Temple at Rishihood
          University has been received. You have become a part of something
          sacred and timeless.
        </p>

        <p className="font-body text-medium text-sm leading-relaxed mb-8">
          A confirmation receipt will be sent to your email shortly. Your
          donation is eligible for tax benefits under Section 80G.
        </p>

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
