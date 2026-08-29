import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  showArrow?: boolean;
  className?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[#010066] text-white shadow-[0_10px_30px_rgba(1,0,102,0.18)] hover:bg-[#00004D] hover:shadow-[0_15px_35px_rgba(1,0,102,0.25)]",

  secondary:
    "bg-[#FFAF2E] text-[#00004D] shadow-[0_10px_30px_rgba(255,175,46,0.20)] hover:bg-[#f5a51e] hover:shadow-[0_15px_35px_rgba(255,175,46,0.30)]",

  outline:
    "border border-[#010066]/20 bg-white text-[#010066] hover:border-[#010066]/40 hover:bg-[#010066] hover:text-white",

  ghost:
    "bg-transparent text-[#010066] hover:bg-[#010066]/5",
};

export default function Button({
  children,
  href,
  variant = "primary",
  showArrow = true,
  className = "",
}: ButtonProps) {
  const content = (
    <>
      <span className="relative z-10 whitespace-nowrap">{children}</span>

      {showArrow && (
        <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/10 transition-all duration-300 group-hover:bg-white/15">
          <ArrowUpRight
            size={15}
            strokeWidth={2.2}
            className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </span>
      )}

      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-500 group-hover:translate-x-full" />
    </>
  );

  const classes = `
    group
    relative
    inline-flex
    min-h-[48px]
    items-center
    justify-center
    gap-2
    overflow-hidden
    rounded-full
    px-6
    py-3
    text-sm
    font-bold
    transition-all
    duration-300
    hover:-translate-y-0.5
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-[#FFAF2E]
    focus-visible:ring-offset-2
    ${variants[variant]}
    ${className}
  `;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes}>
      {content}
    </button>
  );
}