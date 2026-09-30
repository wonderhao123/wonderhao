import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { ProjectPreview } from "./ProjectPreview";
import { places, type Project } from "@/lib/world/content";
export function ProjectContent({
  project,
  overlay = false,
}: {
  project: Project;
  overlay?: boolean;
}) {
  return (
    <article
      className="project-article"
      style={{ "--project-color": project.color } as React.CSSProperties}
    >
      <div className="case-header">
        <span className="eyebrow">
          {project.category} / {project.status}
        </span>
        <h1>{project.title}</h1>
        <p className="case-intro">{project.summary}</p>
      </div>
      <ProjectPreview project={project} />
      <p className="media-caption">
        {project.preview === "world"
          ? "Schematic overview generated from the island’s shared procedural terrain."
          : "Interactive editorial reconstruction using invented sample data. Not a screenshot of the client product."}
      </p>
      <div className="case-facts">
        <div>
          <span className="micro-label">CONTRIBUTION</span>
          <p>{project.role}</p>
        </div>
        <div>
          <span className="micro-label">TOOLS & MATERIALS</span>
          <p>{project.stack.join(" · ")}</p>
        </div>
      </div>
      <section>
        <span className="eyebrow">The starting point</span>
        <h2>A problem worth solving.</h2>
        <p>{project.problem}</p>
      </section>
      <section>
        <span className="eyebrow">Inside the work</span>
        <h2>Decisions that shape the experience.</h2>
        <div className="decisions">
          {project.decisions.map((d, i) => (
            <div key={d.title}>
              <span className="decision-number">0{i + 1}</span>
              <div>
                <h3>{d.title}</h3>
                <p>{d.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="case-outcome">
        <span className="eyebrow">Where it stands</span>
        <p>{project.outcome}</p>
      </section>
      <footer className="case-footer">
        {overlay ? (
          <Link href={`/work/${project.slug}`} className="text-button">
            Open standalone case study <ArrowUpRight size={15} />
          </Link>
        ) : (
          <Link
            href={`/?place=${project.place}&project=${project.slug}`}
            className="text-button"
          >
            <MapPin size={15} /> Find it at{" "}
            {places.find((p) => p.id === project.place)?.name}
          </Link>
        )}
        <Link href="/about#contact" className="text-button">
          Talk about a project <ArrowUpRight size={15} />
        </Link>
      </footer>
    </article>
  );
}
