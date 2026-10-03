"use client";

import { useEffect, useRef } from "react";
import { stepPassBody, type PassBody } from "@/lib/world/pass-physics";

export function usePassLanyard(first: boolean) {
  const stage = useRef<HTMLDivElement>(null);
  const hanger = useRef<HTMLDivElement>(null);
  const strap = useRef<SVGGElement>(null);
  const controller = useRef<{
    grab: (x: number, y: number) => void;
    move: (x: number, y: number) => void;
    release: () => void;
    nudge: () => void;
    depart: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    const root = stage.current;
    const object = hanger.current;
    const cord = strap.current;
    if (!root || !object || !cord) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = () => media.matches || !!root.closest('[data-reduced-motion="true"]');
    const body: PassBody = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, angularVelocity: 0 };
    let rect = root.getBoundingClientRect();
    let length = first ? Math.max(65, rect.top - 2) : 65;
    let frame = 0;
    let previous = 0;
    let departed = false;
    let grab: { x: number; y: number; bx: number; by: number; time: number } | null = null;
    let departure: { start: number; x: number; y: number; angle: number; resolve: () => void; reject: (error: Error) => void } | null = null;

    const draw = () => {
      object.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) rotate(${body.angle}deg)`;
      const cx = rect.width / 2;
      const anchorY = -26 - length;
      const endX = cx + body.x;
      const endY = body.y - 26;
      const slack = Math.max(0, length - Math.hypot(body.x, length + body.y));
      const bow = Math.min(110, slack * 0.7) + body.vx * 0.025;
      const pull = departure ? Math.min(0, body.y) : 0;
      const d = `M ${cx} ${anchorY + pull} C ${cx + bow} ${anchorY + length * 0.4 + pull}, ${endX - body.x * 0.18 + bow} ${endY - length * 0.3}, ${endX} ${endY}`;
      for (const path of cord.children) path.setAttribute("d", d);
    };
    const wake = () => {
      if (!frame && !document.hidden && !departed) {
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (departure) {
        const progress = Math.min(1, (now - departure.start) / 720);
        // A brief load on the strap, then an accelerating pull out of the viewport.
        const pull = progress < 0.18 ? 12 * Math.sin(progress / 0.18 * Math.PI / 2)
          : 12 - (rect.top + rect.height + 150) * Math.pow((progress - 0.18) / 0.82, 2.4);
        body.x = departure.x * (1 - progress);
        body.y = departure.y + pull;
        body.angle = departure.angle * (1 - progress);
        draw();
        if (progress === 1) {
          departed = true;
          departure.resolve();
          departure = null;
          return;
        }
      } else if (reduced()) {
        Object.assign(body, { x: 0, y: 0, vx: 0, vy: 0, angle: 0, angularVelocity: 0 });
        draw();
        return;
      } else if (!grab) {
        const asleep = stepPassBody(body, length, dt);
        draw();
        if (asleep) return;
      }
      frame = requestAnimationFrame(tick);
    };
    if (first && !reduced()) {
      body.x = -24;
      body.y = -rect.top - rect.height - 80;
      body.vx = 65;
      body.angle = -9;
    }
    draw();
    root.dataset.ready = "true";
    wake();

    controller.current = {
      grab(x, y) {
        if (departure || reduced()) return;
        grab = { x, y, bx: body.x, by: body.y, time: performance.now() };
        body.vx = body.vy = 0;
        root.dataset.dragging = "true";
        wake();
      },
      move(x, y) {
        if (!grab) return;
        const now = performance.now();
        const dt = Math.max(1 / 120, (now - grab.time) / 1000);
        const limitX = Math.max(18, (window.innerWidth - rect.width) / 2 - 12);
        const nextX = Math.max(-limitX, Math.min(limitX, grab.bx + x - grab.x));
        const nextY = Math.max(-length * 0.7, Math.min(100, grab.by + y - grab.y));
        body.vx = Math.max(-900, Math.min(900, (nextX - body.x) / dt));
        body.vy = Math.max(-1100, Math.min(1100, (nextY - body.y) / dt));
        body.angle = Math.max(-24, Math.min(24, -nextX * 0.065));
        body.x = nextX;
        body.y = nextY;
        grab.time = now;
        draw();
      },
      release() {
        if (grab && performance.now() - grab.time > 100) body.vx = body.vy = 0;
        grab = null;
        delete root.dataset.dragging;
        wake();
      },
      nudge() {
        if (departure || reduced()) return;
        body.vx += 260;
        body.angularVelocity -= 50;
        wake();
      },
      depart() {
        grab = null;
        delete root.dataset.dragging;
        if (reduced()) return Promise.resolve();
        return new Promise<void>((resolve, reject) => {
          departure = { start: performance.now(), x: body.x, y: body.y, angle: body.angle, resolve, reject };
          wake();
        });
      },
    };
    const measure = () => {
      rect = root.getBoundingClientRect();
      length = first ? Math.max(65, rect.top - 2) : 65;
      draw();
      wake();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(root);
    window.addEventListener("resize", measure);
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        grab = null;
        delete root.dataset.dragging;
      } else wake();
    };
    document.addEventListener("visibilitychange", visibility);
    media.addEventListener("change", wake);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("resize", measure);
      media.removeEventListener("change", wake);
      document.removeEventListener("visibilitychange", visibility);
      departure?.reject(new DOMException("Pass unmounted", "AbortError"));
      controller.current = null;
    };
  }, [first]);

  return { stage, hanger, strap, controller };
}
