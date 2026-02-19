"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { SOCIAL_LINKS, CONTACT } from "@/lib/constants";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const socialLinks = [
  { icon: Instagram, href: SOCIAL_LINKS.instagram, label: "Instagram" },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    href: "https://twitter.com/RishihoodUni",
    label: "X (Twitter)",
  },
  { icon: Linkedin, href: SOCIAL_LINKS.linkedin, label: "LinkedIn" },
];

export default function Footer() {
  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative bg-temple-crimson overflow-hidden"
    >
      {/* Mandala overlay — more visible */}
      <div className="absolute -top-40 -right-50 w-[500px] h-[500px] opacity-[0.12] pointer-events-none">
        <Image
          src="/assets/mandala-pattern.png"
          alt=""
          fill
          className="object-contain"
          aria-hidden="true"
        />
      </div>

      {/* Second mandala on the left */}
      <div className="absolute hidden md:block -bottom-40 -left-50 w-[400px] h-[400px] opacity-[0.08] pointer-events-none">
        <Image
          src="/assets/mandala-pattern.png"
          alt=""
          fill
          className="object-contain"
          style={{ transform: "rotate(-30deg)" }}
          aria-hidden="true"
        />
      </div>

      {/* Main content area — pushed up, above the campus illustration */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-20 pb-8">
        {/* Top row: Logo + Contact + Social */}
        <div className="grid md:grid-cols-3 gap-10 md:gap-12 mb-12">
          {/* Logo & Tagline */}
          <motion.div variants={fadeUp}>
            <Image
              src="/assets/logo-white.png"
              alt="Rishihood University"
              width={200}
              height={65}
              className="w-40 md:w-48 h-auto mb-5"
            />
            <p className="font-heading italic text-white/90 text-xl md:text-2xl leading-relaxed">
              Where learning meets
              <br />
              inner awakening
            </p>
            <p className="font-devanagari text-white/50 text-sm mt-3">
              व्यक्ति | विचार | व्यवस्था
            </p>
          </motion.div>

          {/* Contact */}
          <motion.div
            variants={{
              ...fadeUp,
              visible: {
                ...fadeUp.visible,
                transition: {
                  ...fadeUp.visible.transition,
                  delay: 0.1,
                },
              },
            }}
          >
            <h4 className="font-heading text-white/95 text-lg font-semibold mb-5 tracking-wide">
              Contact
            </h4>
            <div className="space-y-4">
              <a
                href={`mailto:${CONTACT.email}`}
                className="flex items-center gap-3 text-white/75 hover:text-white transition-colors font-body text-sm md:text-base"
              >
                <Mail className="w-4.5 h-4.5 flex-shrink-0 text-white/50" />
                {CONTACT.email}
              </a>
              <a
                href={`tel:${CONTACT.phone.replace(/-/g, "")}`}
                className="flex items-center gap-3 text-white/75 hover:text-white transition-colors font-body text-sm md:text-base"
              >
                <Phone className="w-4.5 h-4.5 flex-shrink-0 text-white/50" />
                {CONTACT.phone}
              </a>
              <div className="flex items-start gap-3 text-white/75 font-body text-sm md:text-base">
                <MapPin className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-white/50" />
                <span>{CONTACT.address}</span>
              </div>
            </div>
          </motion.div>

          {/* Social */}
          <motion.div
            variants={{
              ...fadeUp,
              visible: {
                ...fadeUp.visible,
                transition: {
                  ...fadeUp.visible.transition,
                  delay: 0.2,
                },
              },
            }}
          >
            <h4 className="font-heading text-white/95 text-lg font-semibold mb-5 tracking-wide">
              Follow Us
            </h4>
            <div className="flex gap-3">
              {socialLinks.map((social, i) => {
                const Icon = social.icon;
                return (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-white/12 flex items-center justify-center text-white/75 hover:bg-white/25 hover:text-white transition-all"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>

            {/* Donate CTA */}
            <button
              onClick={() =>
                document
                  .getElementById("donation")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="mt-8 inline-flex items-center gap-2 bg-white/15 text-white font-body font-semibold text-sm tracking-widest px-7 py-3 rounded-md hover:bg-white/25 transition-colors cursor-pointer border border-white/20"
            >
              DONATE NOW
            </button>
          </motion.div>
        </div>

        {/* Divider */}
        <motion.div
          variants={{
            ...fadeUp,
            visible: {
              ...fadeUp.visible,
              transition: {
                ...fadeUp.visible.transition,
                delay: 0.25,
              },
            },
          }}
          className="border-t border-white/15 pt-6 mb-6"
        >
          <p className="font-body text-white/50 text-xs text-center mb-2">
            Donations eligible for tax benefits under Section 80G of the Income
            Tax Act.
          </p>
        </motion.div>
      </div>

      {/* Campus building illustration — stuck to bottom, below content */}
      <div className="relative w-full h-48 md:h-64 opacity-[0.10]">
        <Image
          src="/assets/campus-illustration.png"
          alt=""
          fill
          className="object-contain object-bottom"
          aria-hidden="true"
        />
      </div>

      {/* Copyright — absolute bottom */}
      <div className="relative z-10 bg-temple-crimson border-t border-white/10 py-4 px-6">
        <p className="font-body text-white/40 text-xs text-center">
          &copy; {new Date().getFullYear()} Rishihood University. All rights
          reserved.
        </p>
      </div>
    </motion.footer>
  );
}
