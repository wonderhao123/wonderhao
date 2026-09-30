"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { projects, type Project } from "@/lib/world/content";
import { ProjectPreview } from "./ProjectPreview";
export function ProjectDirectory({
  onProject,
  onLocate,
}: {
  onProject?: (p: Project) => void;
  onLocate?: (p: Project) => void;
}) {
  const [filter, setFilter] = useState("All");
  const list = projects.filter(
    (p) => filter === "All" || p.category === filter,
  );
  return (
    <>
      <div className="directory-title">
        <span className="eyebrow">WORK, WITH A PLACE IN THE WORLD</span>
        <h1>
          Things I help
          <br />
          bring to life.
        </h1>
        <p>
          Software with purpose. Interfaces with feeling.
          <br />A few experiments along the way.
        </p>
      </div>
      <div className="filter-tabs" aria-label="Project categories">
        {["All", "Systems", "Tools", "Design", "Research", "World"].map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={f === filter}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        {list.length} projects shown
      </p>
      <div className="project-grid">
        {list.map((p) => (
          <article
            className="project-tile"
            data-card-surface=""
            key={p.slug}
            style={{ "--project-color": p.color } as React.CSSProperties}
          >
            <div className="tile-preview" inert>
              <ProjectPreview project={p} compact />
            </div>
            <div className="tile-copy">
              <span className="eyebrow">
                {p.category} {p.featured ? " / SELECTED WORK" : ""}
              </span>
              <h2>
                {onProject ? (
                  <button type="button" onClick={() => onProject(p)}>
                    {p.title}
                    <ArrowUpRight size={19} />
                  </button>
                ) : (
                  <Link href={`/work/${p.slug}`}>
                    {p.title}
                    <ArrowUpRight size={19} />
                  </Link>
                )}
              </h2>
              <p>{p.summary}</p>
              {onLocate && (
                <button
                  type="button"
                  className="locate-link"
                  onClick={() => onLocate(p)}
                >
                  <MapPin size={12} />
                  Locate on island
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
