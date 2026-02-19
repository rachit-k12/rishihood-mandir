"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import MandalaDecoration from "@/components/ui/MandalaDecoration";
import SectionWrapper from "@/components/ui/SectionWrapper";
import OrnamentalDivider from "@/components/ui/OrnamentalDivider";

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

export default function AboutUniversity() {
  return (
    <SectionWrapper bg="alt">
      <MandalaDecoration position="top-left" mobilePosition="top-center" mobileSize={450} size={350} opacity={0.30} rotate={25} />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center"
      >
        <motion.h2
          variants={fadeUp}
          className="font-heading text-temple-crimson text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight"
        >
          About Rishihood University
        </motion.h2>

        <motion.div variants={fadeUp}>
          <OrnamentalDivider className="my-8" />
        </motion.div>

        <motion.p
          variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay: 0.1 } } }}
          className="font-body text-dark text-base md:text-lg leading-[1.85] mb-5"
        >
          India&apos;s first Impact University — founded in 2020 by IIT alumni
          through collective philanthropy, inspired by Swami Vivekananda&apos;s
          vision of individuals who could reach &ldquo;Rishihood&rdquo; and
          transform the nation. Located on a 25-acre campus in Sonipat, Haryana.
        </motion.p>

        <motion.p
          variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay: 0.2 } } }}
          className="font-body text-dark text-base md:text-lg leading-[1.85] mb-6"
        >
          With six schools spanning Technology, Entrepreneurship, Design,
          Psychology, Public Leadership, and Healthcare — Rishihood operates as a
          modern Gurukul where Soul Treks, Inner Engineering, and the 100 Km
          Walkathon sit alongside academics to build both competence and character.
        </motion.p>

        <motion.div
          variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay: 0.3 } } }}
          className="flex flex-col items-center gap-3"
        >
          <a
            href="https://rishihood.edu.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-body text-temple-crimson text-sm font-semibold hover:text-temple-crimson-hover transition-colors"
          >
            Visit rishihood.edu.in
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="font-devanagari text-medium/50 text-sm">
            व्यक्ति &nbsp;|&nbsp; विचार &nbsp;|&nbsp; व्यवस्था
          </p>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
