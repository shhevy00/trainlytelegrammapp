"use client";

import Image from "next/image";
import { useState, type ReactElement } from "react";

interface OverviewDecorImageProps {
  src: string;
  variant?: "hero" | "empty";
}

export function OverviewDecorImage({ src, variant = "hero" }: OverviewDecorImageProps): ReactElement | null {
  const [hidden, setHidden] = useState(false);
  const imagePath = src.split("?")[0] ?? src;

  if (hidden) return null;

  if (variant === "hero") {
    return (
      <div className="overview-hero-decor" aria-hidden>
        <div className="overview-hero-rings" />
        <div className="overview-hero-decor-frame relative h-[min(52vw,220px)] w-full max-w-[380px]">
          <Image
            src={imagePath}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 480px) 90vw, 380px"
            className="overview-hero-decor-img object-contain"
            onError={() => setHidden(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overview-empty-decor relative mx-auto h-[min(40vw,180px)] w-full max-w-[480px]" aria-hidden>
      <Image
        src={imagePath}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 480px) 95vw, 480px"
        className="overview-empty-decor-img object-contain"
        onError={() => setHidden(true)}
      />
    </div>
  );
}
