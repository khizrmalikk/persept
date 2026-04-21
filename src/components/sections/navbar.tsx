'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X, Sparkles } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSolutionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
      <div className="container mx-auto px-6 py-3.5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(185,28,28,0.1)] group-hover:bg-[rgba(185,28,28,0.15)] transition-colors">
              <Sparkles className="h-4 w-4 text-[#b91c1c]" />
            </div>
            <span className="text-xl font-bold text-white group-hover:text-[#b91c1c] transition-colors">
              Persept
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Hotel Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
              >
                Hotel AI Workforce
                <ChevronDown className={`w-4 h-4 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {solutionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden">
                  <Link
                    href="/hotel"
                    className="block px-6 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all border-b border-white/5"
                    onClick={() => setSolutionsOpen(false)}
                  >
                    <div className="font-medium">Overview</div>
                    <div className="text-xs text-white/50 mt-0.5">AI agents for hotels</div>
                  </Link>
                  <Link
                    href="/solution"
                    className="block px-6 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all border-b border-white/5"
                    onClick={() => setSolutionsOpen(false)}
                  >
                    <div className="font-medium">Our Solution</div>
                    <div className="text-xs text-white/50 mt-0.5">How it works</div>
                  </Link>
                  <Link
                    href="/pricing"
                    className="block px-6 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all"
                    onClick={() => setSolutionsOpen(false)}
                  >
                    <div className="font-medium">Pricing</div>
                    <div className="text-xs text-white/50 mt-0.5">Plans & ROI</div>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="https://www.startgyst.com"
              target="_blank"
              className="text-white/80 hover:text-white transition-colors"
            >
              GYST
            </Link>
            <Link href="/solutions/dap" className="text-white/80 hover:text-white transition-colors">
              DAP
            </Link>

            <Link href="/contact" className="text-white/80 hover:text-white transition-colors">
              Contact
            </Link>
            
            <Link
              href="/contact"
              className="px-6 py-2.5 bg-[#b91c1c] text-white rounded-lg font-medium hover:bg-[#991818] transition-all hover:shadow-[0_0_20px_rgba(185,28,28,0.3)]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2">
            <div className="space-y-1">
              <div className="text-white/60 text-xs font-semibold uppercase tracking-wider px-4 py-2">
                Hotel AI Workforce
              </div>
              
              <div className="pl-4 space-y-1">
                <Link
                  href="/hotel"
                  className="block px-6 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Overview
                </Link>
                <Link
                  href="/solution"
                  className="block px-6 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Our Solution
                </Link>
                <Link
                  href="/pricing"
                  className="block px-6 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded transition-all mb-2"
                  onClick={() => setIsOpen(false)}
                >
                  Pricing
                </Link>
              </div>

              <Link
                href="https://www.startgyst.com"
                target="_blank"
                className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded transition-all"
                onClick={() => setIsOpen(false)}
              >
                GYST
              </Link>
              <Link
                href="/solutions/dap"
                className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded transition-all"
                onClick={() => setIsOpen(false)}
              >
                DAP
              </Link>
            </div>

            <Link
              href="/contact"
              className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded transition-all"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/contact"
              className="block px-4 py-2 mx-4 mt-4 bg-[#b91c1c] text-white rounded-lg font-medium text-center hover:bg-[#991818] transition-all"
              onClick={() => setIsOpen(false)}
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
