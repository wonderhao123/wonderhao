"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  Download,
  RotateCw,
  ArrowRight,
} from "lucide-react";
import { places, profile } from "@/lib/world/content";
import { assetPath } from "@/lib/world/assets";
import { usePassLanyard } from "./usePassLanyard";
import {
  cleanNickname,
  downloadPass,
  passNumber,
  type WorldPass as Pass,
} from "@/lib/world/pass";
export function WorldPass({
  pass,
  onSave,
  onEnter,
  first = false,
  storageAvailable = true,
}: {
  pass: Pass;
  onSave: (nickname: string) => void;
  onEnter?: () => void;
  first?: boolean;
  storageAvailable?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const [nickname, setNickname] = useState(pass.nickname);
  const [message, setMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [admitted, setAdmitted] = useState(false);
  const entering = useRef(false);
  const animations = useRef<Animation[]>([]);
  const card = useRef<HTMLDivElement>(null);
  const lanyard = usePassLanyard(first);
  const gesture = useRef<{ pointerId: number; x: number; y: number; time: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const flip = () => {
    if (entering.current) return;
    resetTilt();
    setFlipped((value) => !value);
  };
  const flipFromSurface = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressClick.current && event.detail !== 0) {
      suppressClick.current = false;
      return;
    }
    flip();
    // Keep keyboard focus on the newly visible face, outside the inert face.
    if (event.detail === 0) {
      requestAnimationFrame(() => {
        card.current?.querySelector<HTMLButtonElement>(
          '.pass-face:not([inert]) .pass-flip-surface',
        )?.focus();
      });
    }
  };
  const resetTilt = () => {
    card.current?.style.setProperty("--tilt-x", "0deg");
    card.current?.style.setProperty("--tilt-y", "0deg");
    card.current?.style.setProperty("--foil-x", "50%");
    card.current?.style.setProperty("--foil-y", "50%");
    card.current?.style.setProperty("--glare", "0");
    card.current?.style.setProperty("--foil-active", "0");
    card.current?.style.setProperty("--foil-hot-x", "50%");
    card.current?.style.setProperty("--foil-hot-y", "50%");
  };
  useEffect(
    () => () => {
      animations.current.forEach((animation) => animation.cancel());
    },
    [],
  );
  const download = async () => {
    setDownloading(true);
    setMessage("");
    try {
      await downloadPass(
        { ...pass, nickname: cleanNickname(nickname) },
        assetPath("/hao-logo.svg"),
      );
      setMessage("Your pass image is ready.");
    } catch {
      setMessage("The image could not be saved. Please try again.");
    } finally {
      setDownloading(false);
    }
  };
  const enter = async () => {
    if (entering.current) return;
    entering.current = true;
    onSave(cleanNickname(nickname));
    setAdmitted(true);
    resetTilt();
    const surface = card.current;
    const arrival = surface?.closest<HTMLElement>(".arrival-screen");
    if (!surface || !arrival) {
      onEnter?.();
      return;
    }
    const reduced = !!surface?.closest('[data-reduced-motion="true"]') ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const play = async (element: HTMLElement, frames: Keyframe[], duration: number) => {
      const animation = element.animate(frames, { duration, fill: "forwards", easing: "ease-in-out" });
      animations.current.push(animation);
      await animation.finished;
    };
    try {
      await lanyard.controller.current?.depart();
      await play(arrival, [{ opacity: 1 }, { opacity: 0 }], reduced ? 150 : 350);
      onEnter?.();
    } catch (error) {
      // Unmount cancels the departure; do not enter after leaving this screen.
      if (error instanceof DOMException && error.name === "AbortError") return;
      // Optional motion must not prevent entry if the animation engine fails.
      onEnter?.();
    }
  };
  return (
    <div className={`pass-experience ${admitted ? "is-departing" : ""}`}>
      <div
        ref={lanyard.stage}
        inert={admitted}
        className="pass-suspension"
        data-first={first}
        onPointerDown={(event) => {
          suppressClick.current = false;
          const target = event.target as HTMLElement;
          if (entering.current || !event.isPrimary || event.button !== 0 ||
              target.closest('input, a, label, .pass-name-edit, button:not(.pass-flip-surface, .pass-clip)')) return;
          gesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), dragging: false };
          target.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = gesture.current;
          if (start && start.pointerId === event.pointerId) {
            if (!start.dragging && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) {
              start.dragging = true;
              lanyard.controller.current?.grab(start.x, start.y);
            }
            if (start.dragging) lanyard.controller.current?.move(event.clientX, event.clientY);
          }
          if (
            admitted ||
            event.pointerType !== "mouse" ||
            event.currentTarget.closest('[data-reduced-motion="true"]') ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
          )
            return;
          const surface = card.current;
          if (!surface) return;
          const rect = surface.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          surface.style.setProperty("--tilt-x", `${-y * 20}deg`);
          surface.style.setProperty("--tilt-y", `${x * 20}deg`);
          surface.style.setProperty("--foil-x", `${50 + x * 100}%`);
          surface.style.setProperty("--foil-y", `${50 + y * 100}%`);
          surface.style.setProperty("--foil-active", "1");
          // Project the pointer into the fixed lower-right foil region.
          surface.style.setProperty("--foil-hot-x", `${((x + 0.5) * rect.width - (rect.width - 168)) / 190 * 100}%`);
          surface.style.setProperty("--foil-hot-y", `${((y + 0.5) * rect.height - (rect.height - 220)) / 200 * 100}%`);
          surface.style.setProperty(
            "--glare",
            `${Math.abs(x) * 0.5}`,
          );
        }}
        onPointerLeave={resetTilt}
        onPointerUp={(event) => {
          const start = gesture.current;
          if (start && start.pointerId !== event.pointerId) return;
          gesture.current = null;
          lanyard.controller.current?.release();
          resetTilt();
          if (!start) return;
          const dx = Math.abs(event.clientX - start.x);
          const dy = Math.abs(event.clientY - start.y);
          suppressClick.current = dx > 8 || dy > 8;
          if (performance.now() - start.time < 260 && dx >= 44 && dx > dy * 1.3) flip();
        }}
        onPointerCancel={() => {
          gesture.current = null;
          suppressClick.current = true;
          lanyard.controller.current?.release();
          resetTilt();
        }}
      >
        <svg className="pass-lanyard" aria-hidden="true">
          <g ref={lanyard.strap} fill="none" strokeLinecap="round">
            <path className="pass-strap-edge" />
            <path className="pass-strap-fabric" />
            <path className="pass-strap-stitch" />
          </g>
        </svg>
        <div ref={lanyard.hanger} className="pass-hanger">
          <button type="button" className="pass-clip" aria-label="Swing the pass"
            onClick={() => {
              if (suppressClick.current) { suppressClick.current = false; return; }
              lanyard.controller.current?.nudge();
            }}>
            <span aria-hidden="true" />
          </button>
          <div ref={card}
            className={`pass-card ${flipped ? "is-flipped" : ""} ${admitted ? "is-admitted" : ""}`}
        style={
          {
            "--foil-grain": `url("${assetPath("/card/foil-grain.svg")}")`,
            "--brand-mark": `url("${assetPath("/hao-logo.svg")}")`,
          } as CSSProperties
        }
      >
        <div className="pass-tilt">
          <div className="pass-inner">
            <div
              className="pass-face pass-front"
              data-card-surface="pass"
              aria-hidden={flipped}
              inert={flipped}
            >
              <HoloFoil />
              <button type="button" className="pass-flip-surface"
                aria-label="Turn pass over to the island journal" onClick={flipFromSurface} />
              <div className="pass-topline">
                <span className="pass-status-dot" />
                <span>PASS-ID // {passNumber(pass).slice(3)}</span>
              </div>
              <h2>
                World
                <br />
                <span>Pass.</span>
              </h2>
              <div className="pass-role">
                <i /> EXPLORER
              </div>
              <div className="pass-person">
                <label className="eyebrow" htmlFor="visitor-name">
                  ISSUED TO
                </label>
                <div className="pass-name-edit">
                  <input
                    id="visitor-name"
                    aria-label="Your name · click to edit"
                    value={nickname}
                    maxLength={48}
                    placeholder="Fellow explorer"
                    autoComplete="nickname"
                    spellCheck={false}
                    disabled={admitted}
                    onChange={(event) => setNickname(event.target.value)}
                    onBlur={() => {
                      const name = cleanNickname(nickname);
                      setNickname(name);
                      onSave(name);
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.nativeEvent.isComposing
                      )
                        event.currentTarget.blur();
                    }}
                  />
                  <span className="pass-name-measure" aria-hidden="true">
                    {nickname || "Fellow explorer"}
                  </span>
                  <span className="pass-name-caret" aria-hidden="true" />
                </div>
              </div>
              <div className="pass-baseline">
                {first ? (
                  <button
                    type="button"
                    className="pass-connect pass-entry"
                    onClick={enter}
                    disabled={admitted}
                    aria-label="Explore the island"
                  >
                    {admitted ? "WELCOME" : "EXPLORE"} <ArrowRight size={16} />
                  </button>
                ) : (
                  <span className="pass-connect">
                    EXPLORE <ArrowRight size={12} />
                  </span>
                )}
              </div>
            </div>
            <div
              className="pass-face pass-back"
              data-card-surface="pass"
              aria-hidden={!flipped}
              inert={!flipped}
            >
              <HoloFoil />
              <button type="button" className="pass-flip-surface"
                aria-label="Turn pass over to the front" onClick={flipFromSurface} />
              <h3>
                Your little
                <br />
                island journal.
              </h3>
              <div className="stamp-grid">
                {places.map((p) => (
                  <div
                    className={`stamp ${pass.stamps.includes(p.id) ? "collected" : ""}`}
                    key={p.id}
                  >
                    <span>{p.number}</span>
                    <strong>
                      {pass.stamps.includes(p.id) ? p.stamp : "UNVISITED"}
                    </strong>
                    <small>{p.short}</small>
                  </div>
                ))}
              </div>
              <div className="pass-creator">
                <span className="micro-label">A WORLD BY</span>
                <strong>{profile.name}</strong>
                <p>Software, playful systems & considered interfaces.</p>
                <a href={profile.github} target="_blank" rel="noreferrer">
                  GitHub <ArrowUpRight size={13} />
                </a>
                <a href={profile.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
      <p className="pass-flip-hint">Drag to swing · tap or swipe to turn.</p>
      <div className="pass-tools">
        <button
          type="button"
          className="text-button"
          disabled={admitted}
          onClick={flip}
        >
          <RotateCw size={14} /> {flipped ? "Front of pass" : "Turn it over"}
        </button>
        {!first && (
          <span>
            {pass.stamps.length} / {places.length} places visited
          </span>
        )}
      </div>
      {!first && pass.diveKit && (
        <p className="dive-endorsement">DIVE KIT · READY TO EXPLORE</p>
      )}
      {!first && (
        <div className="pass-form">
          <button
            type="button"
            className="primary-button"
            onClick={download}
            disabled={downloading}
          >
            <Download size={16} />
            {downloading ? "Creating your image…" : "Download your pass"}
          </button>
          <p className="pass-note">
            {storageAvailable
              ? "Yours to keep. Saved in this browser, no account needed."
              : "Browser storage is unavailable. You can explore, but this pass will not be saved after you leave."}
          </p>
          <p className="status-message" role="status">
            {message}
          </p>
        </div>
      )}
      {first && !storageAvailable && (
        <p className="pass-note" role="status">
          Browser storage is unavailable. Your pass lasts for this visit.
        </p>
      )}
    </div>
  );
}
function HoloFoil() {
  return (
    <div className="pass-holo" aria-hidden="true">
      <div className="foil-emblem" />
    </div>
  );
}
