import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import Link from 'next/link';
import { ArrowRight, Bot, Briefcase, Plane } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-black to-purple-950" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            AI Workforce Solutions
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-4 max-w-3xl mx-auto">
            Problems fixed with intelligent agents.
          </p>
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto">
            Workforces built with AI.
          </p>
          
          <Link
            href="#solutions"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-medium rounded-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all"
          >
            Explore Solutions
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Solutions Showcase */}
      <section id="solutions" className="relative py-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our Solutions
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Tailored AI workforces designed to solve real business problems
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* GYST Card */}
            <div className="group relative bg-gradient-to-br from-blue-900/20 to-blue-950/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">GYST</h3>
                <p className="text-white/50 text-sm mb-4">Job Application Platform</p>
              </div>
              
              <p className="text-white/70 mb-6">
                Find jobs that match your criteria, create custom CVs tailored to each role, auto-apply, and track all your applications in one place.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Smart job matching
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  AI-powered CV customization
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Automated applications
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Application tracking
                </div>
              </div>

              <Link
                href="/solutions/gyst"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Learn More
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* DAP Card */}
            <div className="group relative bg-gradient-to-br from-purple-900/20 to-pink-950/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
                  <Plane className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Double Apple Pay</h3>
                <p className="text-white/50 text-sm mb-4">Travel Expense Tracker</p>
              </div>
              
              <p className="text-white/70 mb-6">
                Split expenses with friends and groups while traveling. Track who paid what, support multiple currencies, and settle up with smart calculations.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Multi-currency support
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Smart expense splitting
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Real-time balance tracking
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Optimized settlements
                </div>
              </div>

              <Link
                href="/solutions/dap"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                Learn More
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Hotel AI Workforce Card */}
            <div className="group relative bg-gradient-to-br from-indigo-900/20 to-blue-950/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Hotel AI Workforce</h3>
                <p className="text-white/50 text-sm mb-4">Hospitality Automation</p>
              </div>
              
              <p className="text-white/70 mb-6">
                AI agents that handle guest communication, manage reviews, and automate hotel operations 24/7. Meet Sarah and Marcus.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  Automated guest communication
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  Review management
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  24/7 availability
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  PMS integration
                </div>
              </div>

              <Link
                href="/hotel"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                Learn More
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Persept Section */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-transparent to-blue-950/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Persept?
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              We build AI workforces that solve real problems
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-white/10">
                <span className="text-4xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Agent-Driven</h3>
              <p className="text-white/60">
                Intelligent AI agents that learn, adapt, and improve over time
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-white/10">
                <span className="text-4xl">⚙️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Custom Built</h3>
              <p className="text-white/60">
                Tailored solutions designed for your specific business needs
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-white/10">
                <span className="text-4xl">📈</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Real Results</h3>
              <p className="text-white/60">
                Measurable impact on efficiency, revenue, and customer satisfaction
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Build Your AI Workforce?
          </h2>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Let's discuss how Persept can transform your business with intelligent automation
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-medium rounded-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
