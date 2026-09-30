import type { Metadata } from "next";
import { PageShell } from "@/components/portfolio/PageShell";
import { ProjectDirectory } from "@/components/portfolio/ProjectDirectory";
export const metadata: Metadata = {
  title: "Selected work — WONDERHAO",
  description:
    "Software systems, considered interfaces and a few playful experiments by Carl Chong.",
};
export default function Work() {
  return (
    <PageShell>
      <ProjectDirectory />
    </PageShell>
  );
}
