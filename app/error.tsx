"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <span className="eyebrow">WONDERHAO</span>
      <h1>A small detour.</h1>
      <p>
        This part of the island couldn’t load. Try again, or explore the project
        directory.
      </p>
      <button type="button" className="primary-button" onClick={reset}>
        Try again
      </button>
      <Link href="/work">Browse projects</Link>
    </main>
  );
}
