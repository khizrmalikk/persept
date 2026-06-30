import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const COLUMNS = [
  {
    title: "Work",
    links: [
      { href: "/projects", label: "All projects" },
      { href: "/projects/gyst", label: "GYST" },
      { href: "/projects/hotel", label: "Hotel AI" },
      { href: "/projects/dap", label: "DAP" },
    ],
  },
  {
    title: "Lab",
    links: [
      { href: "/about", label: "About the lab" },
      { href: "/about#process", label: "How we build" },
      { href: "/contact", label: "Start a project" },
    ],
  },
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
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Logo lab size={26} />
            <p
              className="mt-4 max-w-xs text-[14px] leading-relaxed"
              style={{ color: "var(--ink-soft)" }}
            >
              A software innovation lab. We turn real-world problems into
              products worth shipping.
            </p>
            <p className="mono-label mt-6">Dubai · Building since 2024</p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mono-label">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
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
          className="mt-14 flex flex-col items-start justify-between gap-3 pt-6 sm:flex-row sm:items-center"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          <p className="mono-label">© {new Date().getFullYear()} Persept Lab</p>
          <p className="mono-label">Problems in · Products out</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
