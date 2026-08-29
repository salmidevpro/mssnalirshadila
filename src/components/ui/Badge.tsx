import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export default function Badge({
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-2
        rounded-full
        border
        border-[#FFAF2E]/20
        bg-[#FFAF2E]/10
        px-3.5
        py-2
        text-[10px]
        font-bold
        uppercase
        tracking-[0.18em]
        text-[#8A5A00]
        ${className}
      `}
    >
      {children}
    </span>
  );
}