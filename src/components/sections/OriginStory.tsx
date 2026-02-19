"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import MandalaDecoration from "@/components/ui/MandalaDecoration";
import SectionWrapper from "@/components/ui/SectionWrapper";
import OrnamentalDivider from "@/components/ui/OrnamentalDivider";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const poeticLines = [
  "From a journey to Haridwar.",
  "From silence by the Ganga.",
  "From a question that wouldn\u2019t leave.",
];

export default function OriginStory() {
  return (
    <SectionWrapper bg="cream">
      <MandalaDecoration position="top-right" size={380} mobilePosition="top-center" mobileSize={0} opacity={0.22} rotate={30} spin />

      {/* Subtle watercolor bg texture */}
      <div className="absolute inset-0 opacity-[0.20] pointer-events-none">
        <Image
          src="/assets/temple-watercolor.png"
          alt=""
          fill
          className="object-cover object-center"
          aria-hidden="true"
        />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center relative"
      >
        <motion.h2
          variants={fadeUp}
          className="font-heading text-temple-crimson text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight"
        >
          Where It All Began
        </motion.h2>

        <motion.div variants={fadeUp}>
          <OrnamentalDivider className="my-8" />
        </motion.div>

        {/* Story content with decorative left border */}
        <motion.div
          variants={fadeUp}
          className="text-left bg-section-alt/60 rounded-xl border-l-4 border-temple-gold/40 px-6 md:px-10 py-8 md:py-10 mb-10"
        >
          <p className="font-body text-dark text-base md:text-lg leading-[1.9] mb-5">
            It started not with a blueprint, but with a feeling. During
            Rishihood&apos;s Soul Treks to Haridwar, students walked the
            ancient ghats, listened to temple bells at Har Ki Pauri, and sat
            by the Ganga as evening aarti filled the air.
          </p>

          <p className="font-body text-dark text-base md:text-lg leading-[1.9] mb-5">
            Those days changed something within them. They experienced Raja
            Yoga, Karma Yoga, and Bhakti Yoga — not as philosophy from a
            textbook, but as a way of living they could feel.
          </p>

          <p className="font-body text-dark text-base md:text-lg leading-[1.9]">
            Back on campus, a shared realization crystallized. There was no
            space that honoured this dimension of their lives. And so the
            question arose — quietly, but
            unmistakably:&nbsp;
            <em className="text-temple-crimson font-medium">
              why not build one ourselves?
            </em>
          </p>
        </motion.div>

        {/* Poetic Lines — with decorative separators */}
        <div className="space-y-5">
          {poeticLines.map((line, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, delay: 0.15 * i, ease: "easeOut" as const },
                },
              }}
              className="flex items-center justify-center gap-4"
            >
              <div className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent to-accent-saffron/40" />
              <p className="font-heading italic text-accent-saffron text-lg md:text-2xl">
                {line}
              </p>
              <div className="h-px w-8 md:w-12 bg-gradient-to-l from-transparent to-accent-saffron/40" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
