import Image from "next/image";

type Position = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center" | "top-center" | "bottom-center";

interface MandalaDecorationProps {
  position: Position;
  mobilePosition?: Position;
  size?: number;
  mobileSize?: number;
  opacity?: number;
  mobileOpacity?: number;
  rotate?: number;
  spin?: boolean;
}

const positionClasses: Record<string, string> = {
  "top-right": "-top-24 -right-24",
  "top-left": "-top-24 -left-24",
  "bottom-right": "-bottom-24 -right-24",
  "bottom-left": "-bottom-24 -left-24",
  "top-center": "-top-1/2 left-1/2 -translate-x-1/2",
  "bottom-center": "-bottom-1/2 left-1/2 -translate-x-1/2",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

export default function MandalaDecoration({
  position,
  mobilePosition,
  size = 400,
  mobileSize = 400,
  opacity = 0.1,
  mobileOpacity,
  rotate = 0,
  spin = false,
}: MandalaDecorationProps) {
  const hasMobileOverride = mobilePosition || mobileSize || mobileOpacity;

  if (!hasMobileOverride) {
    return (
      <div
        className={`absolute ${positionClasses[position]} pointer-events-none ${spin ? "animate-mandala-spin" : ""}`}
        style={{
          width: size,
          height: size,
          opacity,
          transform: spin ? undefined : `rotate(${rotate}deg)`,
        }}
      >
        <Image
          src="/assets/mandala-pattern.png"
          alt=""
          fill
          className="object-contain"
          sizes={`${size}px`}
          aria-hidden="true"
        />
      </div>
    );
  }

  const mPos = mobilePosition || position;
  const mSize = mobileSize || size;
  const mOpacity = mobileOpacity ?? opacity;

  return (
    <>
      {/* Mobile */}
      <div
        className={`absolute ${positionClasses[mPos]} pointer-events-none md:hidden ${spin ? "animate-mandala-spin" : ""}`}
        style={{
          width: mSize,
          height: mSize,
          opacity: mOpacity,
          transform: spin ? undefined : `rotate(${rotate}deg)`,
        }}
      >
        <Image
          src="/assets/mandala-pattern.png"
          alt=""
          fill
          className="object-contain"
          sizes={`${mSize}px`}
          aria-hidden="true"
        />
      </div>

      {/* Desktop */}
      <div
        className={`absolute ${positionClasses[position]} pointer-events-none hidden md:block ${spin ? "animate-mandala-spin" : ""}`}
        style={{
          width: size,
          height: size,
          opacity,
          transform: spin ? undefined : `rotate(${rotate}deg)`,
        }}
      >
        <Image
          src="/assets/mandala-pattern.png"
          alt=""
          fill
          className="object-contain"
          sizes={`${size}px`}
          aria-hidden="true"
        />
      </div>
    </>
  );
}
