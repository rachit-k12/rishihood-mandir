import DonationSection from "@/components/sections/DonationSection";
import Footer from "@/components/sections/Footer";
import Link from "next/link";

export const metadata = {
  title: "Donate — Shiva Temple at Rishihood University",
  description:
    "Make your contribution towards the Shiva Temple at Rishihood University. Verify with DigiLocker and donate securely.",
};

export default function DonatePage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Minimal header */}
      <header className="bg-cream border-b border-temple-gold-muted/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-heading text-temple-crimson text-lg md:text-xl font-semibold hover:text-temple-crimson-hover transition-colors"
          >
            Shiva Temple — Rishihood
          </Link>
          <Link
            href="/"
            className="font-body text-medium text-xs md:text-sm hover:text-dark transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </header>

      <DonationSection />
      <Footer />
    </main>
  );
}
