import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import Link from 'next/link';
import { ArrowRight, Plane, DollarSign, Users, Smartphone, Calculator, Globe } from 'lucide-react';
import { NetworkCanvas } from "@/components/ui/network-canvas";
import { FadeUp, SlideIn } from "@/components/ui/scroll-animations";

export default function DAP() {
  return (
    <div className="min-h-screen bg-grain" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 py-16 sm:py-20 md:py-28 lg:py-32">
        {/* Network canvas background */}
        <div className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <NetworkCanvas />
        </div>

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--color-bg)]/60 via-transparent to-[var(--color-bg)]/80" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <FadeUp>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,71,87,0.2)] bg-[rgba(255,71,87,0.1)]">
                <Plane className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-primary)' }}>
                  Travel Expense Tracker
                </span>
              </div>
            </FadeUp>
            
            <FadeUp delay={0.1}>
              <h1 className="mt-5 text-[clamp(2.25rem,5.5vw,4.25rem)] font-bold leading-[1.08] tracking-[-0.035em]">
                <span className="text-gradient-primary">Double Apple Pay</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="mt-6 text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Split expenses with friends. Track payments in real-time. Settle up fairly.
              </p>
            </FadeUp>

            <FadeUp delay={0.25}>
              <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                The smart way to manage group expenses while traveling with multi-currency support and optimized settlements.
              </p>
            </FadeUp>
            
            <FadeUp delay={0.3}>
              <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Link
                  href="https://tripsplit.vercel.app"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-[15px] font-semibold rounded-lg transition-all btn-retro"
                  style={{ 
                    backgroundColor: 'var(--color-primary)',
                    color: 'white'
                  }}
                >
                  Try Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-[15px] font-semibold rounded-lg transition-all"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  Contact Us
                </Link>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <FadeUp>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-tight tracking-[-0.02em]" style={{ color: 'var(--color-text-primary)' }}>
                How It Works
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Three simple steps to split expenses with friends
              </p>
            </FadeUp>
          </div>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {[
              { num: 1, title: 'Create a Trip', desc: 'Set up a trip with your friends, choose your base currency, and add all travelers' },
              { num: 2, title: 'Add Expenses', desc: 'Log who paid for what in any currency. Split equally, custom, or between two people' },
              { num: 3, title: 'Settle Up', desc: 'See who owes whom with smart settlements that minimize the number of transactions' },
            ].map((step, i) => (
              <SlideIn key={step.num} delay={i * 0.1}>
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-[24px] font-bold mb-4"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                      color: 'white'
                    }}>
                    {step.num}
                  </div>
                  <h3 className="text-[17px] font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{step.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{step.desc}</p>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <FadeUp>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-tight tracking-[-0.02em]" style={{ color: 'var(--color-text-primary)' }}>
                Powerful Features
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Everything you need for hassle-free group expenses
              </p>
            </FadeUp>
          </div>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {[
              { icon: Globe, title: 'Multi-Currency Support', desc: 'Track expenses in 10+ currencies with automatic conversion to your base currency' },
              { icon: Calculator, title: 'Smart Calculations', desc: 'Flexible split options: equal, custom amounts, or between two people' },
              { icon: Users, title: 'Real-Time Balances', desc: 'Live tracking of who owes whom with color-coded balance indicators' },
              { icon: DollarSign, title: 'Optimized Settlements', desc: 'Minimize transactions with smart settlement suggestions' },
              { icon: Smartphone, title: 'Mobile-Friendly', desc: 'Fully responsive design works perfectly on phones, tablets, and desktops' },
              { icon: Plane, title: 'Trip Dashboard', desc: 'Clean interface to view all expenses, balances, and settlement suggestions' },
            ].map((feature, i) => (
              <SlideIn key={feature.title} delay={i * 0.05}>
                <div className="card-retro p-6">
                  <feature.icon className="h-9 w-9 mb-4" style={{ color: 'var(--color-primary)' }} />
                  <h3 className="text-[17px] font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{feature.title}</h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{feature.desc}</p>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="relative py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <FadeUp>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-tight tracking-[-0.02em]" style={{ color: 'var(--color-text-primary)' }}>
                Perfect For
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Simplify group expenses in any scenario
              </p>
            </FadeUp>
          </div>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {[
              { emoji: '✈️', title: 'Travel & Vacations', desc: 'Track hotel rooms, meals, activities, and transportation costs across multiple countries' },
              { emoji: '🏠', title: 'Shared Apartments', desc: 'Split rent, utilities, groceries, and household items among roommates' },
              { emoji: '🎉', title: 'Group Events', desc: 'Manage costs for dinners, parties, concerts, or any group activity' },
            ].map((useCase, i) => (
              <SlideIn key={useCase.title} delay={i * 0.1}>
                <div className="card-retro p-8 text-center">
                  <span className="text-5xl mb-4 block">{useCase.emoji}</span>
                  <h3 className="text-[17px] font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{useCase.title}</h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{useCase.desc}</p>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* Example Scenario */}
      <section className="relative py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="card-retro p-8 sm:p-12">
              <h3 className="text-[clamp(1.75rem,4vw,2rem)] font-bold mb-6 text-center" style={{ color: 'var(--color-text-primary)' }}>
                Real Example: Weekend Trip
              </h3>
              <div className="space-y-4 mb-8" style={{ color: 'var(--color-text-muted)' }}>
                <p>
                  <strong style={{ color: 'var(--color-text-primary)' }}>Alice</strong> paid for the Airbnb ($300),{' '}
                  <strong style={{ color: 'var(--color-text-primary)' }}>Bob</strong> bought groceries ($80), and{' '}
                  <strong style={{ color: 'var(--color-text-primary)' }}>Carol</strong> covered gas ($40).
                </p>
                <p>
                  Instead of figuring out 6 different payments, DAP calculates:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Bob owes Alice $93.33</li>
                  <li>Carol owes Alice $106.67</li>
                </ul>
                <p>
                  <strong style={{ color: 'var(--color-primary)' }}>Settled in just 2 transactions!</strong>
                </p>
              </div>
              <div className="text-center">
                <Link
                  href="https://tripsplit.vercel.app"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-[15px] font-semibold rounded-lg transition-all btn-retro"
                  style={{ 
                    backgroundColor: 'var(--color-primary)',
                    color: 'white'
                  }}
                >
                  Try the Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <FadeUp>
            <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em]" style={{ color: 'var(--color-text-primary)' }}>
              Ready to Simplify Group Expenses?
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-4 text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              Try DAP today and never argue about who owes whom again
            </p>
          </FadeUp>
          <FadeUp delay={0.2}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="https://tripsplit.vercel.app"
                target="_blank"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-[15px] font-semibold rounded-lg transition-all btn-retro"
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                  color: 'white'
                }}
              >
                Launch App
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-[15px] font-semibold rounded-lg transition-all"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                Contact Us
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </div>
  );
}
