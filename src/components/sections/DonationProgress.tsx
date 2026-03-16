"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MandalaDecoration from "@/components/ui/MandalaDecoration";
import SectionWrapper from "@/components/ui/SectionWrapper";
import OrnamentalDivider from "@/components/ui/OrnamentalDivider";
import { DONATION_TARGET, formatCurrency, formatLargeAmount } from "@/lib/constants";

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

interface DonationStats {
  totalCollected: number;
  target: number;
  count: number;
}

export default function DonationProgress() {
  const [stats, setStats] = useState<DonationStats | null>(null);

  useEffect(() => {
    fetch("/api/donation/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => setStats({ totalCollected: 0, target: DONATION_TARGET, count: 0 }));
  }, []);

  const totalCollected = stats?.totalCollected ?? 0;
  const target = stats?.target ?? DONATION_TARGET;
  const count = stats?.count ?? 0;
  const percentage = Math.min((totalCollected / target) * 100, 100);

  // SVG circle parameters
  const size = 220;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <SectionWrapper bg="warm-white">
      <MandalaDecoration position="center" size={700} opacity={0.09} spin />

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center"
      >
        <motion.h2
          variants={fadeUp}
          className="font-heading text-temple-crimson text-3xl md:text-4xl lg:text-5xl font-semibold"
        >
          Our Progress
        </motion.h2>

        <motion.div variants={fadeUp}>
          <OrnamentalDivider size="sm" className="my-5" />
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="font-body text-medium text-sm md:text-base mb-8 max-w-lg mx-auto"
        >
          Every contribution brings us closer to building a sacred space for
          generations to come.
        </motion.p>

        {/* Circular Progress */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center"
        >
          <div className="relative" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              className="transform -rotate-90"
            >
              <defs>
                <linearGradient
                  id="progressGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="var(--temple-gold)" />
                  <stop offset="100%" stopColor="var(--temple-crimson)" />
                </linearGradient>
              </defs>
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--temple-gold-muted)"
                strokeWidth={strokeWidth}
                opacity={0.2}
              />
              {/* Progress arc */}
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                whileInView={{ strokeDashoffset: offset }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-temple-crimson text-2xl md:text-3xl font-bold leading-tight">
                {stats ? formatCurrency(totalCollected) : "..."}
              </span>
              <span className="font-body text-medium text-xs mt-0.5">
                of {formatLargeAmount(target)}
              </span>
            </div>
          </div>

          {/* Stats below circle */}
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center">
              <p className="font-heading text-temple-crimson text-xl font-bold">
                {stats ? count : "..."}
              </p>
              <p className="font-body text-medium text-xs">Donors</p>
            </div>
            <div className="w-px h-8 bg-temple-gold-muted/40" />
            <div className="text-center">
              <p className="font-heading text-temple-crimson text-xl font-bold">
                {stats ? `${percentage.toFixed(1)}%` : "..."}
              </p>
              <p className="font-body text-medium text-xs">Reached</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
