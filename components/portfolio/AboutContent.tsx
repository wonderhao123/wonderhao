"use client";
import { useState } from "react";
import { ArrowUpRight, Copy, Check } from "lucide-react";
import { profile } from "@/lib/world/content";
export function AboutContent({
  contactOnly = false,
}: {
  contactOnly?: boolean;
}) {
  const [message, setMessage] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setMessage("Email copied.");
    } catch {
      setMessage(
        "Copy is unavailable. Select the email address below, or open your email app.",
      );
    }
  };
  return (
    <div className="about-content">
      {!contactOnly && (
        <>
          <span className="eyebrow">THE PERSON BEHIND THE ISLAND</span>
          <h1>
            Hi, I’m Carl.
            <br />I make things
            <br />
            <em>work. And feel.</em>
          </h1>
          <p className="about-lead">
            Software engineer, curious world builder, and a believer in
            interfaces that feel considered.
          </p>
          <p>
            I work across web, mobile and desktop software. My projects connect
            operational systems with the people who use them: a warehouse team,
            a designer, someone collecting their thoughts.
          </p>
          <p>
            I’m also interested in game design and the feeling of discovering a
            place. This island brings those interests together: a real-time
            world, a collection of work, and an invitation to explore.
          </p>
          <div className="about-disciplines">
            <span>01 / Software & systems</span>
            <span>02 / Worlds & interaction</span>
            <span>03 / Interfaces & visual design</span>
          </div>
          <p className="location-line">
            Based in {profile.location}. Open to thoughtful conversations,
            wherever you are.
          </p>
        </>
      )}
      <section id="contact" className="contact-block">
        <span className="eyebrow">A GOOD THING CAN START WITH HELLO</span>
        <h2>
          Let’s make
          <br />
          something matter.
        </h2>
        <a className="email-link" href={`mailto:${profile.email}`}>
          {profile.email}
          <ArrowUpRight size={22} />
        </a>
        <button type="button" className="text-button" onClick={copy}>
          {message === "Email copied." ? (
            <Check size={14} />
          ) : (
            <Copy size={14} />
          )}{" "}
          Copy email
        </button>
        <p role="status" className="status-message">
          {message}
        </p>
        <div className="social-links">
          <a href={profile.github} target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight size={15} />
          </a>
          <a href={profile.linkedin} target="_blank" rel="noreferrer">
            LinkedIn <ArrowUpRight size={15} />
          </a>
        </div>
      </section>
    </div>
  );
}
