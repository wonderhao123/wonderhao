"use client";

import { useEffect } from "react";

/** One delegated listener also covers cards mounted later inside dialogs. */
export function CardLighting() {
  useEffect(() => {
    const hover = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let active: HTMLElement | null = null;
    let frame = 0;
    let point = { x: 0, y: 0 };

    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      active?.removeAttribute("data-card-lit");
      active = null;
    };

    const move = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>("[data-card-surface]") ?? null;
      if (
        event.pointerType !== "mouse" ||
        !hover.matches ||
        motion.matches ||
        target?.closest('[data-reduced-motion="true"], [inert]') ||
        !card
      ) {
        clear();
        return;
      }
      if (card !== active) {
        clear();
        active = card;
      }
      point = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!active?.isConnected) return clear();
        const rect = active.getBoundingClientRect();
        if (!rect.width || !rect.height) return clear();
        // Scale into local coordinates for the tilted World Pass, too.
        const x = ((point.x - rect.left) / rect.width) * active.offsetWidth;
        const y = ((point.y - rect.top) / rect.height) * active.offsetHeight;
        active.style.setProperty("--card-x", `${x}px`);
        active.style.setProperty("--card-y", `${y}px`);
        active.setAttribute("data-card-lit", "true");
      });
    };

    const leave = (event: PointerEvent) => {
      if (!event.relatedTarget) clear();
    };
    const down = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") clear();
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointerout", leave, { passive: true });
    document.addEventListener("pointercancel", clear);
    document.addEventListener("scroll", clear, true);
    window.addEventListener("blur", clear);
    hover.addEventListener("change", clear);
    motion.addEventListener("change", clear);
    return () => {
      clear();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("pointercancel", clear);
      document.removeEventListener("scroll", clear, true);
      window.removeEventListener("blur", clear);
      hover.removeEventListener("change", clear);
      motion.removeEventListener("change", clear);
    };
  }, []);
  return null;
}
