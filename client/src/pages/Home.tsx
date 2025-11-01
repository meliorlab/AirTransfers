import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import VehicleFleetSection from "@/components/VehicleFleetSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <VehicleFleetSection />
      <CTASection />
      <Footer />
    </div>
  );
}
