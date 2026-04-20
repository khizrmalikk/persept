import { FinalCTA } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Problem } from "@/components/sections/problem";
import { SocialProof } from "@/components/sections/social-proof";
import { Solution } from "@/components/sections/solution";
import { InteractiveDemo } from "@/components/ui/interactive-demo";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <Hero />
      <Problem />
      <Solution />
      <InteractiveDemo />
      <HowItWorks />
      <SocialProof />
      <FinalCTA />
      <Footer />
    </div>
  );
}
