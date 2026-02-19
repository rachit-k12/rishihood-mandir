"use client";

import { motion } from "framer-motion";

interface AnimatedTextProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "blockquote";
}

export default function AnimatedText({
  children,
  delay = 0,
  className = "",
  as: Tag = "p",
}: AnimatedTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" as const }}
      viewport={{ once: true }}
    >
      <Tag className={className}>{children}</Tag>
    </motion.div>
  );
}
