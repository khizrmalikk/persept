import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import Link from 'next/link';
import { ArrowRight, Star, MessageCircle, TrendingUp, Shield } from 'lucide-react';
import { NetworkCanvas } from "@/components/ui/network-canvas";
import { FadeUp } from "@/components/ui/scroll-animations";

export default function MarcusPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-[#0a0a0a]" />
        
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(251, 191, 36, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(251, 191, 36, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#b91c1c]/10 border border-[#b91c1c]/20 rounded-full text-[#b91c1c] text-sm mb-6">
            <Star className="w-4 h-4" />
            Review Management Agent
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#b91c1c] to-orange-400 bg-clip-text text-transparent">
            Meet Marcus
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto">
            Your AI review management expert. Monitors reviews, responds professionally, and protects your reputation 24/7.
          </p>
          
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#b91c1c] to-[#991818] text-white text-lg font-medium rounded-lg hover:shadow-2xl hover:shadow-[#b91c1c]/50 transition-all"
          >
            Get Marcus for Your Hotel
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* What Marcus Does */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              What Marcus Does
            </h2>
            <p className="text-xl text-white/60">
              Your 24/7 reputation guardian
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <Star className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Review Monitoring</h3>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Monitors Google, TripAdvisor, Booking.com
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Instant alerts for new reviews
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Sentiment analysis (positive/negative/mixed)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Priority flags for urgent issues
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Aggregated review dashboard
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <MessageCircle className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Smart Responses</h3>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Crafts personalized, empathetic responses
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Addresses specific feedback points
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Maintains brand voice and tone
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Escalates complex issues to management
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Fast response times (under 24 hours)
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <TrendingUp className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Trend Analysis</h3>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Identifies recurring issues and themes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Tracks rating changes over time
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Highlights staff mentioned in reviews
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Competitor comparison insights
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Monthly performance reports
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <Shield className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Reputation Protection</h3>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Converts negative experiences into positive outcomes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Encourages happy guests to leave reviews
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Flags fraudulent or suspicious reviews
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Prevents review fatigue (over-responding)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] mt-1">•</span>
                  Maintains consistent response quality
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Response Examples */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-transparent to-amber-950/20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Marcus in Action
            </h2>
            <p className="text-xl text-white/60">
              Real response examples
            </p>
          </div>

          <div className="space-y-8">
            {/* Positive Review Response */}
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-white/80 italic mb-4">
                "Wonderful stay! The room was spotless, staff were incredibly friendly, and the location was perfect for exploring the city."
              </p>
              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-sm text-white/50 mb-2">Marcus's Response:</p>
                <p className="text-white/70">
                  "Thank you so much for your kind words! We're thrilled you enjoyed the spotless room and our team's hospitality. Our central location is indeed perfect for city exploration. We look forward to welcoming you back on your next visit!"
                </p>
              </div>
            </div>

            {/* Negative Review Response */}
            <div className="bg-gradient-to-br from-red-900/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-gray-400" />
                <Star className="w-5 h-5 text-gray-400" />
                <Star className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-white/80 italic mb-4">
                "The room was okay but the Wi-Fi kept dropping and the pool was closed during our January stay without prior notice. Disappointing."
              </p>
              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-sm text-white/50 mb-2">Marcus's Response:</p>
                <p className="text-white/70">
                  "We sincerely apologize for the Wi-Fi issues and the unexpected pool closure during your January stay. We were completing essential maintenance on the pool, which is now fully operational. We've also upgraded our internet infrastructure to prevent connectivity problems. We'd love the opportunity to provide you with a better experience—please reach out to manager@hotel.com for a special returning guest offer."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-12">
            Marcus's Impact
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-[#b91c1c] to-orange-400 bg-clip-text text-transparent mb-2">
                &lt;24hrs
              </div>
              <p className="text-white/60">Response time</p>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-[#b91c1c] to-orange-400 bg-clip-text text-transparent mb-2">
                +0.5★
              </div>
              <p className="text-white/60">Average rating boost</p>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-[#b91c1c] to-orange-400 bg-clip-text text-transparent mb-2">
                100%
              </div>
              <p className="text-white/60">Review coverage</p>
            </div>
          </div>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#b91c1c] to-[#991818] text-white text-lg font-medium rounded-lg hover:shadow-2xl hover:shadow-[#b91c1c]/50 transition-all"
          >
            Add Marcus to Your Team
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
