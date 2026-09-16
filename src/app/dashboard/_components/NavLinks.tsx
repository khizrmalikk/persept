"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ pending }: { pending: number }) {
  const p = usePathname();
  const is = (h: string) => (h === "/dashboard" ? p === "/dashboard" : p.startsWith(h));
  return (
    <>
      <Link className={`link ${is("/dashboard") ? "active" : ""}`} href="/dashboard">office</Link>
      <Link className={`link ${is("/dashboard/activity") ? "active" : ""}`} href="/dashboard/activity">activity</Link>
      <Link className={`link ${is("/dashboard/approvals") ? "active" : ""}`} href="/dashboard/approvals">
        approvals{pending > 0 && <span className="badge">{pending}</span>}
      </Link>
    </>
  );
}
