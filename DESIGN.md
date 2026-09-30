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
  card-floor: "#0d0f12"
  card-raised: "#181a1e"
  card-edge: "#ffffff22"
  card-glow: "#d2d4da"
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
  card: "16px"
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

The inhabited portfolio city occupies roughly 760 × 680 metres. The wider survey retains the existing airfield and shipping approaches, but the land is a compact peninsula, not a full rectangular island. A continuous curved quay ties a waterfront arcade to a shophouse street, a library court, a campus, a hospital and a clustered business skyline. Upper floors step above occupied podiums, while low foreground buildings preserve sight lines. The Ring sits on a terraced foundation at 76 metres with an engineered access road; the coastal observatory is a complete 70 m sphere centred at [480, 3, 390], with a submerged lower hemisphere, excavated seabed foundation, curved observation ribbons and a lateral landing.

`city-architecture.ts` owns designed building families and the architectural palette. `city-buildings.ts` maps 13 existing project slugs to 8 semantic buildings and owns shared sun direction and initial views. Hospitals and worship/residential scenery do not invent projects. The old eight destination IDs remain valid; the airport, passenger/working harbours, crane, optical installation, B1/B2 and underwater habitat remain accessible. The migration translates peripheral assets without scaling their doorways, vehicles or decks.

## Motion and interaction

Left drag / one finger pans on the horizontal ground plane. Rotate is an explicit toggle around the current target; Escape returns to pan. Right drag also rotates. Wheel / pinch zooms with bounded distance. Authored structural volumes and surveyed terrain reject obstructed camera moves without lifting horizontal pans. Mode changes and reading clear residual control inertia. Perspective FOV is 42°. Camera depth precision changes between surface and interior modes. Arrows and HTML controls provide alternatives. Project buildings have restrained DOM name markers; hover/focus identifies the action. Scenery has no empty project card. Building choice opens the shared case content without moving the camera; close restores the settled framing and focus. The directory and contact remain directly visible. Modal reading, hidden pages, reduced motion and lightweight quality freeze the shared environment clock. Weather, traffic, waves, fish and wind consume that clock without resume jumps. Optional observation speed makes long transport cycles inspectable.

## Asset ownership

Editable sources are `city-plan.ts`, `city-assets.ts`, `city-life.ts`, `CityTerrain.tsx`, `CityLife.tsx` and `CityInteriors.tsx`. `scripts/build-city.mjs` exports 560 256-metre terrain tiles at three resolutions, district instance data, distant silhouettes, water depth and the fallback map. Generated assets carry a source fingerprint in their request URL. The original hero models are generated by Blender 5.2 through `scripts/build-landmarks.py`; the deployed GLBs require no Blender installation. `lib/world/landmark-spec.json` owns the offshore dimensions. No external models or textures are used.

Near tiles suppress the coarse terrain underneath through an explicit coverage texture. Materials with different shader variants have separate program cache keys. Region assets load on demand; whole-island framing uses simplified buildings. Ocean geometry concentrates vertices near the city, with low-frequency displacement, analytic wave slopes, distance-filtered capillary detail, depth colour and Fresnel sky response. The sun direction is shared by the sky, directional light, water and baked window environment; sea colour is re-applied after asynchronous depth loading. The dry dock is excluded from the sea surface. Postprocessing uses MSAA, restrained bloom and output colour conversion. Local shadows follow the observed district. Standard quality caps DPR at 1.5; lightweight quality uses DPR 1, lower terrain detail, one in three simplified woodland trees and no animated environment or live shadows.

## Hover and focus

UI card containers use a shared graphite material: near-black #0d0f12, raised grey #181a1e and a #ffffff22 resting edge. `app/globals.css` owns `--card-*` tokens; `data-card-surface` applies the material to project cards, full demo windows, place sheets, dialogs and floating control/status containers. Standard cards have 16px corners, dialogs 20px, toolbars 12px and small status containers 10px; full-screen mobile dialogs retain square corners. World Pass faces retain their original foil art over a translucent black material.

`components/ui/CardLighting.tsx` owns delegated mouse tracking across all routes and dynamically mounted dialogs. A 180px radial edge light and wider, dimmer interior light follow the mouse; distance naturally determines which edge segment lights and its intensity. Activation fades over 220ms; cards do not move. Mouse tracking requires a fine hover pointer and ignores touch, inert regions and system/app reduced motion. Touch devices receive a slightly raised static material and momentary feedback when a child action is pressed. Keyboard focus provides a fixed top-centre light and the existing visible focus outline. Static content and actions never depend on hover. Forced-colours mode uses system surfaces and visible borders.

District labels, the HTML zone index and 3D hit proxies share one hover state. Labels reveal a small action caption with a restrained cyan edge. Keyboard focus provides the same feedback. Place labels lift and brighten on hover/focus; on narrow viewports they become numbered 44px targets, while the bottom sheet retains complete project names. Click-vs-drag guards apply to both scene and HTML targets. Reduced motion removes CSS transforms and ambient movement.

## Quality floor

Native buttons/links, keyboard equivalents for dragging, visible focus, labelled form inputs, correct modal focus, reduced motion and a usable static alternative. See UX-CONTRACT.md for behaviour and README.md for validation commands. Avoid interface clutter, excessive decorative cards, anonymous placeholder project claims and full-screen shader effects over the work.

## Intentional evolution — September 30 city revision

The explicit request for VOGT/Meatopia density supersedes the previous graphite landscape and isolated exhibit stages. Dark HTML surfaces and the original pass are preserved; the world changes to a sunlit city with a ring campus. The persistent sidebar is replaced by an on-demand directory so the landscape has room. No external model or texture dependency is introduced. Repeated facade, vegetation and street components share geometry/material instance batches.

## World-as-UI acceptance — September 30

The city combines original Blender-built landmarks and procedural architecture, with shared opaque window/mullion batches and no purchased, downloaded or scraped models. The sky uses a world-direction shader with layered cloud density; it is not a screen-fixed sun. A separate horizon overview deliberately frames the sun. Standard quality uses finite local shadows and a small baked reflection environment; low quality is a still scene at DPR 1. A still postcard and server-rendered project routes preserve reading access. Runtime timings are measured locally, never transmitted; see `WORLD-VISUAL-UPGRADE.md` for current measurements and verification boundaries; `CITY-REBUILD-AUDIT.md` is historical.

Durable DOM palette and original World Pass remain unchanged. Building markers and direct work/contact links use the existing dark coastal navigation material and cyan accent. New styles live at the end of `app/globals.css`; project dialogs reuse the canonical `Dialog` and `ProjectContent` owners.

## Whole-world material and landmark revision — October 1

The explicit spherical-building brief supersedes the former vertical disk interpretation. `landmark-spec.json` defines the spherical volume used by the imported model, hit region, camera clearance and water contact. The generated GLB includes the complete lower hemisphere, gravity foundation, bearing piers, airlock and small side landing. Curved windows replace patches of shell; they use opaque reflective glass for stable sorting and bounded cost. A sphere-only analytic water reflection is a silhouette approximation, not a claim of scene reflection or ray tracing.

The Ring now has continuous annular slabs, coping and curved glazing, with a planted inner garden. B1/B2 retain the separate existing cutaway. Pressure habitat and swept ship hulls also come from Blender. Standard and lightweight hero GLBs are deterministic exports with material batches, explicit asset ownership, load errors/retry and teardown disposal. `landmark-version.ts` fingerprints source changes after exports finish.

Terrain uses a continuous world-space PBR field: height, slope and coastal masks choose grass/soil, rock, dry/wet sand; correlated grain/strata affect colour, roughness and bump. This avoids UV stretching and tile-dependent material boundaries. Fine detail fades with distance. Architectural glazing has restrained per-pane variation; paving and terracotta have distinct surface structure. This is procedural PBR, not photographed/baked texture production.

Coastal circulation has an upper quay and a lower tidal walk, two stair connections and angular armourstone. The east research approach reaches the sphere's fixed side landing. Rain trees have spreading layered crowns; palms use curved opaque fronds with individual leaflets. Clinic, campus, residential and historic-building details follow their function. The DOM palette, typography, World Pass and content ownership are unchanged.

The shared sun direction is [-0.65, 0.42, -0.68]. Clear afternoon light is warm white with restrained ambient fill. The horizon preset permits a near-horizontal view of the shared sun and sea; ordinary map panning remains horizontal. Near-shore wave exposure is lower than open sea. No renderer migration or new runtime dependency was introduced.
