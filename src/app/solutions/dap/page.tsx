import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import Link from 'next/link';
import { ArrowRight, Plane, DollarSign, Users, Smartphone, Calculator, Globe } from 'lucide-react';
import { NetworkCanvas } from "@/components/ui/network-canvas";
import { FadeUp, SlideIn } from "@/components/ui/scroll-animations";

export default function DAP() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-[#0a0a0a]" />
        
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#b91c1c]/10 border border-[#b91c1c]/20 rounded-full text-[#b91c1c] text-sm mb-6">
            <Plane className="w-4 h-4" />
            Travel Expense Tracker
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#b91c1c] to-pink-400 bg-clip-text text-transparent">
            Double Apple Pay
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-4 max-w-3xl mx-auto">
            Split expenses with friends. Track payments in real-time. Settle up fairly.
          </p>
          <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto">
            The smart way to manage group expenses while traveling with multi-currency support and optimized settlements.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://tripsplit.vercel.app"
              target="_blank"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#b91c1c] to-[#991818] text-white text-lg font-medium rounded-lg hover:shadow-2xl hover:shadow-[#b91c1c]/50 transition-all"
            >
              Try Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white text-lg font-medium rounded-lg hover:bg-white/20 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-white/60">
              Three simple steps to split expenses with friends
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#b91c1c] to-[#991818] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Create a Trip</h3>
              <p className="text-white/60 text-sm">
                Set up a trip with your friends, choose your base currency, and add all travelers
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#b91c1c] to-[#991818] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Add Expenses</h3>
              <p className="text-white/60 text-sm">
                Log who paid for what in any currency. Split equally, custom, or between two people
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#b91c1c] to-[#991818] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Settle Up</h3>
              <p className="text-white/60 text-sm">
                See who owes whom with smart settlements that minimize the number of transactions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-transparent to-purple-950/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-white/60">
              Everything you need for hassle-free group expenses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <Globe className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Multi-Currency Support</h3>
              <p className="text-white/60">
                Track expenses in 10+ currencies with automatic conversion to your base currency
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <Calculator className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Smart Calculations</h3>
              <p className="text-white/60">
                Flexible split options: equal, custom amounts, or between two people
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <Users className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Real-Time Balances</h3>
              <p className="text-white/60">
                Live tracking of who owes whom with color-coded balance indicators
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <DollarSign className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Optimized Settlements</h3>
              <p className="text-white/60">
                Minimize transactions with smart settlement suggestions
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <Smartphone className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Mobile-Friendly</h3>
              <p className="text-white/60">
                Fully responsive design works perfectly on phones, tablets, and desktops
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <Plane className="w-12 h-12 text-[#b91c1c] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Trip Dashboard</h3>
              <p className="text-white/60">
                Clean interface to view all expenses, balances, and settlement suggestions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Perfect For
            </h2>
            <p className="text-xl text-white/60">
              Simplify group expenses in any scenario
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-[#262626]/10 to-transparent border border-white/10 rounded-2xl p-8 text-center">
              <span className="text-5xl mb-4 block">✈️</span>
              <h3 className="text-xl font-bold text-white mb-2">Travel & Vacations</h3>
              <p className="text-white/60">
                Track hotel rooms, meals, activities, and transportation costs across multiple countries
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#262626]/10 to-transparent border border-white/10 rounded-2xl p-8 text-center">
              <span className="text-5xl mb-4 block">🏠</span>
              <h3 className="text-xl font-bold text-white mb-2">Shared Apartments</h3>
              <p className="text-white/60">
                Split rent, utilities, groceries, and household items among roommates
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#262626]/10 to-transparent border border-white/10 rounded-2xl p-8 text-center">
              <span className="text-5xl mb-4 block">🎉</span>
              <h3 className="text-xl font-bold text-white mb-2">Group Events</h3>
              <p className="text-white/60">
                Manage costs for dinners, parties, concerts, or any group activity
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Example Scenario */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-transparent to-purple-950/20">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-[#262626]/20 to-[#262626]/20 backdrop-blur-sm border border-white/10 rounded-3xl p-12">
            <h3 className="text-3xl font-bold text-white mb-6 text-center">
              Real Example: Weekend Trip
            </h3>
            <div className="space-y-4 text-white/70 mb-8">
              <p>
                <strong className="text-white">Alice</strong> paid for the Airbnb ($300),{' '}
                <strong className="text-white">Bob</strong> bought groceries ($80), and{' '}
                <strong className="text-white">Carol</strong> covered gas ($40).
              </p>
              <p>
                Instead of figuring out 6 different payments, DAP calculates:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Bob owes Alice $93.33</li>
                <li>Carol owes Alice $106.67</li>
              </ul>
              <p>
                <strong className="text-[#b91c1c]">Settled in just 2 transactions!</strong>
              </p>
            </div>
            <div className="text-center">
              <Link
                href="https://tripsplit.vercel.app"
                target="_blank"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#b91c1c] to-[#991818] text-white text-lg font-medium rounded-lg hover:shadow-2xl hover:shadow-[#b91c1c]/50 transition-all"
              >
                Try the Demo
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Simplify Group Expenses?
          </h2>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Try DAP today and never argue about who owes whom again
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://tripsplit.vercel.app"
              target="_blank"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#b91c1c] to-[#991818] text-white text-lg font-medium rounded-lg hover:shadow-2xl hover:shadow-[#b91c1c]/50 transition-all"
            >
              Launch App
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white text-lg font-medium rounded-lg hover:bg-white/20 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
