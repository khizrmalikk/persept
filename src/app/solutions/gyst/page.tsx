import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import Link from 'next/link';
import { ArrowRight, Briefcase, FileText, Target, Zap, BarChart3, Clock } from 'lucide-react';

export default function GYST() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-black to-cyan-950" />
        
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-6">
            <Briefcase className="w-4 h-4" />
            Job Application Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            GYST
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-4 max-w-3xl mx-auto">
            Get Your Shit Together
          </p>
          <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto">
            The AI-powered job application platform that finds jobs, customizes your CV, auto-applies, and tracks everything for you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://www.startgyst.com"
              target="_blank"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg font-medium rounded-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all"
            >
              Visit GYST
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
              How GYST Works
            </h2>
            <p className="text-xl text-white/60">
              Four simple steps to streamline your job search
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Set Criteria</h3>
              <p className="text-white/60 text-sm">
                Define your ideal job: role, location, salary, remote options, industry
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Finds Jobs</h3>
              <p className="text-white/60 text-sm">
                Our AI scans thousands of job boards and matches opportunities to your criteria
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Custom CVs</h3>
              <p className="text-white/60 text-sm">
                AI creates tailored CVs for each job, highlighting relevant skills and experience
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Auto-Apply & Track</h3>
              <p className="text-white/60 text-sm">
                Applications submitted automatically. Track status, responses, and interviews in one place
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-transparent to-blue-950/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-white/60">
              Everything you need to land your dream job
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <Target className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Smart Job Matching</h3>
              <p className="text-white/60">
                AI-powered algorithm finds jobs that perfectly match your skills, experience, and preferences
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <FileText className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Dynamic CV Generation</h3>
              <p className="text-white/60">
                Each CV is tailored to the specific job requirements, highlighting your most relevant qualifications
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <Zap className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Automated Applications</h3>
              <p className="text-white/60">
                Apply to dozens of jobs while you sleep. Our AI handles forms, uploads, and submissions
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <BarChart3 className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Application Tracking</h3>
              <p className="text-white/60">
                Dashboard to monitor all applications, responses, interview schedules, and follow-ups
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <Clock className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">24/7 Job Monitoring</h3>
              <p className="text-white/60">
                Continuous scanning of job boards ensures you never miss a new opportunity
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <Briefcase className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Multi-Platform Support</h3>
              <p className="text-white/60">
                Integrate with LinkedIn, Indeed, Glassdoor, and hundreds of other job platforms
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                10x
              </div>
              <p className="text-white/60">More applications</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                80%
              </div>
              <p className="text-white/60">Time saved</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                3x
              </div>
              <p className="text-white/60">Interview rate</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <p className="text-white/60">Job hunting</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm border border-white/10 rounded-3xl p-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Get Your Shit Together?
            </h2>
            <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
              Join the waitlist for early access to GYST
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="https://www.startgyst.com"
                target="_blank"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg font-medium rounded-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all"
              >
                Visit GYST
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
        </div>
      </section>

      <Footer />
    </div>
  );
}
