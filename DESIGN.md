---
version: alpha
name: WONDERHAO
description: A richly built coastal campus with a circular headquarters and the original black and cyan World Pass.
colors:
  primary: "#67e8f9"
  background: "#0b1119"
  surface: "#17232d"
  text: "#e7f0f5"
  muted: "#95a7b8"
  river: "#66c4d5"
  forest: "#7adccb"
  accent: "#67e8f9"
  pass-background: "#0a0a0a"
  pass-text: "#ffffff"
typography:
  sans:
    fontFamily: "Geist, Arial, sans-serif"
  mono:
    fontFamily: "Geist Mono, monospace"
  editorial:
    fontFamily: "Geist, Arial, sans-serif"
rounded:
  control: "5px"
  surface: "8px"
  pass: "16px"
spacing:
  desktop-inset: "36px"
  mobile-inset: "18px"
  editorial-max: "1000px"
components:
  world-pass:
    backgroundColor: "{colors.pass-background}"
    textColor: "{colors.pass-text}"
    rounded: "{rounded.pass}"
  navigation:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
  case-study:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.surface}"
---

# WONDERHAO design system

## Creative north star

A sunlit island city built around a circular glass headquarters, landscaped inner garden and connected neighbourhoods. VOGT informs the continuous urban fabric and legible infrastructure; Meatopia informs coastal depth, destination-led exploration and layered scenery. White architecture, teal glazing, green woodland and sandy shorelines make the world readable. The original black/cyan pass anchors the restrained dark navigation and content surfaces. Reference sites supply no copied assets or branding.

## Register and content

Hybrid: expressive 3D world at `/`, editorial HTML at `/work`, `/work/[slug]`, and `/about`. English first. Client identities are anonymous; never infer personal ownership, release status or business metrics from a repository. Demonstrations use newly written sample data and disclose reconstruction.

## Colour and material

CSS custom properties in `app/globals.css` own DOM tokens. This document records those values; update both together. `city-assets.ts` defines shared architectural parts and materials; `city-plan.ts` owns the current metre-based geography. Daylight uses warm white sunlight over grass #89ac5e, upland green #667b60, stone #d9d7bf, off-white structure #f3eee1, glass #356b74 and sea #337f90 with shallow-water #7bd2bd. Dusk uses a blue sea and warm emissive glazing, including the ring headquarters. Landscape materials intentionally differ from the dark HTML surfaces. DOM background → `--surface`, text → `--ink`, muted → `--muted`, interaction → `--accent`. These CSS tokens remain canonical (ownership model B).

## Typography

The World Pass preserves the original namecard's 320 × 480 proportions, black translucent faces, cyan accents, repeated original logo foil, spectral highlights and pointer tilt. Do not replace this with a paper, green passport or orbital-seal treatment. Visitor information and stamps adapt the content; they do not authorize a new card art direction. Original vector marks live in `public/card`; all URLs use the shared asset-path helper. The creator's original company wordmark appears on the reverse only.

Geist for controls and reading. Geist Mono for place indexes, pass identifiers and quiet navigation metadata. Expressive headings use light-weight Geist emphasis; no serif accents. Case study body text stays sans-serif and readable.

## Layout and hierarchy

Desktop: no header; only a floating World Pass button in the upper-right, small introduction and directory entrance at lower-left, camera tools bottom-centre. Right-side zone sheets present thematic content scenes. Entering a scene brings the camera closer to its actual district without replacing the surrounding city, then exposes project reading. Breadcrumbs provide explicit parent navigation. On mobile, navigation stays accessible, labels shorten to place indexes, and place details use a bounded bottom sheet. Modal case studies use a full-screen mobile reading surface.

## World composition

The survey is 7,168 × 5,120 metres. The opening view frames the 800 × 600 metre central town and its northern summit, not the whole island. Singapore informs separation of residential, civic, airport, passenger, industrial, utility and conservation uses. It is an invented island, not a copy of Singapore.

Town blocks contain 4–8 storey residences, shaded courts, shopfronts, a hawker pavilion, school/sport, clinic, fire station and bus shelters. Northern woodland transitions to a 96 metre diameter white ring lab, 76 metres above the town, with two exterior storeys and B1/B2 at 90/84 metres elevation. The east airport has a 2,400 × 45 metre runway and 37 metre aircraft. Passenger and industrial quays use separate bays. The dive habitat occupies the southeast protected bay.

`city-plan.ts` shares roads, graded profiles, river corridors, flat facility platforms and derived full bridge spans. Roads are rounded at intermediate bends; their surveyed grades are checked against 6% regional / 10% mountain targets. The land is generated after those profiles so road shoulders meet an engineered surface. A nearest-road selection prevents overlapping earthwork blends from burying the road.

## Motion and interaction

Left drag / one finger orbits; right or Shift-drag pans; wheel / pinch zooms. Perspective FOV is 38°. Camera depth precision changes between surface and interior modes. Arrows and HTML controls provide alternatives. Information appears only after selection and closes when exploration resumes. Modal reading, hidden pages, reduced motion and lightweight quality freeze the shared environment clock. Weather, traffic, waves, fish and wind consume that clock without resume jumps. Optional observation speed makes long transport cycles inspectable.

## Asset ownership

Editable sources are `city-plan.ts`, `city-assets.ts`, `city-life.ts`, `CityTerrain.tsx`, `CityLife.tsx` and `CityInteriors.tsx`. `scripts/build-city.mjs` exports 560 256-metre terrain tiles at three resolutions, district instance data, distant silhouettes, water depth and the fallback map. Generated assets carry a source fingerprint in their request URL. No Blender or external model dependency is required.

Near tiles suppress the coarse terrain underneath through an explicit coverage texture. Materials with different shader variants have separate program cache keys. Region assets load on demand; whole-island framing uses simplified buildings. Ocean normals and highlights use the actual perspective camera; sea colour is re-applied after asynchronous depth loading. The dry dock is excluded from the sea surface. Postprocessing uses MSAA, restrained bloom and output colour conversion. Local shadows follow the observed district. Standard quality caps DPR at 1.5; lightweight quality uses DPR 1, lower terrain detail and no animated environment or live shadows.

## Hover and focus

District labels, the HTML zone index and 3D hit proxies share one hover state. Labels reveal a small action caption with a restrained cyan edge. Keyboard focus provides the same feedback. Place labels lift and brighten on hover/focus; on narrow viewports they become numbered 44px targets, while the bottom sheet retains complete project names. Click-vs-drag guards apply to both scene and HTML targets. Reduced motion removes CSS transforms and ambient movement.

## Quality floor

Native buttons/links, keyboard equivalents for dragging, visible focus, labelled form inputs, correct modal focus, reduced motion and a usable static alternative. See UX-CONTRACT.md for behaviour and README.md for validation commands. Avoid interface clutter, excessive decorative cards, anonymous placeholder project claims and full-screen shader effects over the work.

## Intentional evolution — September 30 city revision

The explicit request for VOGT/Meatopia density supersedes the previous graphite landscape and isolated exhibit stages. Dark HTML surfaces and the original pass are preserved; the world changes to a sunlit city with a ring campus. The persistent sidebar is replaced by an on-demand directory so the landscape has room. No external model or texture dependency is introduced. Repeated facade, vegetation and street components share geometry/material instance batches.
