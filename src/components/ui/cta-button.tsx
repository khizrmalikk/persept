import { cn } from "@/lib/utils";

const CALENDLY_URL = "https://calendly.com/persept/consultation";

interface CTAButtonProps {
  variant?: "primary" | "secondary";
  size?: "default" | "lg";
  className?: string;
  children: React.ReactNode;
}

export function CTAButton({
  variant = "primary",
  size = "default",
  className,
  children,
}: CTAButtonProps) {
  return (
    <a
      href={CALENDLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200",
        variant === "primary" && "bg-[#b91c1c] text-white hover:bg-[#991b1b]",
        variant === "secondary" &&
          "border border-[#e4e8ef] bg-white text-[#0c1222] hover:bg-[#f7f8fa]",
        size === "default" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-7 py-3.5 text-[15px]",
        className,
      )}
    >
      {children}
    </a>
  );
}
