import Image from "next/image";

interface OrnamentalDividerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function OrnamentalDivider({
  className = "",
  size = "md",
}: OrnamentalDividerProps) {
  const mandalaSize = { sm: 24, md: 36, lg: 48 }[size];
  const lineWidth = { sm: "max-w-16", md: "max-w-24", lg: "max-w-32" }[size];

  return (
    <div
      className={`flex items-center justify-center gap-3 ${className}`}
    >
      <div
        className={`h-px flex-1 ${lineWidth} bg-gradient-to-r from-transparent to-temple-gold/40`}
      />
      <div className="relative" style={{ width: mandalaSize, height: mandalaSize }}>
        <Image
          src="/assets/mandala-pattern.png"
          alt=""
          fill
          className="object-contain opacity-100"
          sizes={`${mandalaSize}px`}
          aria-hidden="true"
        />
      </div>
      <div
        className={`h-px flex-1 ${lineWidth} bg-gradient-to-l from-transparent to-temple-gold/40`}
      />
    </div>
  );
}
