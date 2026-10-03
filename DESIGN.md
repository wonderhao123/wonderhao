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

The World Pass preserves the original namecard's 320 × 480 proportions, black translucent faces, cyan accents, a single HAO foil emblem in the lower-right corner, fine-grained diffraction bands and a localized pointer-driven silver glint masked to that logo shape, with pointer tilt. Do not replace this with a paper, green passport or orbital-seal treatment. Visitor information and stamps adapt the content; they do not authorize a new card art direction. The canonical brand vector is `public/hao-logo.svg`; the pass uses the canonical vector directly for its single foil emblem. All URLs use the shared asset-path helper. The pass and its PNG souvenir use this mark without a company wordmark.

Geist for controls and reading. Geist Mono for place indexes, pass identifiers and quiet navigation metadata. Expressive headings use light-weight Geist emphasis; no serif accents. Case study body text stays sans-serif and readable.

## Layout and hierarchy

Desktop: no header; only a floating World Pass button in the upper-right, small introduction and directory entrance at lower-left, camera tools bottom-centre. Right-side zone sheets present thematic content scenes. Entering a scene brings the camera closer to its actual district without replacing the surrounding city, then exposes project reading. Breadcrumbs provide explicit parent navigation. On mobile, navigation stays accessible, labels shorten to place indexes, and place details use a bounded bottom sheet. Modal case studies use a full-screen mobile reading surface.

The first arrival shows the centered World Pass hanging from a charcoal woven lanyard and silver clip beneath the quiet brand/work navigation. It drops from above, catches on an elastic tether and settles; dragging the card or clip releases a damped physical swing. The HTML card keeps its editable name, links, foil and accessible controls. The visitor name is edited directly on the card; a blinking caret hints at editing and stays static with reduced motion. The card’s Explore action lights the sensor, briefly loads the strap, then pulls the pass and lanyard rapidly upward with increasing speed before fading the arrival veil. Entry never spins or flips the pass. Reduced motion shows a stationary hanging pass and uses only a short fade for entry; the simulation sleeps when settled and pauses while the page is hidden. The action opens the world, while quick horizontal swipes, taps on either card face and the keyboard-accessible reverse controls reveal the journal. Name editing, entry and external links retain their own actions. No separate name form or entry button below the card.

## World composition

The inhabited portfolio city occupies roughly 760 × 680 metres. The wider survey retains the existing airfield and shipping approaches, but the land is a compact peninsula, not a full rectangular island. A continuous curved quay ties a waterfront arcade to a shophouse street, a library court, a campus, a hospital and a clustered business skyline. Upper floors step above occupied podiums, while low foreground buildings preserve sight lines. The Ring sits on a terraced foundation at 76 metres with an engineered access road; the coastal observatory is a complete 70 m sphere centred at [480, 3, 390], with a fully glazed lower hemisphere, an excavated basin, an annular promenade on eight seabed piles and a lateral landing.

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

The explicit spherical-building brief supersedes the former vertical disk interpretation. `landmark-spec.json` defines the spherical volume used by the imported model, hit region, camera clearance and water contact. The generated GLB includes a fully glazed lower hemisphere, airlock, side landing and a continuous promenade on eight perimeter piles. The former opaque pressure hull, central gravity foundation and independent landing piles have been removed. Curved glass spans the full sphere as one transparent material batch. A sphere-only analytic water reflection is a silhouette approximation, not a claim of scene reflection or ray tracing.

The Ring now has continuous annular slabs, coping and curved glazing, with a planted inner garden. B1/B2 retain the separate existing cutaway. Pressure habitat and swept ship hulls also come from Blender. Standard and lightweight hero GLBs are deterministic exports with material batches, explicit asset ownership, load errors/retry and teardown disposal. `landmark-version.ts` fingerprints source changes after exports finish.

Terrain uses a continuous world-space PBR field: height, slope and coastal masks choose grass/soil, rock, dry/wet sand; correlated grain/strata affect colour, roughness and bump. This avoids UV stretching and tile-dependent material boundaries. Fine detail fades with distance. Architectural glazing has restrained per-pane variation; paving and terracotta have distinct surface structure. This is procedural PBR, not photographed/baked texture production.

Coastal circulation has an upper quay and a lower tidal walk, two stair connections and angular armourstone. The east research approach reaches the sphere's fixed side landing. Rain trees have spreading layered crowns; palms use curved opaque fronds with individual leaflets. Clinic, campus, residential and historic-building details follow their function. The DOM palette, typography, World Pass and content ownership are unchanged.

The shared sun direction is [-0.65, 0.42, -0.68]. Clear afternoon light is warm white with restrained ambient fill. The horizon preset permits a near-horizontal view of the shared sun and sea; ordinary map panning remains horizontal. Near-shore wave exposure is lower than open sea. No renderer migration or new runtime dependency was introduced.

## City and watershed reconstruction — October 1

The next-spec revision supersedes the compact 760 × 680 m peninsula and persistent building labels. The inhabited parcel footprint now spans approximately 1.87 × 1.17 km including the old waterfront; north, west and east ridges frame an open southern bay. The original 38 independent city buildings are joined by 144 surveyed parcels, including 22 new towers, with mixed shop/apartment/office frontages. Connected campus and archive wings count as one building each. The Ring, offshore sphere and all 13 real project mappings retain their identities. Forest Observatory and Watershed Field Station are scenery destinations, not invented projects.

`city-plan.ts` owns parcel elevations, 55 connected roads, mountain nodes and the terrain survey. `city-architecture.ts` uses a shared wall/eave construction helper for pitched buildings. `city-buildings.ts` derives project hit volumes from tagged structural geometry. `MountainPlaces.tsx` owns the editable continuous spiral ramp, diagrid, rails, radial joists and research cabins. All assets remain original deterministic geometry; no third-party model or texture was imported.

Resting views have no project label field. Mouse hover and directory/keyboard focus expose one small card; touch first selects, then the card opens cases. Batched geometry retains per-part building ownership. MSAA alpha coverage fades other architecture and foliage without transparent sorting or per-building draw calls; terrain, roads and primary quay remain spatial anchors. The existing dialog, URL/history and focus restoration remain canonical.

Night uses stable room-cell occupancy, restrained warm/neutral glazing, a reusable world-space illumination field aligned to road lamps, and two fixed non-shadowed point lights. Fine woodland crowns use a shared low-detail crown in the distance; quality modes preserve all parcels and ridges. Static shadows update at a bounded cadence or on camera movement.

The first-view barrier requires committed terrain tiles, water survey, city regions, visible hero assets and context-specific transport hulls, followed by `WebGLRenderer.compileAsync`, a complete compositor frame and a GPU fence. No partial scene is drawn before preparation. The original opening/pass absorbs preparation; required failures retain an opaque mask with retry, lightweight and static work access. Offscreen terrain may still stream after arrival using a complete coarse survey and sealed LOD boundaries.

## Night lighting reference revision — October 1

The photographic references establish a cool, dark city silhouette with warm illuminated carriageways, varied room occupancy and occasional cool public-space light. Window apertures now preserve dark frames and horizontal caps; stable building-level colour and floor/room occupancy replace luminous wall-sized checker cells. Road-aligned overlapping irradiance replaces repeated white circular spots, with lower intensity on mountain roads and soft verge falloff. A single 1024² RGBA field covers the city and airport; this is a bounded lighting approximation, not per-lamp shadows or a scene reflection. Night sky, fog, ambient light, reflection environment and sea share a restrained blue palette. Afternoon lighting and geometry remain unchanged by this revision. Evidence and limits are in `NIGHT-LIGHTING-REVIEW.md`.

## The Ring: inward crown and armillary court — October 3

The supplied circular-campus reference supersedes the straight-sided Ring and sparse cross-path garden. The three-storey curtain wall leans inward by 2.6 m; a broad porcelain-white radial crown sweeps between the 31.7 m inner opening and 47.4 m outer edge. The October 3 armillary references replace the axial pavilion with a central fountain: an eight-point limestone pedestal, champagne-bronze tilted orbits, open aquamarine ribbons and a luminous pearl nucleus. The sculpture is centred at local [0, 0], rises approximately 15.7 m and sits in a 20.5 m diameter shallow basin. Concentric paving, four diagonal rills, crescent planting beds, curved seats and sixteen trees frame an open gathering space. Four axial approaches and the perimeter promenade stay clear. Courtyard geometry belongs entirely to the Ring asset, avoiding overlap with regional planting. The original campus approach and separate B1/B2 exhibition cutaways remain.

The purple reference is expressed through two continuous 0.14 m radius light tubes attached to the inner and outer roof edges. `scripts/build-landmarks.py` owns their material colour and authored emission; `LandmarkAsset.tsx` restores that authored intensity at night and uses 13% in daylight. The sculpture's aqua and pearl emission uses 24% in daylight; bronze has a restrained fixed dusk response. Existing bloom supplies the halo without new point lights or animation loops. Both standard and lightweight GLBs contain the same architecture, courtyard and complete light loops, with thirteen opaque material batches (three for the sculpture) and no external textures. Water ribbons and small fountain arcs are stylised static geometry, with open gaps rather than overlapping transparent shells. Targeted model export is available with `-- --only ring`.

## Coastal districts and airport — October 1

The airport now has a slender control tower with a glazed panoramic cab, roof overhang and beacon. Runway edges, centreline, thresholds/end bars and blue/green taxi guidance share a surveyed layout. Six flood masts illuminate the apron and hangars. Guidance uses one depth-tested point batch, including lightweight mode, rather than hundreds of real-time lights.

The diving facility connects to a graded crescent beach east of the observatory. Four seafront hospitality pavilions, covered dining terraces, forty parasols, paired loungers, palms, lifeguard shelters, a volleyball court and kayaks give the shoreline an active leisure use. The promenade, connecting bank cut, sandy foreshore and shallow water derive from the same shoreline function. The sphere excavation and existing underwater habitat remain deep and accessible.

Harbour Works is an industrial container terminal with lane-separated stacks, three portal shore cranes, a moored feeder, warehouses and the original repair basin/travel lift. Cruise and ferry berths remain in Arrival Harbour; an independent eastern floating marina contains ten small leisure boats, fingers, a clubhouse and supported quay. Existing vessel routes and berth locations remain canonical.

Fifty-eight surveyed coastal fixtures drive both physical masts and the existing irradiance atlas. Its alpha channel now records the flood contribution so coastal light preserves material colour and reaches elevated crane structures. Two fixed local point lights serve the observatory landing and forest tower; their positions and powers are independent of the camera. Observatory shell fill and bronze accents remain visible from the overview. Water samples the shared atlas for restrained broken shore-light streaks; this is an approximation, not ray tracing or physically certified airport lighting. No runtime dependency was added.

## Camera-independent night lighting — October 1

A user recording exposed abrupt sphere highlights and beach pools while panning. Selecting the nearest two sources from the camera target reassigned positions and powers at spatial boundaries (including a 7000-intensity sphere-top source). That selection and frame callback are removed. The shared world-space atlas remains the area-light owner; two fixed, bounded fills stay at the surveyed observatory landing and forest tower. Camera motion must never turn physical scene lamps on/off or change their power. `tests/browser/night-lighting.js` checks the former boundary sweep, actual pointer dragging and the day/night toggle against live Three light state.

## Glass observatory pavilion and marine promenade — October 3

The user's waterfront glass-sphere references supersede the closed titanium exterior and two broad bronze bands. The entire sphere now uses a continuous curved glass curtain wall, 24 full-height meridian mullions and matching sets of 15 silver horizontal belts above and below water. Upper and lower glass use the same clear opacity; the former extra opaque crown shader is removed so both halves share the interior sightline. The 70m diameter, excavated basin, east airlock and connecting pier remain. A 6.8m-wide annular promenade surrounds the waterline: warm deck, fine radial bronze inlays, slender curved rails, benches and recessed edge lights. Exactly eight 0.82m-radius piles at radius 39.1m descend to -42m; forked bearing heads carry the ring. No central foundation or additional landing piles remain.

The interior is one vertically connected room. Seven narrow perimeter balconies at local Y 17.12, 9.52, 1.82, -6, -13.8, -21.6 and -29.4m share a central void above the bottom observation floor at -32m. A continuous 3.3m-wide winding stair, with risers no higher than 175mm, twin stringers, rails and radial landings joins every level. The solid waterline slab and central desk are removed; seating stays around the perimeter. Geometry raycasts verify reciprocal sightlines through the central room. Both quality tiers retain the complete staircase without decimation, while the shell and other details retain their usual LOD. Interior lighting follows the fixed balcony edges and stair structure. Glass remains the sole transparent batch, with depth writing and shadow casting disabled. The model now uses ten material batches. The existing water shader already excludes water from the sphere interior; no new artificial interior water plane is introduced. The Sphere opens at the surface even after collecting a dive kit, with the existing descent control below its description. Surface close inspection and near-vertical rotation are allowed; underwater orbit can look upward while shell/seabed collision remains active. Eight fixed searchlights hang outside the pile axes at radius 41.65m and aim outward/down toward the surveyed basin; world-space positions and power never depend on the camera. Real bounded spotlights light the seabed and an instanced fish school in underwater mode; soft cone meshes suggest suspended-water scattering without volumetric simulation or shadow-map passes. The lightweight tier keeps all eight lamps and reduces the school from 64 to 24 fish. `landmark-spec.json` is the shared source for model dimensions, pile feet and lamp axes. Dive Centre → The Sphere exposes the underwater view through the existing equipment and return flow.

## CHIJMES-inspired heritage quarter — October 1

The former freestanding church plot is a coherent garden precinct: a white Gothic chapel to the west, two-storey open pointed cloisters to the north/east, a lower classical garden house to the south, and a central lawn with dining terraces. Slate spires, terracotta wing roofs, warm ivory plaster and restrained coloured lancets give each building an identity. Real arcade openings, connected flying buttresses, supported eaves and low perimeter gates must remain legible in every quality mode. Keep public entrances clear and the lawn open. Night lighting uses fixed warm facade/path light and continuous coloured window panes, not office-style random window patterns. This is a site-adapted reference design, not a surveyed CHIJMES replica. See [reference analysis](docs/chijmes-quarter/design.md).

## Shared city, landscape and transport detail — October 2

Extend the landmark material language through existing city geometry. Thin glazing receives projecting sills, aluminium reveals and continuous vertical mullions shared across aligned storeys. Glass uses a consistent roughness/environment response and a small view-dependent room-depth approximation; this does not create navigable interiors or reflections of actual neighbouring buildings. Structural silhouettes, owners, parcels and routes remain canonical.

Terrain combines metre-scale grass variation, derivative-filtered blade/ripple detail, warm dry sand and darker wet sand. Rock/soil/slope masks and the surveyed shoreline remain intact. Tree crowns use tinted overlapping leaf sprays with supporting branches, retaining a cheaper distant crown. Broken foam fronts follow the existing shallow-water field.

Cars and buses have rounded bodies, framed cabins, mirrors, lamps, grilles and rotating wheel hubs. Aircraft use a lathed fuselage, swept wings, winglets, open engine lips/fans and gear. Ships retain the authored hull with batched deck windows, railings, portholes, lifeboats and equipment. Procedural source lives in `lib/world/transport-geometry.ts`; fittings merge into at most eight material meshes per body/deck, with separately animated wheels. No new runtime dependencies or external assets.

## The Cube: offshore trench — October 3

The Cube is a perfect 56 m solid at [980, -36, 1120], approximately 1 km from the dive centre. Its top remains 8 m below sea level. The lower portion intersects a roughly -56 m trench floor; the eastern side disappears into a rock wall rising to roughly -16 m. `cubeSite` and `cubeTrenchHeight` in `city-plan.ts` own the dimensions and survey. Generated terrain tiles, water depth and the close underwater terrain use that same survey.

The six planar faces are uninterrupted pale ceramic: no bevel, doors, windows, seams, weathering, growth, decals or decorative edges. `TheCube.tsx` uses one native box with twelve triangles in both qualities. Dusk makes the whole solid emit cold white light; a fixed local material wash reaches nearby rock without adding point lights. The surface sea uses a bounded refracted ray/box approximation with depth attenuation and surveyed rock occlusion, so the light is visible through the water. This is not full-scene transmission or volumetric transport. The trench has a darker, longer-range underwater fog than the shallow reef, with its own camera framing and clearance.

The existing Island directory and Dive Centre expose The Cube as scenery, not a new portfolio case. Surface inspection is available immediately; the existing dive kit unlocks descent and the persistent return control restores the surface view. Preserve the thirteen real project identities and the Ring/Sphere experiences.


### Stable scene finishing

The HDR postprocessing chain uses single-sample render targets and a final FXAA pass after tone mapping. Browser A/B probes exposed intermittent transparent output while resolving multisampled targets during camera motion; single-sample output removed that failure. Opaque focus materials use Three alpha hashing to retain batched focus fades without depending on sample coverage. Bloom, bounded world lights, demand rendering and preparation barriers retain their ownership. No persistent drawing-buffer workaround or renderer debug hooks are shipped. `tests/browser/scene-finish.js` samples final pixels during real day/night pointer drags and zooms, checking both transparent output and full black frames.
