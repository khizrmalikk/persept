"use client";

import { cn } from "@/lib/utils";

const CALENDLY_URL = "https://calendly.com/khizr-persept/30min";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (opts: { url: string }) => void;
    };
  }
}

interface CTAButtonProps {
  variant?: "primary" | "secondary";
  size?: "default" | "lg";
  className?: string;
  children: React.ReactNode;
  href?: string;
}

export function CTAButton({
  variant = "primary",
  size = "default",
  className,
  children,
  href,
}: CTAButtonProps) {
  const styles = cn(
    "group inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 cursor-pointer",
    variant === "primary" &&
      "bg-red-600 text-white hover:bg-red-700 hover:shadow-[0_0_30px_rgba(185,28,28,0.3)]",
    variant === "secondary" &&
      "border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white hover:border-white/20",
    size === "default" && "px-5 py-2.5 text-sm",
    size === "lg" && "px-7 py-3.5 text-[15px]",
    className,
  );

  if (href) {
    return (
      <a href={href} className={styles}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (window.Calendly) {
          window.Calendly.initPopupWidget({ url: CALENDLY_URL });
        }
      }}
      className={styles}
    >
      {children}
    </button>
  );
}
