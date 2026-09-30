# WONDERHAO behaviour contract

## Canonical ownership

| Capability       | Owner                                          | Contract                                                                                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Dialogs          | components/world/Dialog.tsx                    | Native modal dialog, labelled title, initial close-button focus, Escape, focus restoration after inert state clears |
| World navigation | components/world/WorldApp.tsx                  | Place/scene/project query parameters, history restoration, direct project access                                    |
| Camera           | components/world/IslandScene.tsx               | Perspective orbit, bounded pan/zoom, surface/interior/water modes, no first-person mode                                             |
| Pass persistence | lib/world/pass.ts                              | Validated versioned local record, anonymous by default, idempotent stamps                                           |
| Feedback         | WorldApp live region and local status messages | Success/error feedback never blocks access to work                                                                  |
| Text input       | WorldPass                                      | Optional nickname, Unicode-safe limit, no personal data requirement                                                 |
| Settings         | WorldApp                                       | Native checkboxes; quality, dusk, weather and reduced motion saved locally                                                   |
| Scrollbars       | app/globals.css                                | Global visible scrollbar baseline, modal scroll ownership, forced-colours support                                   |
| Project content  | lib/world/content.ts                           | One source for directory, overlay and server-readable case page                                                     |

## First visit and return

Generate one random UUID in the browser. The displayed short ID is a souvenir identifier, not a unique global sequence or credential. Persist nickname, UTC first-arrival time, admission and eight possible stamps. Anonymous entry is one action. First entry records Arrival Harbour and plays a skippable short camera approach to the central town. Reduced motion skips travel. Later visits do not reopen admission.

Direct project URLs bypass admission. The pass invitation appears if a first-time visitor subsequently enters the world. A corrupt or unsupported pass is replaced with a valid local pass; unknown stamps are discarded. Storage failures preserve the session and show a local-storage limitation. PNG downloads contain the current pass but cannot restore identity across devices. No database, account, telemetry or fingerprint is used.

## Navigation and reading

`place`, `scene` and `project` are validated against the typed content registry. A project infers its canonical content scene and zone; old project links continue to work. Conflicting or unknown URL parentage produces a recovery notice. Unknown destinations offer a return to the map. World → Zone → Content Scene → Project is the exploration hierarchy. Selecting a zone exposes thematic scenes; entering one smoothly focuses its district in the persistent city and exposes related projects in the HTML sheet. Opening a project shows the canonical shared case content. The Projects directory remains a direct shortcut. Browser history restores place state and saved camera framing. Closing a case returns through its recorded history entry, restoring prior framing. Direct links close to the inferred parent scene. A link to `/work/[slug]` provides a standalone shareable page. Cases are never locked by stamps or games.

The persistent scene is inert during admission and modal reading. Dialogs return focus to their connected trigger. All places are reachable from native HTML buttons and the project directory. Canvas pointers distinguish click from drag; HTML labels are additional controls, not the sole access path.

## Interaction states

Crane: ready → lifted → moved → delivered → explicit reset. No remote side effects. Optical garden: one range input, keyboard-operable, with reset. Dusk: a reversible checkbox/button state. Ambient activity pauses while reading and when hidden; low quality/reduced motion do not schedule an ambient render loop.

## Failure and fallback

WebGL errors retain a schematic map generated from the same terrain and place coordinates and all HTML navigation. The settings panel allows explicit postcard mode. Case and directory routes remain readable without WebGL and render content server-side. Email copy failure leaves the address visible and the mail link available. Pass image failure offers an inline retryable message. Browser-native alert/confirm/prompt are not used.

## Responsive and accessibility

The root world owns a single viewport; editorial pages use natural document scrolling. Mobile sheets scroll internally and do not conceal camera controls. Native controls have visible focus. Every drag operation has button/keyboard alternatives. Follow operating-system reduced motion unless it is stricter than the app preference. No audio autoplays. Modal text remains readable at narrow widths.

## Verification

Unit tests exercise pass parsing, identity stability, duplicate stamps, Unicode names and settings corruption. Content validation checks anonymous public content, route/place references, scene ownership, required assets and the compressed world budget. Browser verification covers admission, return, place selection, crane, optical input, case reading, history, Escape, pass flip/download, mobile layout, dusk and postcard mode. Typecheck, lint and both supported build modes are independent gates.

## City-state modes and persistence

Eight content destination IDs retain the original six and add `airport` / `dive`. Public facilities remain scenery rather than fictional portfolio cases. `level=b1|b2` is valid only at `commons`; `view=underwater` only at `dive`. Invalid combinations produce a recoverable route. Camera snapshots use version 2; legacy coordinates relocate from the current route.

Dive gear is a single optional ISO timestamp on the existing version-1 pass. Collection is idempotent and storage failure preserves session access. Only the underwater view requires gear; portfolio cases remain open. Return to shore is always available. B1/B2 have a persistent exterior exit. Mode entry saves the surface camera; exit restores it, while an explicit different destination overrides restoration. No rain or clouds render underwater.

District loading reports progress and offers retry, town and HTML content on failure. The root WebGL boundary and context-loss handler retain the map and directory. The fallback is a schematic generated from the same survey, not a raster substitute for the render.

Transport is deterministic choreography with disjoint runway/taxi time slots and assigned ship lanes/berths. It is not a general traffic simulation. Observation speed is a temporary visitor control, not persisted. Rendering diagnostics stay inside settings. No measurements are transmitted.
