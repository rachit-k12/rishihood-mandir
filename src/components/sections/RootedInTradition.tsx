"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import MandalaDecoration from "@/components/ui/MandalaDecoration";
import SectionWrapper from "@/components/ui/SectionWrapper";
import OrnamentalDivider from "@/components/ui/OrnamentalDivider";

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const pillars = [
  { label: "Nagara Style", detail: "Curvilinear shikhara rising like a mountain peak" },
  { label: "Vastu Aligned", detail: "Sacred geometry governing every proportion" },
  { label: "West-Facing", detail: "Devotees face east — the direction of sunrise" },
  { label: "Sthapati Crafted", detail: "Built by generational temple artisans" },
];

export default function RootedInTradition() {
  return (
    <SectionWrapper bg="cream">
      <MandalaDecoration position="top-right" size={400} mobileOpacity={0} opacity={0.28} rotate={20} />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-5xl mx-auto relative"
      >
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Image */}
          <motion.div variants={fadeUp} className="justify-center md:flex hidden">
            <Image
              src="/assets/temple-watercolor.png"
              alt="Temple architectural illustration in watercolor style"
              width={500}
              height={500}
              className="w-64 md:w-[32rem] lg:w-[40rem] h-auto"
            />
          </motion.div>

          {/* Content */}
          <div>
            <motion.h2
              variants={fadeUp}
              className="font-heading text-temple-crimson text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mb-3"
            >
              Rooted in Timeless Tradition
            </motion.h2>

            <motion.div variants={fadeUp}>
              <OrnamentalDivider size="sm" className="!justify-start mb-7" />
            </motion.div>

            <motion.p
              variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay: 0.1 } } }}
              className="font-body text-dark text-base md:text-lg leading-[1.85] mb-8"
            >
              Designed following the same principles that have guided Indian
              temple architecture for over a thousand years — every stone
              carries intention, every proportion echoes a cosmic truth.
            </motion.p>

            {/* Pillar tags */}
            <div className="grid grid-cols-2 gap-4">
              {pillars.map((pillar, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5, delay: 0.15 + 0.1 * i, ease: "easeOut" as const },
                    },
                  }}
                  className="border-l-2 border-temple-gold/50 pl-4"
                >
                  <h4 className="font-heading text-temple-crimson text-sm md:text-base font-semibold mb-0.5">
                    {pillar.label}
                  </h4>
                  <p className="font-body text-medium text-xs md:text-sm leading-snug">
                    {pillar.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div variants={fadeUp} className="flex justify-center md:hidden">
            <Image
              src="/assets/temple-watercolor.png"
              alt="Temple architectural illustration in watercolor style"
              width={500}
              height={500}
              className="w-64 md:w-[32rem] lg:w-[40rem] h-auto"
            />
          </motion.div>
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
