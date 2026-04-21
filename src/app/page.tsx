import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import Link from 'next/link';
import { ArrowRight, Bot, Briefcase, Plane, Sparkles, Zap, Target, Settings, Rocket, TrendingUp } from 'lucide-react';
import { NetworkCanvas } from "@/components/ui/network-canvas";
import { FadeUp, SlideIn, GlowPulse, AnimatedCounter } from "@/components/ui/scroll-animations";
import { InteractiveDemo } from "@/components/ui/interactive-demo";

export default function Home() {
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
              <p className="text-[12px] font-medium uppercase tracking-[0.15em]" style={{ color: 'var(--color-primary)' }}>
                AI Workforce Solutions
              </p>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 className="mt-5 text-[clamp(2.25rem,5.5vw,4.25rem)] font-bold leading-[1.08] tracking-[-0.035em]" style={{ color: 'var(--color-text-primary)' }}>
                Problems Fixed with Agents.
                <br />
                <span className="text-gradient-primary">Workforces Built with AI.</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                We don't just automate tasks—we build AI workforces that solve real business problems, save time, and drive revenue.
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="mt-8 sm:mt-10">
                <Link
                  href="#solutions"
                  className="btn-retro inline-flex items-center gap-2 text-[15px]"
                >
                  Explore Solutions
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </FadeUp>

            <FadeUp delay={0.4}>
              <div className="mt-10 sm:mt-14 flex flex-col items-center gap-3 sm:gap-4 md:flex-row md:justify-center md:gap-8">
                {[
                  { icon: Sparkles, value: 3, suffix: "", label: "AI Solutions" },
                  { icon: Zap, value: 24, suffix: "/7", label: "Automation" },
                  { icon: Target, value: 100, suffix: "%", label: "ROI Focus" },
                ].map((stat) => (
                  <GlowPulse key={stat.label}>
                    <div 
                      className="flex items-center gap-3 rounded-full px-5 py-2.5 transition-all duration-[var(--transition-base)] hover:scale-105"
                      style={{ 
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)'
                      }}
                    >
                      <stat.icon className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                      <span className="text-[15px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        <AnimatedCounter
                          value={stat.value}
                          suffix={stat.suffix}
                        />
                      </span>
                      <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</span>
                    </div>
                  </GlowPulse>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Interactive Visual Demo */}
      <section className="relative -mt-8 sm:-mt-12">
        <InteractiveDemo />
      </section>

      {/* Solutions Showcase */}
      <section id="solutions" className="relative py-16 sm:py-20 md:py-24 bg-dots">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
            <FadeUp>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-primary)' }}>
                Our Solutions
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="mt-2 text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-tight tracking-[-0.02em]" style={{ color: 'var(--color-text-primary)' }}>
                AI Workforces for Real Problems
              </h2>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Each solution is a custom-built workforce designed to tackle specific business challenges
              </p>
            </FadeUp>
          </div>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {/* GYST Card */}
            <SlideIn delay={0}>
              <div className="card-retro glow-hover group h-full flex flex-col">
                <div 
                  className="flex h-11 w-11 items-center justify-center rounded-xl mb-5"
                  style={{ backgroundColor: 'rgba(255, 71, 87, 0.1)' }}
                >
                  <Briefcase className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                </div>
                
                <h3 className="text-[20px] font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>GYST</h3>
                <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-muted)' }}>Job Application Platform</p>
                
                <p className="text-[15px] leading-relaxed mb-6 flex-grow" style={{ color: 'var(--color-text-secondary)' }}>
                  Find jobs that match your criteria, create custom CVs tailored to each role, auto-apply, and track all your applications in one place.
                </p>

                <div className="space-y-2 mb-6">
                  {['Smart job matching', 'AI-powered CV customization', 'Automated applications', 'Application tracking'].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                      <div className="h-1 w-1 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-auto">
                  <Link
                    href="https://www.startgyst.com"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-[14px] font-medium transition-colors"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Visit Site
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/solutions/gyst"
                    className="inline-flex items-center gap-1.5 text-[14px] font-medium transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </SlideIn>

            {/* DAP Card */}
            <SlideIn delay={0.1}>
              <div className="card-retro glow-hover group h-full flex flex-col">
                <div 
                  className="flex h-11 w-11 items-center justify-center rounded-xl mb-5"
                  style={{ backgroundColor: 'rgba(255, 71, 87, 0.1)' }}
                >
                  <Plane className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                </div>
                
                <h3 className="text-[20px] font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Double Apple Pay</h3>
                <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-muted)' }}>Travel Expense Tracker</p>
                
                <p className="text-[15px] leading-relaxed mb-6 flex-grow" style={{ color: 'var(--color-text-secondary)' }}>
                  Split expenses with friends and groups while traveling. Track who paid what, support multiple currencies, and settle up with smart calculations.
                </p>

                <div className="space-y-2 mb-6">
                  {['Multi-currency support', 'Smart expense splitting', 'Real-time balance tracking', 'Optimized settlements'].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                      <div className="h-1 w-1 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                      {feature}
                    </div>
                  ))}
                </div>

                <Link
                  href="/solutions/dap"
                  className="inline-flex items-center gap-1.5 text-[14px] font-medium transition-colors mt-auto"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Learn More
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </SlideIn>

            {/* Hotel AI Workforce Card */}
            <SlideIn delay={0.2}>
              <div className="card-retro glow-hover group h-full flex flex-col">
                <div 
                  className="flex h-11 w-11 items-center justify-center rounded-xl mb-5"
                  style={{ backgroundColor: 'rgba(255, 71, 87, 0.1)' }}
                >
                  <Bot className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                </div>
                
                <h3 className="text-[20px] font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Hotel AI Workforce</h3>
                <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-muted)' }}>Hospitality Automation</p>
                
                <p className="text-[15px] leading-relaxed mb-6 flex-grow" style={{ color: 'var(--color-text-secondary)' }}>
                  AI agents that handle guest communication, manage reviews, and automate hotel operations 24/7. Meet Sarah and Marcus.
                </p>

                <div className="space-y-2 mb-6">
                  {['Automated guest communication', 'Review management', '24/7 availability', 'PMS integration'].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                      <div className="h-1 w-1 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                      {feature}
                    </div>
                  ))}
                </div>

                <Link
                  href="/hotel"
                  className="inline-flex items-center gap-1.5 text-[14px] font-medium transition-colors mt-auto"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Learn More
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* Why Persept */}
      <section className="relative py-16 sm:py-20 md:py-24" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <FadeUp>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-tight tracking-[-0.02em]" style={{ color: 'var(--color-text-primary)' }}>
                Why Persept?
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                We build AI workforces that solve real problems
              </p>
            </FadeUp>
          </div>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {[
              { icon: Bot, title: 'Agent-Driven', desc: 'Intelligent AI agents that learn, adapt, and improve over time' },
              { icon: Settings, title: 'Custom Built', desc: 'Tailored solutions designed for your specific business needs' },
              { icon: TrendingUp, title: 'Real Results', desc: 'Measurable impact on efficiency, revenue, and customer satisfaction' },
            ].map((point, i) => (
              <SlideIn key={point.title} delay={i * 0.1}>
                <div className="card-retro glow-hover p-6 text-center">
                  <div 
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl mb-4"
                    style={{ backgroundColor: 'rgba(255, 71, 87, 0.1)' }}
                  >
                    <point.icon className="h-7 w-7" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <h3 className="text-[17px] font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{point.title}</h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{point.desc}</p>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <FadeUp>
            <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em]" style={{ color: 'var(--color-text-primary)' }}>
              Ready to Build Your AI Workforce?
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-4 text-[15px] leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Let's discuss how Persept can transform your business with intelligent automation
            </p>
          </FadeUp>
          <FadeUp delay={0.2}>
            <div className="mt-8">
              <Link
                href="/contact"
                className="btn-retro inline-flex items-center gap-2 text-[15px]"
              >
                Get Started
                <Rocket className="h-4 w-4" />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </div>
  );
}
