"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { assetPath } from "@/lib/world/assets";
import { advanceLoadingProgress, preparationProgress } from "@/lib/world/scene-readiness";

const pageAssets = ["/hao-logo.svg", "/card/foil-grain.svg", "/world/procedural-map.svg"];
const pageTasks = ["document", "fonts", ...pageAssets];

/** Animate HTML transform layers on the compositor, not SVG geometry on the
 * main thread shared with model parsing and the initial Three.js scene commit. */
function LoadingDial({ progress }: { progress: number }) {
  return (
    <div className="loading-dial" aria-hidden="true">
      <div className="loading-dial-assembly">
        <div className="loading-dial-layer loading-dial-base">
          <svg viewBox="-250 -250 500 500">
            <circle r="100" fill="none" stroke="#202020" strokeWidth="45" />
            <circle r="96" fill="none" stroke="#717171" strokeWidth="1" />
            {Array.from({ length: 8 }, (_, i) => <path key={i} d="M 74 0 H 124" stroke="#050505" strokeWidth="2" transform={`rotate(${i * 45})`} />)}
          </svg>
        </div>
        <div className="loading-dial-layer loading-dial-lower">
          <div className="loading-dial-spin"><svg viewBox="-250 -250 500 500">
            <circle r="114" fill="none" stroke="#444" strokeWidth="2" strokeDasharray="57 3 14 2" />
          </svg></div>
        </div>
        <div className="loading-dial-layer loading-dial-middle">
          <div className="loading-dial-spin"><svg viewBox="-250 -250 500 500">
            <circle r="176" fill="none" stroke="#777" strokeWidth="4" strokeDasharray="168 6 42 3" />
          </svg></div>
        </div>
        <div className="loading-dial-layer loading-dial-top">
          <svg viewBox="-250 -250 500 500">
            <circle r="194" fill="none" stroke="#282828" strokeWidth="8" />
            <circle r="159" fill="none" stroke="#2d2d2d" strokeWidth="29" />
            <circle className="loading-dial-progress" r="159" fill="none" stroke="#fff" strokeWidth="29" pathLength="100" strokeDasharray={`${progress} 100`} transform="rotate(-90)" />
            <circle r="139" fill="none" stroke="#969696" strokeWidth="2" />
            <circle r="132" fill="none" stroke="#343434" strokeWidth="2" strokeDasharray="19 3" />
          </svg>
          <div className="loading-dial-ticks"><svg viewBox="-250 -250 500 500">
            {Array.from({ length: 10 }, (_, i) => (
              <g key={i} transform={`rotate(${i * 36})`}>
                <path d="M 144 0 H 174" stroke="#050505" strokeWidth="4" />
                <path d="M 198 0 H 204" stroke="#777" strokeWidth="1" />
                <text x="217" y="4" fill="#ddd" fontSize="10" textAnchor="middle">{i * 10}</text>
              </g>
            ))}
          </svg></div>
        </div>
        <div className="loading-dial-readout"><svg viewBox="0 0 800 600">
          <text x="400" y="188" className="loading-dial-number" textAnchor="middle">{Math.floor(progress)}</text>
          <text x="400" y="218" className="loading-dial-percent" textAnchor="middle">PERCENT</text>
        </svg></div>
      </div>
    </div>
  );
}

export function WorldLoading({ states, required, initialized, ready, reduced, onComplete, onRetry, onLightweight }: {
  states: Record<string, string>;
  required: string[];
  initialized: boolean;
  ready: boolean;
  reduced: boolean;
  onComplete: () => void;
  onRetry: () => void;
  onLightweight: () => void;
}) {
  const [pageStates, setPageStates] = useState<Record<string, string>>({});
  const [slow, setSlow] = useState(false);
  const [displayed, setDisplayed] = useState(0);
  const displayedRef = useRef(0);
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    let alive = true;
    const status = (id: string, state: string) => {
      if (alive) setPageStates(old => ({ ...old, [id]: state }));
    };
    const loaded = () => status("document", "ready");
    if (document.readyState === "complete") loaded();
    else window.addEventListener("load", loaded, { once: true });
    // Explicitly load both local font faces, including the mono face used by the pass.
    const fontStyle = getComputedStyle(document.body);
    Promise.all([
      document.fonts.load(`16px ${fontStyle.getPropertyValue("--font-geist-sans")}`),
      document.fonts.load(`16px ${fontStyle.getPropertyValue("--font-geist-mono")}`),
      document.fonts.ready,
    ]).then(() => status("fonts", "ready"), () => status("fonts", "error"));
    const images = pageAssets.map(src => {
      const image = new Image();
      image.src = assetPath(src);
      image.decode().then(() => status(src, "ready"), () => status(src, "error"));
      return image;
    });
    const timeout = window.setTimeout(() => setSlow(true), 15000);
    return () => {
      alive = false;
      window.removeEventListener("load", loaded);
      window.clearTimeout(timeout);
      images.forEach(image => { image.src = ""; });
    };
  }, []);
  const allRequired = [...required, "gpu", ...pageTasks];
  const allStates = { ...states, ...pageStates };
  // Resolve saved quality/route before reporting work for that preparation.
  const progress = initialized ? preparationProgress(allRequired, allStates, ready) : 0;
  const error = allRequired.some(id => allStates[id] === "error");
  useEffect(() => {
    let frame: number;
    let previous = performance.now();
    const tick = (now: number) => {
      const next = reduced ? progress : advanceLoadingProgress(displayedRef.current, progress, now - previous);
      previous = now;
      displayedRef.current = next;
      setDisplayed(next);
      if (next !== progress) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [progress, reduced]);
  const visibleProgress = Math.min(displayed, progress);
  const complete = visibleProgress === 100 && !error;
  useEffect(() => {
    if (!complete) {
      const frame = requestAnimationFrame(() => setExiting(false));
      return () => cancelAnimationFrame(frame);
    }
    // Keep the live rings moving for a full second AFTER the displayed 100.
    const timer = window.setTimeout(() => setExiting(true), 1000);
    return () => window.clearTimeout(timer);
  }, [complete]);
  useEffect(() => {
    if (!complete || !exiting) return;
    const timer = window.setTimeout(onComplete, reduced ? 150 : 400);
    return () => window.clearTimeout(timer);
  }, [complete, exiting, onComplete, reduced]);

  return (
    <section className="world-loading" data-complete={complete} data-exiting={complete && exiting} data-error={error} data-progress-target={progress} aria-label="Loading WONDERHAO">
      <div className="world-loading-meter" role="progressbar" aria-label="World preparation" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(visibleProgress)} aria-valuetext={`${Math.floor(visibleProgress)}% of preparation tasks complete`}>
        <div className="loading-dial-exit"><LoadingDial progress={visibleProgress} /></div>
      </div>
      <div className="world-loading-status" role="status" aria-live="polite">
        {error ? "Some resources could not load. Please try again." : complete ? "Your world is ready." : slow ? "Still preparing your world…" : <span className="sr-only">Loading your world.</span>}
      </div>
      <div className="world-loading-actions">
        <button type="button" onClick={onRetry}>Retry</button>
        <button type="button" onClick={onLightweight}>Use lightweight view</button>
        <Link href="/work">Browse the work ↗</Link>
      </div>
    </section>
  );
}
