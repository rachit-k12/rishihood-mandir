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

export default function EnvisionedByStudents() {
  return (
    <SectionWrapper bg="alt">
      <MandalaDecoration position="bottom-right" size={300} opacity={0.18} rotate={20} />

      <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
        {/* Image Column */}
        <motion.div
          variants={imageReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex justify-center"
        >
          <Image
            src="/assets/temple-shield.png"
            alt="Illustration of two students looking at the temple within a shield emblem"
            width={450}
            height={500}
            className="w-60 md:w-96 lg:w-[28rem] h-auto drop-shadow-lg"
          />
        </motion.div>

        {/* Text Column */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            variants={fadeUp}
            className="font-heading text-temple-crimson text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 leading-tight"
          >
            Imagined by the Young, Built for the Ages
          </motion.h2>

          <motion.div variants={fadeUp}>
            <OrnamentalDivider size="sm" className="!justify-start mb-7" />
          </motion.div>

          <motion.p
            variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay: 0.1 } } }}
            className="font-body text-dark text-base md:text-lg leading-[1.85] mb-5"
          >
            This is not a temple imposed from above. It was not conceived by
            a committee or ordained by tradition alone. It grew from the lived
            experience of students — from their encounter with something
            ancient that felt unexpectedly alive.
          </motion.p>

          <motion.p
            variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay: 0.2 } } }}
            className="font-body text-dark text-base md:text-lg leading-[1.85] mb-5"
          >
            In a world where the young are often seen as disconnected from
            heritage, this initiative tells a different story — one where a
            generation chooses to build a bridge between the eternal and the
            evolving.
          </motion.p>

          <motion.div
            variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay: 0.3 } } }}
            className="border-l-3 border-temple-gold/40 pl-5"
          >
            <p className="font-heading italic text-medium text-base md:text-lg leading-relaxed">
              They did not inherit faith passively — they chose to express it
              through stone, intention, and collective action.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
