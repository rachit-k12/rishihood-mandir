import Hero from "@/components/sections/Hero";
import Avahanam from "@/components/sections/Avahanam";
import SpaceBeyond from "@/components/sections/SpaceBeyond";
import OriginStory from "@/components/sections/OriginStory";
import EnvisionedByStudents from "@/components/sections/EnvisionedByStudents";
import RootedInTradition from "@/components/sections/RootedInTradition";
import AboutUniversity from "@/components/sections/AboutUniversity";
import Gratitude from "@/components/sections/Gratitude";
import DonationProgress from "@/components/sections/DonationProgress";
import DonationSection from "@/components/sections/DonationSection";
import Footer from "@/components/sections/Footer";
import FloatingDonateButton from "@/components/ui/FloatingDonateButton";

export default function Home() {
  return (
    <main>
      <Hero />
      <Avahanam />
      <SpaceBeyond />
      <OriginStory />
      <EnvisionedByStudents />
      <RootedInTradition />
      <AboutUniversity />
      <Gratitude />
      <DonationProgress />
      <DonationSection />
      <Footer />
      <FloatingDonateButton />
    </main>
  );
}
