import type { Metadata } from "next";
import { PageShell } from "@/components/portfolio/PageShell";
import { AboutContent } from "@/components/portfolio/AboutContent";
export const metadata: Metadata = {
  title: "About Carl — WONDERHAO",
  description:
    "Carl Chong — software engineer, world builder and interface maker in Kuala Lumpur.",
};
export default function About() {
  return (
    <PageShell>
      <AboutContent />
    </PageShell>
  );
}
