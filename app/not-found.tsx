import Link from "next/link";
import { PageShell } from "@/components/portfolio/PageShell";
export default function NotFound() {
  return (
    <PageShell>
      <div className="not-found">
        <span className="eyebrow">OFF THE MAP / 404</span>
        <h1>
          A little beyond
          <br />
          the shoreline.
        </h1>
        <p>
          This place isn’t on the island. There’s plenty to discover back on
          familiar ground.
        </p>
        <Link href="/" className="primary-button">
          Return to the island
        </Link>
        <Link href="/work" className="text-button">
          Browse the projects
        </Link>
      </div>
    </PageShell>
  );
}
