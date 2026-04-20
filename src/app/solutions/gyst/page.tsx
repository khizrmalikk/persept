import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import Link from 'next/link';
import { ArrowRight, Briefcase, FileText, Target, Zap, BarChart3, Clock } from 'lucide-react';
import { NetworkCanvas } from "@/components/ui/network-canvas";
import { FadeUp, SlideIn } from "@/components/ui/scroll-animations";

export default function GYST() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20 md:py-28 lg:py-32">
        <div className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <NetworkCanvas />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]/80" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <FadeUp>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#b91c1c]/20 bg-[#b91c1c]/10">
                <Briefcase className="h-3.5 w-3.5 text-[#b91c1c]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b91c1c]">
                  Job Application Platform
                </span>
              </div>
            </FadeUp>
            
            <FadeUp delay={0.1}>
              <h1 className="mt-5 text-[clamp(2.25rem,5.5vw,4.25rem)] font-bold leading-[1.08] tracking-[-0.035em] text-white">
                GYST
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="mt-4 text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed text-white/50">
                Get Your Shit Together
              </p>
            </FadeUp>

            <FadeUp delay={0.25}>
              <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[#a3a3a3]">
                The AI-powered job application platform that finds jobs, customizes your CV, auto-applies, and tracks everything for you.
              </p>
            </FadeUp>
            
            <FadeUp delay={0.3}>
              <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Link
                  href="https://www.startgyst.com"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#b91c1c] text-white text-[15px] font-semibold rounded-lg hover:bg-[#991818] transition-all hover:shadow-[0_0_30px_rgba(185,28,28,0.3)]"
                >
                  Visit GYST
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/5 text-white text-[15px] font-semibold rounded-lg border border-white/10 hover:bg-white/10 transition-all"
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
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-tight tracking-[-0.02em] text-white">
                How GYST Works
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-3 text-[15px] leading-relaxed text-[#a3a3a3]">
                Four simple steps to streamline your job search
              </p>
            </FadeUp>
          </div>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-4">
            {[
              { num: 1, title: 'Set Criteria', desc: 'Define your ideal job: role, location, salary, remote options, industry' },
              { num: 2, title: 'AI Finds Jobs', desc: 'Our AI scans thousands of job boards and matches opportunities to your criteria' },
              { num: 3, title: 'Custom CVs', desc: 'AI creates tailored CVs for each job, highlighting relevant skills and experience' },
              { num: 4, title: 'Auto-Apply & Track', desc: 'Applications submitted automatically. Track status, responses, and interviews in one place' },
            ].map((step, i) => (
              <SlideIn key={step.num} delay={i * 0.1}>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(185,28,28,0.1)] text-[20px] font-bold text-[#b91c1c] mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-[17px] font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-[13px] leading-relaxed text-[#a3a3a3]">{step.desc}</p>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-16 sm:py-20 md:py-24 bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <FadeUp>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-tight tracking-[-0.02em] text-white">
                Powerful Features
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-3 text-[15px] leading-relaxed text-[#a3a3a3]">
                Everything you need to land your dream job
              </p>
            </FadeUp>
          </div>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {[
              { icon: Target, title: 'Smart Job Matching', desc: 'AI-powered algorithm finds jobs that perfectly match your skills, experience, and preferences' },
              { icon: FileText, title: 'Dynamic CV Generation', desc: 'Each CV is tailored to the specific job requirements, highlighting your most relevant qualifications' },
              { icon: Zap, title: 'Automated Applications', desc: 'Apply to dozens of jobs while you sleep. Our AI handles forms, uploads, and submissions' },
              { icon: BarChart3, title: 'Application Tracking', desc: 'Dashboard to monitor all applications, responses, interview schedules, and follow-ups' },
              { icon: Clock, title: '24/7 Job Monitoring', desc: 'Continuous scanning of job boards ensures you never miss a new opportunity' },
              { icon: Briefcase, title: 'Multi-Platform Support', desc: 'Integrate with LinkedIn, Indeed, Glassdoor, and hundreds of other job platforms' },
            ].map((feature, i) => (
              <SlideIn key={feature.title} delay={i * 0.05}>
                <div className="rounded-2xl border border-[#262626] bg-[#0a0a0a] p-6 transition-all duration-300 hover:border-[#b91c1c]/30 hover:shadow-[0_0_30px_rgba(185,28,28,0.1)]">
                  <feature.icon className="h-9 w-9 text-[#b91c1c] mb-4" />
                  <h3 className="text-[17px] font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-[14px] leading-relaxed text-[#a3a3a3]">{feature.desc}</p>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4 text-center">
            {[
              { value: '10x', label: 'More applications' },
              { value: '80%', label: 'Time saved' },
              { value: '3x', label: 'Interview rate' },
              { value: '24/7', label: 'Job hunting' },
            ].map((stat, i) => (
              <SlideIn key={stat.label} delay={i * 0.1}>
                <div>
                  <div className="text-[clamp(2rem,4vw,3rem)] font-bold text-[#b91c1c] mb-2">
                    {stat.value}
                  </div>
                  <p className="text-[14px] text-[#a3a3a3]">{stat.label}</p>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-2xl border border-[#262626] bg-[#0a0a0a] p-8 sm:p-12">
            <FadeUp>
              <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-white">
                Ready to Get Your Shit Together?
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-4 text-[15px] leading-relaxed text-[#a3a3a3] max-w-2xl mx-auto">
                Join the waitlist for early access to GYST
              </p>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Link
                  href="https://www.startgyst.com"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#b91c1c] text-white text-[15px] font-semibold rounded-lg hover:bg-[#991818] transition-all hover:shadow-[0_0_30px_rgba(185,28,28,0.3)]"
                >
                  Visit GYST
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/5 text-white text-[15px] font-semibold rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                >
                  Contact Us
                </Link>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
