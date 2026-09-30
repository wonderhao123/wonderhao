import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { projects, projectBySlug } from "@/lib/world/content";
import { PageShell } from "@/components/portfolio/PageShell";
import { ProjectContent } from "@/components/portfolio/ProjectContent";
import { assetPath } from "@/lib/world/assets";
export const dynamicParams = false;
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = projectBySlug(slug);
  return p
    ? {
        title: `${p.title} — WONDERHAO`,
        description: p.summary,
        alternates: { canonical: assetPath(`/work/${p.slug}`) },
      }
    : {};
}
export default async function WorkDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) notFound();
  return (
    <PageShell>
      <ProjectContent project={project} />
    </PageShell>
  );
}
