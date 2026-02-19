"use client";

import { motion } from "framer-motion";

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  bg?: "cream" | "alt" | "warm-white" | "dark";
}

export default function SectionWrapper({
  children,
  className = "",
  id,
  bg = "cream",
}: SectionWrapperProps) {
  const bgClasses: Record<string, string> = {
    cream: "bg-cream",
    alt: "bg-section-alt",
    "warm-white": "bg-warm-white",
    dark: "bg-footer-dark text-on-dark",
  };

  return (
    <motion.section
      id={id}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" as const }}
      viewport={{ once: true, margin: "-80px" }}
      className={`relative py-16 md:py-28 lg:py-32 overflow-hidden ${bgClasses[bg]} ${className}`}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12">
        {children}
      </div>
    </motion.section>
  );
}
