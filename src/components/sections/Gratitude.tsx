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

export default function Gratitude() {
  return (
    <SectionWrapper bg="cream">
      <MandalaDecoration position="top-right" size={350} opacity={0.22} rotate={10} spin />
      <MandalaDecoration position="bottom-left" size={280} opacity={0.18} rotate={-15} />

      {/* Temple silhouette background */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
        <Image
          src="/assets/hero-bg-subtle.jpg"
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
          className="font-devanagari text-temple-crimson text-4xl md:text-4xl lg:text-6xl font-semibold mb-1"
        >
          कृतज्ञता
        </motion.h2>

        <motion.h3
          variants={fadeUp}
          className="font-heading text-temple-crimson text-2xl md:text-2xl font-semibold mb-2"
        >
          A Note of Gratitude
        </motion.h3>

        <motion.div variants={fadeUp}>
          <OrnamentalDivider className="my-8" />
        </motion.div>

        {/* Gratitude text in decorative frame */}
        <motion.div
          variants={fadeUp}
          className="relative bg-warm-white/50 rounded-xl border border-temple-gold-light/25 px-8 md:px-12 py-10"
        >
          {/* Corner accents */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-temple-gold/25 rounded-tl-sm" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-temple-gold/25 rounded-tr-sm" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-temple-gold/25 rounded-bl-sm" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-temple-gold/25 rounded-br-sm" />

          <p className="font-body text-dark text-base md:text-lg leading-[1.85] mb-5">
            To the students who dared to dream of something beyond the
            classroom. To the teachers who showed them that learning is as
            much about the soul as the mind. To the alumni who continue to
            carry the spirit of Rishihood forward.
          </p>

          <p className="font-body text-dark text-base md:text-lg leading-[1.85]">
            And to you — the one reading this — your generosity is not
            merely a donation. It is a foundation stone. A lamp lit in
            faith. A gift that will echo through the lives of students
            for generations to come.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-10 space-y-2">
          <p className="font-heading text-temple-crimson text-xl md:text-2xl font-semibold">
            Rishihood University
          </p>
          <p className="font-heading italic text-medium text-sm md:text-base">
            Where learning meets inner awakening
          </p>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
