'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            Persept
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Solutions Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
              >
                Solutions
                <ChevronDown className={`w-4 h-4 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {solutionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden">
                  {/* Hotel AI Workforce - with nested menu */}
                  <div className="border-b border-white/5">
                    <div className="px-4 py-3 text-white/60 text-xs font-semibold uppercase tracking-wider">
                      Hotel AI Workforce
                    </div>
                    <Link
                      href="/hotel"
                      className="block px-6 py-2.5 text-white/80 hover:text-white hover:bg-white/5 transition-all"
                      onClick={() => setSolutionsOpen(false)}
                    >
                      Overview
                    </Link>
                    <Link
                      href="/hotel/sarah"
                      className="block px-6 py-2.5 text-white/80 hover:text-white hover:bg-white/5 transition-all"
                      onClick={() => setSolutionsOpen(false)}
                    >
                      Meet Sarah
                    </Link>
                    <Link
                      href="/hotel/marcus"
                      className="block px-6 py-2.5 text-white/80 hover:text-white hover:bg-white/5 transition-all mb-2"
                      onClick={() => setSolutionsOpen(false)}
                    >
                      Meet Marcus
                    </Link>
                  </div>

                  {/* GYST */}
                  <Link
                    href="https://www.startgyst.com"
                    target="_blank"
                    className="block px-6 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all border-b border-white/5"
                    onClick={() => setSolutionsOpen(false)}
                  >
                    <div className="font-medium">GYST</div>
                    <div className="text-xs text-white/50 mt-0.5">Job Application Platform</div>
                  </Link>

                  {/* DAP */}
                  <Link
                    href="/solutions/dap"
                    className="block px-6 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all"
                    onClick={() => setSolutionsOpen(false)}
                  >
                    <div className="font-medium">Double Apple Pay</div>
                    <div className="text-xs text-white/50 mt-0.5">Travel Expense Tracker</div>
                  </Link>
                </div>
              )}
            </div>

            <Link href="/about" className="text-white/80 hover:text-white transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-white/80 hover:text-white transition-colors">
              Contact
            </Link>
            
            <Link
              href="/contact"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
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
                Solutions
              </div>
              
              <div className="pl-4 space-y-1">
                <div className="text-white/50 text-xs px-4 py-1">Hotel AI Workforce</div>
                <Link
                  href="/hotel"
                  className="block px-8 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Overview
                </Link>
                <Link
                  href="/hotel/sarah"
                  className="block px-8 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Meet Sarah
                </Link>
                <Link
                  href="/hotel/marcus"
                  className="block px-8 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded transition-all mb-2"
                  onClick={() => setIsOpen(false)}
                >
                  Meet Marcus
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
                Double Apple Pay
              </Link>
            </div>

            <Link
              href="/about"
              className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded transition-all"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded transition-all"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/contact"
              className="block px-4 py-2 mx-4 mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium text-center"
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
