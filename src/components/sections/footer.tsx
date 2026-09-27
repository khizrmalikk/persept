import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ConsoleLabel } from "@/components/ui/console";
import { Logo } from "@/components/ui/logo";

const COLUMNS = [
  {
    title: "what we do",
    links: [
      { href: "/#what", label: "what it takes over" },
      { href: "/#proof", label: "persept runs on persept" },
      { href: "/projects/gyst", label: "GYST" },
      { href: "/projects", label: "all work" },
    ],
  },
  {
    title: "company",
    links: [
      { href: "/about", label: "about persept" },
      { href: "/contact", label: "book a 15-minute call" },
      { href: "/login", label: "client sign in" },
    ],
  },
];

const SOCIALS = [
  { href: "mailto:khizr@persept.ai", label: "khizr@persept.ai" },
  { href: "https://www.linkedin.com/company/persept", label: "LinkedIn" },
];

const READOUT = [
  { k: "workforce", v: "online", live: true },
  { k: "based in", v: "Dubai" },
  { k: "on the clock", v: "24/7" },
];

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--line)",
        backgroundColor: "var(--paper-2)",
      }}
    >
      <div className="shell py-16">
        {/* Live operational readout: the console echo, mirroring the hero */}
        <dl
          className="flex flex-wrap items-center gap-x-8 gap-y-3 pb-12"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          {READOUT.map((r) => (
            <div key={r.k} className="flex items-center gap-2">
              {r.live && <span className="live-dot" aria-hidden="true" />}
              <dt
                className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.12em]"
                style={{ color: "var(--ink-faint)" }}
              >
                {r.k}
              </dt>
              <dd className="text-[0.8125rem]" style={{ color: "var(--ink)" }}>
                {r.v}
              </dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-12 pt-12 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Logo lab size={26} />
            <p
              className="mt-5 max-w-xs text-[14px] leading-relaxed"
              style={{ color: "var(--ink-soft)" }}
            >
              an ai workforce studio. we set up named agents that take over the
              repetitive work of a small business, and ship our own products
              alongside.
            </p>
            <p className="mono-label mt-6">dubai · building since 2024</p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <ConsoleLabel>{col.title}</ConsoleLabel>
              <ul className="mt-5 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="link-underline text-[14px]"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-14 flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          <p className="mono-label">© {new Date().getFullYear()} Persept</p>
          <div className="flex flex-wrap items-center gap-5">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 text-[13px]"
                style={{ color: "var(--ink-soft)" }}
              >
                <span className="link-underline">{s.label}</span>
                <ArrowUpRight
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  style={{ color: "var(--ink-faint)" }}
                />
              </a>
            ))}
            <p className="mono-label">Agent teams · real operations</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
