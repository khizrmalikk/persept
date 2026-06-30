"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/logo";

const LINKS = [
  { href: "/projects", label: "Projects", index: "01" },
  { href: "/about", label: "Lab", index: "02" },
  { href: "/contact", label: "Contact", index: "03" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-[1200] transition-colors duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(244,242,236,0.82)" : "transparent",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(10px)" : "none",
        borderBottom: scrolled
          ? "1px solid var(--line)"
          : "1px solid transparent",
      }}
    >
      <nav className="shell flex h-16 items-center justify-between">
        {/* Wordmark */}
        <Link href="/" aria-label="Persept — home" className="group">
          <Logo lab />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-9 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center gap-2"
            >
              <span className="mono-label" style={{ fontSize: "0.625rem" }}>
                {l.index}
              </span>
              <span
                className="link-underline text-[14px]"
                style={{ color: "var(--ink)" }}
              >
                {l.label}
              </span>
            </Link>
          ))}
          <Link
            href="/contact"
            className="btn"
            style={{ padding: "0.6rem 1rem" }}
          >
            Start a project
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center md:hidden"
          style={{ color: "var(--ink)" }}
        >
          <div className="flex flex-col gap-[5px]">
            <span
              className="block h-[1.5px] w-5 transition-transform"
              style={{
                backgroundColor: "var(--ink)",
                transform: open ? "translateY(6.5px) rotate(45deg)" : "none",
              }}
            />
            <span
              className="block h-[1.5px] w-5 transition-opacity"
              style={{ backgroundColor: "var(--ink)", opacity: open ? 0 : 1 }}
            />
            <span
              className="block h-[1.5px] w-5 transition-transform"
              style={{
                backgroundColor: "var(--ink)",
                transform: open ? "translateY(-6.5px) rotate(-45deg)" : "none",
              }}
            />
          </div>
        </button>
      </nav>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden md:hidden"
            style={{
              backgroundColor: "rgba(244,242,236,0.97)",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <div className="shell flex flex-col gap-1 py-5">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-b py-3"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  <span className="mono-label" style={{ fontSize: "0.625rem" }}>
                    {l.index}
                  </span>
                  <span className="text-[18px]">{l.label}</span>
                </Link>
              ))}
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="btn mt-4 justify-center"
              >
                Start a project
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
