'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X, Sparkles } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // Track scroll for elevation effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-[250ms] ${
        scrolled 
          ? 'bg-[rgba(22,33,62,0.7)] backdrop-blur-[12px] shadow-[0_4px_16px_rgba(15,52,96,0.3)]' 
          : 'bg-[rgba(22,33,62,0.6)] backdrop-blur-[12px]'
      } border-b border-[rgba(255,71,87,0.1)]`}
      style={{
        transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="container mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 group"
            style={{
              transition: 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div 
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(255,71,87,0.1)] group-hover:bg-[rgba(255,71,87,0.15)]"
              style={{
                transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <Sparkles className="h-5 w-5 text-[#ff4757]" />
            </div>
            <span 
              className="text-xl font-bold text-[#eeeeee] group-hover:text-[#ff4757]"
              style={{
                transition: 'color 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              Persept
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Hotel Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                className="flex items-center gap-1 text-[#a8b2d1] hover:text-[#eeeeee] font-medium"
                style={{
                  transition: 'color 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                Hotel AI Workforce
                <ChevronDown 
                  className={`w-4 h-4`}
                  style={{
                    transform: solutionsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              {solutionsOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-64 bg-[rgba(30,58,95,0.95)] backdrop-blur-[12px] border border-[rgba(255,71,87,0.2)] rounded-xl shadow-[0_8px_32px_rgba(15,52,96,0.4)] overflow-hidden"
                  style={{
                    animation: 'fadeInUp 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <Link
                    href="/hotel"
                    className="block px-6 py-4 text-[#a8b2d1] hover:text-[#eeeeee] hover:bg-[rgba(255,71,87,0.05)] border-b border-[rgba(255,71,87,0.1)]"
                    onClick={() => setSolutionsOpen(false)}
                    style={{
                      transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div className="font-semibold">Overview</div>
                    <div className="text-sm text-[#6b7a99] mt-1">AI agents for hotels</div>
                  </Link>
                  <Link
                    href="/solution"
                    className="block px-6 py-4 text-[#a8b2d1] hover:text-[#eeeeee] hover:bg-[rgba(255,71,87,0.05)] border-b border-[rgba(255,71,87,0.1)]"
                    onClick={() => setSolutionsOpen(false)}
                    style={{
                      transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div className="font-semibold">Our Solution</div>
                    <div className="text-sm text-[#6b7a99] mt-1">How it works</div>
                  </Link>
                  <Link
                    href="/pricing"
                    className="block px-6 py-4 text-[#a8b2d1] hover:text-[#eeeeee] hover:bg-[rgba(255,71,87,0.05)]"
                    onClick={() => setSolutionsOpen(false)}
                    style={{
                      transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div className="font-semibold">Pricing</div>
                    <div className="text-sm text-[#6b7a99] mt-1">Plans & ROI</div>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="https://www.startgyst.com"
              target="_blank"
              className="text-[#a8b2d1] hover:text-[#eeeeee] font-medium"
              style={{
                transition: 'color 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              GYST
            </Link>
            <Link 
              href="/solutions/dap" 
              className="text-[#a8b2d1] hover:text-[#eeeeee] font-medium"
              style={{
                transition: 'color 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              DAP
            </Link>

            <Link 
              href="/contact" 
              className="text-[#a8b2d1] hover:text-[#eeeeee] font-medium"
              style={{
                transition: 'color 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              Contact
            </Link>
            
            <Link
              href="/contact"
              className="px-6 py-2.5 bg-[#ff4757] text-white rounded-lg font-semibold hover:bg-[#ee5a6f] hover:shadow-[0_0_20px_rgba(255,71,87,0.3)] hover:-translate-y-0.5"
              style={{
                transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-[#eeeeee] p-2 hover:bg-[rgba(255,71,87,0.1)] rounded-lg"
            style={{
              transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div 
          className="md:hidden absolute top-16 left-0 right-0 bg-[rgba(22,33,62,0.98)] backdrop-blur-[12px] border-b border-[rgba(255,71,87,0.1)] shadow-[0_8px_32px_rgba(15,52,96,0.4)]"
          style={{
            animation: 'fadeInUp 250ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="container mx-auto px-6 py-4 space-y-1">
            <div className="space-y-1">
              <div className="text-[#6b7a99] text-xs font-bold uppercase tracking-wider px-4 py-2">
                Hotel AI Workforce
              </div>
              
              <div className="pl-2 space-y-1">
                <Link
                  href="/hotel"
                  className="block px-4 py-3 text-[#a8b2d1] hover:text-[#eeeeee] hover:bg-[rgba(255,71,87,0.05)] rounded-lg font-medium"
                  onClick={() => setIsOpen(false)}
                  style={{
                    transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  Overview
                </Link>
                <Link
                  href="/solution"
                  className="block px-4 py-3 text-[#a8b2d1] hover:text-[#eeeeee] hover:bg-[rgba(255,71,87,0.05)] rounded-lg font-medium"
                  onClick={() => setIsOpen(false)}
                  style={{
                    transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  Our Solution
                </Link>
                <Link
                  href="/pricing"
                  className="block px-4 py-3 text-[#a8b2d1] hover:text-[#eeeeee] hover:bg-[rgba(255,71,87,0.05)] rounded-lg font-medium mb-2"
                  onClick={() => setIsOpen(false)}
                  style={{
                    transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  Pricing
                </Link>
              </div>

              <Link
                href="https://www.startgyst.com"
                target="_blank"
                className="block px-4 py-3 text-[#a8b2d1] hover:text-[#eeeeee] hover:bg-[rgba(255,71,87,0.05)] rounded-lg font-medium"
                onClick={() => setIsOpen(false)}
                style={{
                  transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                GYST
              </Link>
              <Link
                href="/solutions/dap"
                className="block px-4 py-3 text-[#a8b2d1] hover:text-[#eeeeee] hover:bg-[rgba(255,71,87,0.05)] rounded-lg font-medium"
                onClick={() => setIsOpen(false)}
                style={{
                  transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                DAP
              </Link>
            </div>

            <Link
              href="/contact"
              className="block px-4 py-3 text-[#a8b2d1] hover:text-[#eeeeee] hover:bg-[rgba(255,71,87,0.05)] rounded-lg font-medium"
              onClick={() => setIsOpen(false)}
              style={{
                transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              Contact
            </Link>
            <Link
              href="/contact"
              className="block px-4 py-3 mx-4 mt-4 bg-[#ff4757] text-white rounded-lg font-semibold text-center hover:bg-[#ee5a6f] hover:shadow-[0_0_20px_rgba(255,71,87,0.3)]"
              onClick={() => setIsOpen(false)}
              style={{
                transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
