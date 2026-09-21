"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";

const LINKS = [
  { href: "/projects/hotel", label: "Hotel AI" },
  { href: "/projects/gyst", label: "GYST" },
  { href: "/projects", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/projects") {
    // "Work" is active on the index but not the detail pages (which have their
    // own nav entry), keeping exactly one active item.
    return pathname === "/projects";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

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
        backgroundColor: scrolled ? "rgba(247,242,234,0.82)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled
          ? "1px solid var(--line)"
          : "1px solid transparent",
      }}
    >
      <nav
        className="shell flex h-16 items-center justify-between"
        aria-label="Primary"
      >
        {/* Wordmark */}
        <Link
          href="/"
          aria-label="Persept — home"
          className="group rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
        >
          <Logo lab />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => {
            const active = isActivePath(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className="group relative rounded-sm py-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
              >
                <span
                  className="inline-flex items-center gap-1.5 text-[14px]"
                  style={{ color: active ? "var(--ink)" : "var(--ink-soft)" }}
                >
                  {active && (
                    <span
                      className="h-1 w-1 rounded-full"
                      style={{ background: "var(--accent)" }}
                      aria-hidden="true"
                    />
                  )}
                  <span className={active ? undefined : "link-underline"}>
                    {l.label}
                  </span>
                </span>
              </Link>
            );
          })}
          <span
            aria-hidden="true"
            className="h-3.5 w-px"
            style={{ background: "var(--line-strong)" }}
          />
          <Link
            href="/login"
            className="group rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
          >
            <span
              className="link-underline text-[14px]"
              style={{ color: "var(--ink-soft)" }}
            >
              Sign in
            </span>
          </Link>
          <Link
            href="/contact"
            className="btn"
            style={{ padding: "0.6rem 1.05rem" }}
          >
            Start a project
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] md:hidden"
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
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
            }
            className="overflow-hidden md:hidden"
            style={{
              backgroundColor: "rgba(247,242,234,0.98)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <div className="shell flex flex-col gap-1 py-5">
              {LINKS.map((l) => {
                const active = isActivePath(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 border-b py-3.5"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  >
                    {active && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: "var(--accent)" }}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className="text-[18px]"
                      style={{
                        color: active ? "var(--ink)" : "var(--ink-soft)",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {l.label}
                    </span>
                  </Link>
                );
              })}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 border-b py-3.5"
                style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
              >
                <span className="text-[18px]">Sign in</span>
              </Link>
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
