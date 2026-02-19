"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { OverlayScrollbars } from "overlayscrollbars";
import "overlayscrollbars/overlayscrollbars.css";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // OverlayScrollbars — auto-hide scrollbar, only visible while scrolling
    const osInstance = OverlayScrollbars(document.body, {
      scrollbars: {
        autoHide: "scroll",
        autoHideDelay: 500,
        theme: "os-theme-dark",
      },
      overflow: {
        x: "hidden",
      },
    });

    return () => {
      lenis.destroy();
      osInstance.destroy();
    };
  }, []);

  return <>{children}</>;
}
