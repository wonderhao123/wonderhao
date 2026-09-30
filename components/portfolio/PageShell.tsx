import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="editorial-page">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="editorial-header">
        <Link href="/" className="wordmark">
          WONDERHAO<span className="wordmark-symbol">✳</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/work">Projects</Link>
          <Link href="/about">About</Link>
          <Link href="/about#contact">
            Contact <ArrowUpRight size={14} />
          </Link>
        </nav>
      </header>
      <main id="main-content">
        <Link href="/" className="back-to-island">
          <ArrowLeft size={14} />
          Back to the island
        </Link>
        {children}
      </main>
      <footer className="editorial-footer">
        <span>A world by Carl Chong.</span>
        <Link href="/">
          A little more exploring? <ArrowUpRight size={14} />
        </Link>
        <span>WONDERHAO © 2026</span>
      </footer>
    </div>
  );
}
