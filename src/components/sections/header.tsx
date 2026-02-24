"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CTAButton } from "@/components/ui/cta-button";

const navLinks = [
  { href: "#problem", label: "Challenges" },
  { href: "#solution", label: "AI Agents" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#social-proof", label: "Results" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-50 transition-all duration-200",
        scrolled
          ? "border-b border-[#e4e8ef] bg-white/95 backdrop-blur-sm"
          : "bg-white",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <a href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo_persept_red.png"
            alt="Persept"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <div className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-bold tracking-tight text-[#0c1222]">
              Persept
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.12em] text-[#5a6785] sm:inline">
              AI Workforce
            </span>
          </div>
        </a>

        <nav className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-[13px] font-medium text-[#5a6785] transition-colors hover:text-[#0c1222]"
            >
              {link.label}
            </a>
          ))}
          <div className="ml-3 h-5 w-px bg-[#e4e8ef]" />
          <CTAButton className="ml-3" size="default">
            Book Free Consultation
          </CTAButton>
        </nav>

        <button
          type="button"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#e4e8ef] bg-white transition-colors hover:bg-[#f7f8fa] md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-4 w-4 text-[#0c1222]" />
          ) : (
            <Menu className="h-4 w-4 text-[#0c1222]" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#e4e8ef] bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3.5 py-2.5 text-[14px] font-medium text-[#5a6785] transition-colors hover:bg-[#f7f8fa] hover:text-[#0c1222]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
          <CTAButton className="mt-4 w-full justify-center" size="default">
            Book Free Consultation
          </CTAButton>
        </div>
      )}
    </header>
  );
}
