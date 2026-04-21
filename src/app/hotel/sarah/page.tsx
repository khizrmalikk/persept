import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import Link from 'next/link';
import { ArrowRight, Bot, MessageCircle, Clock, Users } from 'lucide-react';
import { NetworkCanvas } from "@/components/ui/network-canvas";
import { FadeUp } from "@/components/ui/scroll-animations";

export default function SarahPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-[#0a0a0a]" />
        
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#b91c1c]/10 border border-[#b91c1c]/20 rounded-full text-[#b91c1c] text-sm mb-6">
            <Bot className="w-4 h-4" />
            Guest Communication Agent
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#b91c1c] to-blue-400 bg-clip-text text-transparent">
            Meet Sarah
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto">
            Your AI guest communication expert. Handles messages, bookings, and guest requests 24/7.
          </p>
          
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#b91c1c] to-[#b91c1c] text-white text-lg font-medium rounded-lg hover:shadow-2xl hover:shadow-[#b91c1c]/50 transition-all"
          >
            Get Sarah for Your Hotel
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* What Sarah Does */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              What Sarah Does
            </h2>
            <p className="text-xl text-white/60">
              Your 24/7 guest communication expert
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <MessageCircle className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Guest Communication</h3>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Pre-arrival welcome messages
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Check-in day greetings
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  In-stay check-ins
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Pre-checkout reminders
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Post-stay thank you & review requests
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <Clock className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">24/7 Availability</h3>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Instant responses to guest questions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  No delays, no waiting
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Handles multiple conversations simultaneously
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Escalates complex issues to staff
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Works while your team sleeps
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <Users className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Personalized Experience</h3>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Addresses guests by name
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Mentions room type and stay details
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Offers relevant upsells (early check-in, late checkout)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Remembers preferences for returning guests
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Consistent, friendly tone
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <Bot className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Smart Automation</h3>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Integrates with your PMS (Apaleo, Opera, etc.)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Pulls real-time guest data
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Tracks guest journey stage automatically
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Sends messages at optimal times
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Logs all interactions for staff review
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ROI */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-transparent to-indigo-950/20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-12">
            Sarah's Impact
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-[#b91c1c] to-blue-400 bg-clip-text text-transparent mb-2">
                2-3 hrs/day
              </div>
              <p className="text-white/60">Staff time saved</p>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-[#b91c1c] to-blue-400 bg-clip-text text-transparent mb-2">
                £12k+/year
              </div>
              <p className="text-white/60">Upsell revenue</p>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-[#b91c1c] to-blue-400 bg-clip-text text-transparent mb-2">
                100%
              </div>
              <p className="text-white/60">Response rate</p>
            </div>
          </div>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#b91c1c] to-[#b91c1c] text-white text-lg font-medium rounded-lg hover:shadow-2xl hover:shadow-[#b91c1c]/50 transition-all"
          >
            Add Sarah to Your Team
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
