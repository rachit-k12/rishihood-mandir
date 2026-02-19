"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import MandalaDecoration from "@/components/ui/MandalaDecoration";
import SectionWrapper from "@/components/ui/SectionWrapper";
import OrnamentalDivider from "@/components/ui/OrnamentalDivider";

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

export default function Avahanam() {
  return (
    <SectionWrapper id="avahanam" bg="cream">
      {/* Mandalas */}
      <MandalaDecoration position="top-right" mobilePosition="top-center" mobileSize={500} size={420} opacity={0.32} rotate={15} />
      <MandalaDecoration position="bottom-left" size={350} opacity={0.18} rotate={-20} />

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center relative"
      >
        {/* Section Title */}
        <motion.h2
          variants={fadeUp}
          className="font-devanagari text-temple-crimson text-3xl md:text-4xl lg:text-6xl font-semibold mb-2"
        >
          आवाहनम्
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="font-heading italic text-medium text-sm md:text-base tracking-wide mb-6"
        >
          The Invitation
        </motion.p>

        <motion.div variants={fadeUp}>
          <OrnamentalDivider className="mb-10" />
        </motion.div>

        {/* Invitation on vintage scroll parchment */}
        <motion.div
          variants={fadeUp}
          className="relative mx-auto max-w-2xl"
        >
          {/* Vintage scroll background */}
          <div className="absolute -inset-y-10 -inset-x-24 md:-inset-14">
            <Image
              src="/assets/vintage-scroll.png"
              alt=""
              fill
              className="object-fill"
              aria-hidden="true"
            />
          </div>

          {/* Content on the scroll */}
          <div className="relative z-10 px-6 md:px-30 py-10 md:py-30">
            <p className="font-letter italic font-bold text-ink-sepia text-base md:text-xl leading-[1.75] md:leading-[1.85] my-4 mt-8 md:my-6">
              We invite you to be part of something that will stand for
              generations — the Shiva Temple at Rishihood University. Born
              from the hearts of students, this sacred space honours the
              timeless bond between knowledge and devotion.
            </p>

            <p className="font-letter italic font-bold text-ink-sepia text-base md:text-xl leading-[1.75] md:leading-[1.85] mb-4 md:mb-6">
              Designed in the Nagara architectural tradition and guided by
              Vastu Shastra, it will serve as a sanctuary for reflection,
              gratitude, and spiritual grounding within a campus of learning.
            </p>

            <p className="font-letter italic font-bold text-ink-sepia text-base md:text-xl leading-[1.75] md:leading-[1.85] mb-4">
              Your presence and support will transform a collective dream
              into a living reality — a temple that nurtures the spirit of
              every student who walks through its doors.
            </p>
          </div>
        </motion.div>

        {/* Closing */}
        <motion.div variants={fadeUp} className="mt-12">
          <OrnamentalDivider size="sm" className="mb-6" />
          <p className="font-heading italic text-medium text-base md:text-lg mb-1">
            With reverence and gratitude,
          </p>
          <p className="font-heading text-temple-crimson text-lg md:text-xl font-semibold">
            Rishihood University
          </p>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
