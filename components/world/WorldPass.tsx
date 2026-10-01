"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  Download,
  RotateCw,
  Check,
  ArrowRight,
} from "lucide-react";
import { places, profile } from "@/lib/world/content";
import { assetPath } from "@/lib/world/assets";
import {
  cleanNickname,
  downloadPass,
  emblemSeed,
  issuedDate,
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
  const resetTilt = () => {
    card.current?.style.setProperty("--tilt-x", "0deg");
    card.current?.style.setProperty("--tilt-y", "0deg");
    card.current?.style.setProperty("--foil-x", "50%");
    card.current?.style.setProperty("--foil-y", "50%");
    card.current?.style.setProperty("--glare", "0");
  };
  useEffect(
    () => () => {
      animations.current.forEach((animation) => animation.cancel());
    },
    [],
  );
  const seed = emblemSeed(pass);
  const download = async () => {
    setDownloading(true);
    setMessage("");
    try {
      await downloadPass(
        { ...pass, nickname: cleanNickname(nickname) },
        assetPath("/card/holo-mark.svg"),
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
    const tilt = surface?.querySelector<HTMLElement>(".pass-tilt");
    const arrival = surface?.closest<HTMLElement>(".arrival-screen");
    if (!tilt || !arrival) {
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
      await play(tilt, reduced ? [{ opacity: 1 }, { opacity: 1 }] : [
        { transform: "translate3d(0, 0, 0) rotateY(0deg) rotateZ(0deg)", offset: 0 },
        { transform: "translate3d(0, 0, 0) rotateY(0deg) rotateZ(0deg)", offset: 0.12 },
        { transform: "translate3d(0, -20px, 0) rotateY(720deg) rotateZ(0deg)", offset: 0.75 },
        { transform: "translate3d(0, calc(-100vh - 480px), 0) rotateY(720deg) rotateZ(0deg) scale(0.85)", offset: 1 },
      ], reduced ? 200 : 2800);
      await play(arrival, [{ opacity: 1 }, { opacity: 0 }], reduced ? 150 : 500);
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
        ref={card}
        inert={admitted}
        className={`pass-card ${flipped ? "is-flipped" : ""} ${admitted ? "is-admitted" : ""}`}
        onPointerMove={(event) => {
          if (
            admitted ||
            event.pointerType !== "mouse" ||
            event.currentTarget.closest('[data-reduced-motion="true"]') ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
          )
            return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          event.currentTarget.style.setProperty("--tilt-x", `${-y * 20}deg`);
          event.currentTarget.style.setProperty("--tilt-y", `${x * 20}deg`);
          event.currentTarget.style.setProperty("--foil-x", `${50 + x * 100}%`);
          event.currentTarget.style.setProperty("--foil-y", `${50 + y * 100}%`);
          event.currentTarget.style.setProperty(
            "--glare",
            `${Math.abs(x) * 0.5}`,
          );
        }}
        onPointerLeave={resetTilt}
        onPointerUp={resetTilt}
        onPointerCancel={resetTilt}
        style={
          {
            "--holo-pattern": `url("${assetPath("/card/holo-mark.svg")}")`,
            "--edition-offset": `${seed % 80}px`,
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
      <div className="pass-tools">
        <button
          type="button"
          className="text-button"
          disabled={admitted}
          onClick={() => setFlipped(!flipped)}
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
      <div className="foil-base" />
      <div className="foil-pattern" />
      <div className="foil-pattern foil-pattern-secondary" />
      <div className="foil-spectrum" />
      <div className="foil-glare" />
      <div className="foil-edge" />
    </div>
  );
}
