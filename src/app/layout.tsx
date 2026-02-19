import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, Noto_Serif_Devanagari, Cormorant_Garamond } from "next/font/google";
import SmoothScroll from "@/components/providers/SmoothScroll";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const notoDevanagari = Noto_Serif_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shiva Temple — Rishihood University",
  description:
    "Support the construction of the Shiva Temple at Rishihood University — a sacred space envisioned by students, rooted in timeless Indian tradition, designed in the Nagara architectural style.",
  keywords: [
    "Rishihood University",
    "Shiva Temple",
    "donation",
    "Nagara architecture",
    "sacred space",
    "temple donation",
    "Sonipat",
  ],
  openGraph: {
    title: "Shiva Temple — Rishihood University",
    description:
      "A sacred space envisioned by students, rooted in timeless Indian tradition.",
    images: ["/assets/hero-bg.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shiva Temple — Rishihood University",
    description:
      "A sacred space envisioned by students, rooted in timeless Indian tradition.",
    images: ["/assets/hero-bg.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${playfair.variable} ${dmSans.variable} ${cormorant.variable} ${notoDevanagari.variable} antialiased`}
      >
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
