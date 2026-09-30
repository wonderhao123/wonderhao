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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0, moved: false });
  const resetTilt = () => {
    card.current?.style.setProperty("--tilt-x", "0deg");
    card.current?.style.setProperty("--tilt-y", "0deg");
    card.current?.style.setProperty("--foil-x", "50%");
    card.current?.style.setProperty("--foil-y", "50%");
    card.current?.style.setProperty("--glare", "0");
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
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
  const enter = () => {
    onSave(cleanNickname(nickname));
    setAdmitted(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onEnter?.(), 350);
  };
  return (
    <div className="pass-experience">
      <div
        ref={card}
        className={`pass-card ${flipped ? "is-flipped" : ""} ${admitted ? "is-admitted" : ""}`}
        onPointerDown={(event) => {
          pointer.current = {
            x: event.clientX,
            y: event.clientY,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          if (
            event.buttons &&
            Math.hypot(
              event.clientX - pointer.current.x,
              event.clientY - pointer.current.y,
            ) > 8
          )
            pointer.current.moved = true;
          if (
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
        onPointerCancel={() => {
          pointer.current.moved = true;
          resetTilt();
        }}
        onClick={(event) => {
          if (
            !(event.target as HTMLElement).closest("a,button") &&
            !pointer.current.moved
          )
            setFlipped((value) => !value);
        }}
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
            >
              <HoloFoil />
              <div className="pass-topline">
                <span className="pass-status-dot" />
                <span>PASS-ID // {passNumber(pass).slice(3)}</span>
              </div>
              <div className="pass-issuer">WONDERHAO</div>
              <h2>
                World
                <br />
                <span>Pass.</span>
              </h2>
              <div className="pass-role">
                <i /> ISLAND EXPLORER
              </div>
              <div className="pass-person">
                <span className="eyebrow">ISSUED TO</span>
                <strong>{cleanNickname(nickname) || "Fellow explorer"}</strong>
              </div>
              <div className="pass-baseline">
                <div>
                  <span className="micro-label">PERSONAL EDITION</span>
                  <span>{passNumber(pass)}</span>
                </div>
                <span className="pass-connect">
                  EXPLORE <ArrowRight size={12} />
                </span>
              </div>
              <div className="pass-footer">
                <span>FIRST ARRIVAL</span>
                <span>{issuedDate(pass).toUpperCase()}</span>
              </div>
              {admitted && (
                <div className="admitted-seal">
                  <Check size={16} /> WELCOME ABOARD
                </div>
              )}
            </div>
            <div
              className="pass-face pass-back"
              data-card-surface="pass"
              aria-hidden={!flipped}
              inert={!flipped}
            >
              <HoloFoil />
              <div className="pass-topline">
                <span>WONDERHAO</span>
                <span className="pass-status-dot" />
              </div>
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
                {/* eslint-disable-next-line @next/next/no-img-element -- original vector identity mark */}
                <img
                  className="pass-creator-logo"
                  src={assetPath("/card/creator-logo.svg")}
                  alt="NODEGRIP"
                />
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
          onClick={() => setFlipped(!flipped)}
        >
          <RotateCw size={14} /> {flipped ? "Front of pass" : "Turn it over"}
        </button>
        <span>{pass.stamps.length} / {places.length} places visited</span>
      </div>
      {pass.diveKit && <p className="dive-endorsement">DIVE KIT · READY TO EXPLORE</p>}
      <div className="pass-form">
        <label htmlFor="visitor-name">
          What should we call you? <span>Optional</span>
        </label>
        <input
          id="visitor-name"
          value={nickname}
          maxLength={48}
          placeholder="Fellow explorer"
          autoComplete="nickname"
          onChange={(e) => setNickname(e.target.value)}
          onBlur={() => onSave(cleanNickname(nickname))}
        />
        {first ? (
          <button
            type="button"
            className="primary-button enter-button"
            onClick={enter}
            disabled={admitted}
          >
            {admitted ? "Welcome aboard" : "Enter the island"}
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="primary-button"
            onClick={download}
            disabled={downloading}
          >
            <Download size={16} />
            {downloading ? "Creating your image…" : "Download your pass"}
          </button>
        )}
        <p className="pass-note">
          {storageAvailable
            ? "Yours to keep. Saved in this browser, no account needed."
            : "Browser storage is unavailable. You can explore, but this pass will not be saved after you leave."}
        </p>
        <p className="status-message" role="status">
          {message}
        </p>
      </div>
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
