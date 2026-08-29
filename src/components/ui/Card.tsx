import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        group
        rounded-3xl
        border
        border-slate-200
        bg-white
        shadow-[0_8px_30px_rgba(1,0,102,0.04)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-[#010066]/20
        hover:shadow-[0_18px_45px_rgba(1,0,102,0.09)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}