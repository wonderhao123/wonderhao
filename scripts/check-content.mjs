import { readFileSync, existsSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import ts from "typescript";
const source = readFileSync(
  new URL("../lib/world/content.ts", import.meta.url),
  "utf8",
);
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { projects, places, contentScenes } = await import(
  "data:text/javascript;base64," + Buffer.from(code).toString("base64")
);
const issues = [];
const slugs = new Set();
const ids = new Set(places.map((p) => p.id));
for (const p of projects) {
  if (slugs.has(p.slug)) issues.push(`Duplicate slug: ${p.slug}`);
  slugs.add(p.slug);
  if (!ids.has(p.place)) issues.push(`Missing place: ${p.slug}`);
  if (!/^[a-z0-9-]+$/.test(p.slug)) issues.push(`Invalid slug: ${p.slug}`);
  for (const field of ["title", "summary", "role", "problem", "outcome"])
    if (!p[field]?.trim()) issues.push(`Missing ${field}: ${p.slug}`);
  if (!p.decisions.length) issues.push(`Missing decisions: ${p.slug}`);
}
const sceneIds = new Set();
for (const scene of contentScenes) {
  if (sceneIds.has(scene.id)) issues.push(`Duplicate scene: ${scene.id}`);
  sceneIds.add(scene.id);
  if (!ids.has(scene.place)) issues.push(`Missing zone: ${scene.id}`);
  for (const slug of scene.projects) {
    const project = projects.find((p) => p.slug === slug);
    if (!project || project.place !== scene.place)
      issues.push(`Invalid scene project: ${slug}`);
  }
}
for (const p of projects)
  if (contentScenes.filter((s) => s.projects.includes(p.slug)).length !== 1)
    issues.push(`Project must have exactly one scene: ${p.slug}`);
if (!existsSync(new URL("../public/world/procedural-map.svg", import.meta.url)))
  issues.push("Missing procedural fallback map");
// Keep client identities and private evidence out of the content that ships.
const prohibited =
  /Storebase|T&T Lens|MessyDoc|Nodebook|SiteRelay|ToSouth|PayPro|Artflow|Startreno|XZOGA|Arjuara|Promiz|Hatch Tech|\/Users\/|API_KEY|DATABASE_URL/i;
const publicContent = JSON.stringify(projects);
if (prohibited.test(publicContent))
  issues.push(
    "Private identity or implementation evidence leaked into public project content.",
  );
const assets = ["procedural-map.svg"];
let compressed = 0;
let raw = 0;
for (const name of assets) {
  const file = new URL(`../public/world/${name}`, import.meta.url);
  raw += statSync(file).size;
  compressed += gzipSync(readFileSync(file)).length;
}
if (compressed > 5 * 1024 * 1024)
  issues.push("World exceeds 5 MiB compressed asset budget.");
if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}
console.log(
  `${projects.length} public projects, ${places.length} connected zones, ${contentScenes.length} content scenes. Procedural map: ${(raw / 1024 / 1024).toFixed(2)} MiB raw / ${(compressed / 1024 / 1024).toFixed(2)} MiB gzip.`,
);
