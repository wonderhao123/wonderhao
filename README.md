# WONDERHAO

An explorable creator island and portfolio, built with Next.js, React Three Fiber, Three.js and procedural TypeScript geometry. Eight zones and twelve content scenes connect anonymous software case studies, interface work and small interactions.

## Run

```sh
npm ci
npm run generate:city
npm run dev
```

Open the address printed by Next.js. `/` is the island; `/work` is the complete directory; `/work/[slug]` is a shareable case; `/about` contains the maker and contact information. The World Pass is local to each browser.

## Verify

```sh
npm run check:content
npm test
npm run typecheck
npm run lint
npm run build
STATIC_EXPORT=true npm run build:static
```

The default build targets the existing Cloudflare/OpenNext configuration. Static export uses `/wonderhao`; deploy `out` beneath that path with HTML route resolution. Do not serve it at `/` without the corresponding base-path build. Preview and deployment commands remain available, but deployment is a separate action.

## Edit content

`lib/world/content.ts` holds the typed public project and place registry. Both the world and editorial routes share it. Use anonymous public titles, evidence-bounded roles and project status. Original client names, internal source paths, private evidence and real customer data do not belong here. The interactive previews are explicitly labelled editorial reconstructions.

## Rebuild the world

The world is generated entirely in code. Edit geography in `lib/world/city-plan.ts`, buildings in `lib/world/city-assets.ts`, and transport in `lib/world/city-life.ts`. Repeated facades, vegetation and street furniture use shared geometry. Terrain, regional objects and the fallback map come from the same survey.

```sh
npm run generate:city
npm run check:content
```

The generator creates terrain tiles, district objects and the static schematic fallback. The map is a schematic, not a render of the 3D scene. Generated runtime assets remain in `public/world/city` so local previews can load them without a build.

World → Zone → Content Scene → Project is encoded by `place`, `scene` and `project` query parameters. `lib/world/navigation.ts` resolves parentage and preserves legacy links. The directory remains a shortcut to every case.

## Important boundaries

- Pass numbers are personal identifiers, never a claim about global arrival order.
- No backend, account, analytics or fingerprinting is added.
- Downloaded passes are souvenirs, not identity backups.
- Reduced motion, low quality and postcard mode preserve access to all work.
- Refer to DESIGN.md and UX-CONTRACT.md before changing durable visual or interaction behaviour.

## City survey and generated assets

`lib/world/city-plan.ts` is the 7.168 × 5.120 km metre-based survey. `city-assets.ts` generates architecture and `city-life.ts` owns deterministic transport. Run `npm run generate:city` after changing either survey or static parts; build hooks do this automatically. Generated tiles and district JSON live under `public/world/city`.
