"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

export default function FloatingDonateButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToDonation = () => {
    document.getElementById("donation")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" as const }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToDonation}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-temple-red text-cream font-body font-semibold text-sm tracking-wider px-6 py-3 rounded-full shadow-lg animate-pulse-glow cursor-pointer"
          aria-label="Scroll to donation section"
        >
          <Heart className="w-4 h-4 fill-current" />
          <span>Donate</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
