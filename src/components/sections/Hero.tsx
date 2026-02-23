"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function Hero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image — mobile and desktop variants */}
      <Image
        src="/assets/hero-bg.png"
        alt="Shiva Temple at Rishihood University — Nagara style temple at golden hour"
        fill
        priority
        className="hidden md:block object-cover object-center"
        quality={95}
        sizes="100vw"
      />
      <Image
        src="/assets/hero-bg-mobile.png"
        alt="Shiva Temple at Rishihood University"
        fill
        priority
        className="block md:hidden object-cover object-[center]"
        quality={90}
        sizes="100vw"
      />

      {/* Soft vignette for cinematic feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center 40%, transparent 40%, rgba(44,24,16,0.08) 100%)",
        }}
      />

      {/* Bottom gradient — short, just for seamless transition to next section */}
      <div className="absolute inset-x-0 bottom-0 h-[10%] md:h-[25%] bg-gradient-to-t from-cream via-cream/60 to-transparent" />
      <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute md:top-14 top-9 left-1/2 -translate-x-1/2 -translate-y-1/2 font-devanagari text-accent-orange text-2xl lg:text-3xl mb-3 text-shadow-saffron"
        >
          ॥ ॐ ॥
        </motion.p>
      {/* Top-left logo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="absolute top-3 left-5 md:top-5 md:left-10 z-10"
      >
        <Image
          src="/assets/logo.avif"
          alt="Rishihood University"
          width={140}
          height={45}
          className="w-24 md:w-32 lg:w-36 h-auto"
          priority
        />
      </motion.div>

      {/* Content — positioned in the upper sky area */}
      <div className="relative z-10 h-full flex flex-col justify-start pt-28 lg:pt-32 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="font-heading text-temple-crimson text-[24px] md:text-[36px] lg:text-[44px] italic font-semibold leading-normal max-w-3xl"
        >
          FOR TODAY&apos;S STUDENTS,
          <br />
          FOR GENERATIONS TO COME
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="font-body text-medium text-lg max-w-md mt-4 leading-relaxed"
        >
          The Shiva Temple at Rishihood University was brought to life by students, drawing from ancient traditions and crafted in the distinctive Nagara style.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="mt-6 self-start"
        >
          <Link
            href="/donate"
            className="inline-block bg-temple-red text-cream font-body font-semibold tracking-[0.15em] text-xs md:text-sm px-8 py-4 rounded-2xl hover:bg-temple-crimson-hover transition-colors cursor-pointer shadow-md"
          >
            CONTRIBUTE NOW
          </Link>
        </motion.div>
      </div>

      {/* Scroll Indicator — centered bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10"
      >
        <button
          onClick={() => scrollTo("avahanam")}
          className="animate-scroll-hint cursor-pointer"
          aria-label="Scroll down"
        >
          <ChevronDown className="w-6 h-6 text-temple-gold" />
        </button>
      </motion.div>
    </section>
  );
}
