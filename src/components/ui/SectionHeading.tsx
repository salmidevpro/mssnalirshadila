import type { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  centered?: boolean;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: SectionHeadingProps) {
  return (
    <div
      className={
        centered
          ? "mx-auto max-w-2xl text-center"
          : "max-w-2xl"
      }
    >
      {eyebrow && (
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFAF2E]">
          {eyebrow}
        </p>
      )}

      <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-[#00004D] sm:text-4xl lg:text-[2.7rem]">
        {title}
      </h2>

      {description && (
        <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}