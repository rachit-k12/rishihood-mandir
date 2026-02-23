"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FloatingDonateButton() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  // Hide on /donate and /donation/* pages since user is already in the donation flow
  const isDonationPage =
    pathname === "/donate" ||
    pathname.startsWith("/donation/");

  useEffect(() => {
    if (isDonationPage) return;

    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDonationPage]);

  if (isDonationPage) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" as const }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Link
            href="/donate"
            className="flex items-center gap-2 bg-temple-red text-cream font-body font-semibold text-sm tracking-wider px-6 py-3 rounded-full shadow-lg animate-pulse-glow"
            aria-label="Go to donation page"
          >
            <Heart className="w-4 h-4 fill-current" />
            <span>Donate</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
