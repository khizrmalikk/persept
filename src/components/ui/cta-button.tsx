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
    "group inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200 cursor-pointer",
    variant === "primary" && "bg-[#b91c1c] text-white hover:bg-[#991b1b]",
    variant === "secondary" &&
      "border border-[#e4e8ef] bg-white text-[#0c1222] hover:bg-[#f7f8fa]",
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
