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

const imageReveal = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: { opacity: 1, scale: 1, transition: { duration: 1.2, ease: "easeOut" as const } },
};

export default function SpaceBeyond() {
  return (
    <SectionWrapper bg="alt">
      <MandalaDecoration position="bottom-left" size={400} opacity={0.22} rotate={-20} />

      <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
        {/* Text Column */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="order-2 md:order-1"
        >
          <motion.h2
            variants={fadeUp}
            className="font-heading text-temple-crimson text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 leading-tight"
          >
            More Than a Monument
          </motion.h2>

          <motion.div variants={fadeUp}>
            <OrnamentalDivider size="sm" className="!justify-start mb-7" />
          </motion.div>

          <motion.p
            variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay: 0.1 } } }}
            className="font-body text-dark text-base md:text-lg leading-[1.85] mb-5"
          >
            This temple is not just stone and sculpture. It is a living space
            where the rush of academic life gives way to something quieter —
            a place to pause, to breathe, to reconnect with what truly matters.
          </motion.p>

          <motion.p
            variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay: 0.2 } } }}
            className="font-body text-dark text-base md:text-lg leading-[1.85] mb-5"
          >
            Within a university that believes education must touch the heart
            as much as the mind, this temple becomes the physical expression
            of that philosophy — a sanctuary where students discover that
            wisdom begins in stillness.
          </motion.p>

          <motion.div
            variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay: 0.3 } } }}
            className="border-l-3 border-temple-gold/40 pl-5"
          >
            <p className="font-heading italic text-medium text-base md:text-lg leading-relaxed">
              Where silence speaks louder than lectures, and presence becomes
              the deepest form of learning.
            </p>
          </motion.div>
        </motion.div>

        {/* Image Column */}
        <motion.div
          variants={imageReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="order-1 md:order-2 flex justify-center"
        >
          <Image
            src="/assets/temple-watercolor.png"
            alt="Watercolor illustration of the Nagara temple with lotus flowers and mandala"
            width={500}
            height={500}
            className="w-72 md:w-[32rem] lg:w-[32rem] h-auto"
          />
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
