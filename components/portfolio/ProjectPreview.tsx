"use client";
import { useState } from "react";
import { ArrowRight, Check, Search, Layers, ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/world/content";
import { assetPath } from "@/lib/world/assets";
export function ProjectPreview({
  project,
  compact = false,
}: {
  project: Project;
  compact?: boolean;
}) {
  const [stage, setStage] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  if (project.preview === "world")
    return (
      <div
        className="world-preview"
        style={{ backgroundImage: `url(${assetPath("/world/procedural-map.svg")})` }}
      >
        <span>A place made of possibilities.</span>
      </div>
    );
  if (project.preview === "gallery")
    return (
      <div className={`gallery-study ${compact ? "compact" : ""}`}>
        <span className="micro-label">
          INTERFACE STUDIES / {["FORM", "SPACE", "MOTION"][selected]}
        </span>
        <div className="study-title">
          {[
            "Made to\nmove you.",
            "Space to\nthink.",
            "Small moves.\nBig feelings.",
          ][selected]
            .split("\n")
            .map((s, i) => (
              <span key={i}>
                {s}
                <br />
              </span>
            ))}
        </div>
        <div className={`study-object variant-${selected}`} aria-hidden="true">
          <div />
          <div />
          <div />
        </div>
        {!compact && (
          <div className="study-tabs">
            {["Form", "Space", "Motion"].map((s, i) => (
              <button
                key={s}
                type="button"
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <p>Original editorial studies · not client screenshots</p>
      </div>
    );
  if (project.preview === "notes") {
    const notes = [
      {
        title: "Things worth noticing",
        tag: "FIELD NOTES",
        body: "The best tools leave enough room for your own thoughts.",
      },
      {
        title: "A quieter kind of software",
        tag: "IDEAS",
        body: "Less interruption. More intention. A place that remembers without asking for attention.",
      },
      {
        title: "Connections in the margins",
        tag: "CONTEXT",
        body: "An idea gets more useful when you can find the thought that came before it.",
      },
    ];
    const filtered = notes.filter((n) =>
      n.title.toLowerCase().includes(query.toLowerCase()),
    );
    return (
      <div className={`demo-window notes-demo ${compact ? "compact" : ""}`}>
        <div className="demo-chrome">
          <span className="demo-dots">● ● ●</span>
          <span>PRIVATE WORKSPACE</span>
          <Layers size={12} />
        </div>
        <div className="notes-layout">
          <aside>
            <span>Library</span>
            <strong>
              All notes <small>3</small>
            </strong>
            <span>Contexts</span>
            <span>Find evidence</span>
          </aside>
          <div className="notes-content">
            {!compact && (
              <div className="demo-search">
                <Search size={14} />
                <input
                  aria-label="Search sample notes"
                  placeholder="Find a thought…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear sample note search"
                    onClick={() => setQuery("")}
                  >
                    ×
                  </button>
                )}
              </div>
            )}
            {compact ? (
              <>
                <span className="micro-label">FIELD NOTES</span>
                <h3>{notes[0].title}</h3>
                <p>{notes[0].body}</p>
              </>
            ) : (
              <>
                {filtered.length === 0 ? (
                  <p>No notes match. Try “things” or clear your search.</p>
                ) : (
                  filtered.map((n) => (
                    <article key={n.title}>
                      <span className="micro-label">{n.tag}</span>
                      <h3>{n.title}</h3>
                      <p>{n.body}</p>
                    </article>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  const steps =
    project.preview === "orders"
      ? ["Received", "Reserved", "Packed", "Dispatched"]
      : ["Submitted", "Validated", "Reviewed", "Complete"];
  return (
    <div className={`demo-window ${compact ? "compact" : ""}`}>
      <div className="demo-chrome">
        <span className="demo-dots">● ● ●</span>
        <span>OPERATIONS / WORKSPACE</span>
        <Layers size={12} />
      </div>
      <div className="order-content">
        <div className="order-title">
          <div>
            <span className="micro-label">
              {project.preview === "orders" ? "FULFILMENT" : "WORKFLOW"}
            </span>
            <h3>
              {project.preview === "orders"
                ? "Every order, in view."
                : "A clear next step."}
            </h3>
          </div>
          <span className="demo-status">{steps[stage]}</span>
        </div>
        <div className="demo-flow">
          {steps.map((s, i) => (
            <div className={i <= stage ? "done" : ""} key={s}>
              <span>
                {i < stage ? (
                  <Check size={12} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <small>{s}</small>
            </div>
          ))}
        </div>
        <div className="demo-row">
          <span className="demo-item" />
          <div>
            <strong>
              {project.preview === "orders" ? "Order #1048" : "Request #2046"}
            </strong>
            <small>Sample record · no client data</small>
          </div>
          <ArrowUpRight size={16} />
        </div>
        {!compact && (
          <button
            className="demo-next"
            type="button"
            onClick={() => setStage((stage + 1) % 4)}
          >
            {stage === 3
              ? "Reset demonstration"
              : `Move to ${steps[stage + 1].toLowerCase()}`}
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
