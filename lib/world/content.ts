export type PlaceId =
  "arrival" | "works" | "commons" | "archive" | "atelier" | "station" | "airport" | "dive";
export interface Place {
  id: PlaceId;
  name: string;
  short: string;
  number: string;
  position: [number, number, number];
  description: string;
  stamp: string;
}
export interface Project {
  slug: string;
  title: string;
  category: "Systems" | "Tools" | "Research" | "Design" | "World";
  place: PlaceId;
  summary: string;
  role: string;
  status: string;
  stack: string[];
  problem: string;
  decisions: { title: string; body: string }[];
  outcome: string;
  preview: "orders" | "notes" | "workflow" | "world" | "gallery";
  color: string;
  featured?: boolean;
}
export const places: Place[] = [
  {
    id: "arrival",
    name: "Arrival Harbour",
    short: "The harbour",
    number: "01",
    position: [100, 8, 1510],
    description:
      "Every visit begins by the water. Pick a direction, take your time, and make this little island your own.",
    stamp: "ARRIVED",
  },
  {
    id: "works",
    name: "Harbour Works",
    short: "Harbour works",
    number: "02",
    position: [-1890, 9, 1330],
    description:
      "The working edge of the island. A place for systems that move things forward, from an order to its final delivery.",
    stamp: "BUILDER",
  },
  {
    id: "commons",
    name: "The Ring",
    short: "The ring campus",
    number: "03",
    position: [80, 96, -680],
    description:
      "A white ring above the town. An independent studio, an underground exhibition lab, and a place to understand how this world is made.",
    stamp: "NEIGHBOUR",
  },
  {
    id: "archive",
    name: "Archive Grove",
    short: "Archive grove",
    number: "04",
    position: [-520, 24, -270],
    description:
      "A quiet place for thoughts to return. Explore tools for finding meaning in information and making room for focus.",
    stamp: "THINKER",
  },
  {
    id: "atelier",
    name: "Atelier Quarter",
    short: "The atelier",
    number: "05",
    position: [225, 20, 165],
    description:
      "An open studio for interfaces, identities and small experiments. Come for the details. Stay for the light.",
    stamp: "OBSERVER",
  },
  {
    id: "station",
    name: "Field Station",
    short: "Field station",
    number: "06",
    position: [-240, 39, -610],
    description:
      "Where the path meets the mountain. Experiments in resilient software, connected systems and world building.",
    stamp: "EXPLORER",
  },
  {id:"airport",name:"East Coast Airport",short:"Airport",number:"07",position:[2150,14,-80],description:"A gateway on the eastern shore. Watch arrivals, departures and the ground operations between them.",stamp:"AVIATOR"},
  {id:"dive",name:"Dive Centre",short:"Dive centre",number:"08",position:[1540,7,1650],description:"Beyond the working harbours, a quieter bay. Collect your dive kit and discover the living reef below.",stamp:"OCEAN"},
];
export const projects: Project[] = [
  {
    slug: "merchant-operations",
    title: "From order to doorstep",
    category: "Systems",
    place: "works",
    featured: true,
    summary: "A shared operating space for commerce, inventory and fulfilment.",
    role: "Full-stack development, requirements discovery and delivery, in collaboration with merchant operations.",
    status: "Client project · anonymised",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Background jobs"],
    problem:
      "Orders arrive from different marketplaces, but the warehouse needs one understandable sequence of work. The interface must connect orders, stock and fulfilment without hiding the state of a job.",
    decisions: [
      {
        title: "One operational vocabulary",
        body: "Bring marketplace orders into a shared order and fulfilment model. Source-specific details stay available without forcing staff to learn a different workflow for every channel.",
      },
      {
        title: "Make work recoverable",
        body: "Represent fulfilment operations as explicit jobs with inspectable status. A delayed integration should be visible and actionable, rather than disappearing behind a loading indicator.",
      },
      {
        title: "Design around the people doing the work",
        body: "Requirements and acceptance feedback came from merchant operations and warehouse users. Inventory records, order details and audit history support the decisions they need to make.",
      },
    ],
    outcome:
      "Used by a real merchant, as reported by the project owner. This case describes implemented workflows; no throughput or efficiency improvement is claimed.",
    preview: "orders",
    color: "#497f7c",
  },
  {
    slug: "optical-ordering",
    title: "A clearer path through fulfilment",
    category: "Systems",
    place: "works",
    featured: true,
    summary:
      "Connecting B2B ordering, stock reservation and warehouse quality checks.",
    role: "Software implementation and key engineering decisions within a collaborative project.",
    status: "Client project · anonymised",
    stack: ["NestJS", "PostgreSQL", "Flutter", "Next.js"],
    problem:
      "A specialist ordering system must connect a customer request to stock, quality control and dispatch. Those steps need to agree even when requests are repeated or external systems are unavailable.",
    decisions: [
      {
        title: "Reserve stock deliberately",
        body: "Atomic inventory updates and explicit order states make the boundary between available stock and committed stock visible.",
      },
      {
        title: "Keep integration work inspectable",
        body: "Durable integration jobs and idempotent handling make repeated work recoverable. The inspected vendor adapters use mocks; this case does not claim verified live ERP or courier integration.",
      },
      {
        title: "Separate roles, connect the journey",
        body: "Customer ordering and staff workspaces share domain contracts while presenting the actions appropriate to each role.",
      },
    ],
    outcome:
      "Web and mobile release is project-owner reported. The case focuses on the implemented order lifecycle and warehouse boundaries, without claiming independently verified production integrations.",
    preview: "workflow",
    color: "#7d8870",
  },
  {
    slug: "workspace-knowledge",
    title: "A place for the important details",
    category: "Tools",
    place: "archive",
    featured: true,
    summary:
      "Cases, notes and shared reference information, held together in one workspace.",
    role: "Software implementation and key product decisions within a collaborative project.",
    status: "Client project · anonymised",
    stack: ["Next.js", "PostgreSQL", "Flutter", "TypeScript"],
    problem:
      "Operational knowledge is often scattered between cases, reusable notes and reference records. A useful workspace has to help people find the right information while keeping permissions and field visibility understandable.",
    decisions: [
      {
        title: "Organise around the work",
        body: "Cases, notes and collections provide distinct ways into the same operational context. Search and filtering support retrieval without making people memorise where something was filed.",
      },
      {
        title: "Treat visibility as a boundary",
        body: "Workspace permissions and field visibility belong in the data access model. Interface states explain access without making hidden controls the security mechanism.",
      },
      {
        title: "Keep web and mobile in agreement",
        body: "Mobile APIs expose the same canonical resources. Notes are represented as notes, rather than quietly borrowing unrelated template endpoints.",
      },
    ],
    outcome:
      "Application release is project-owner reported. The documented implementation supports workspace organisation and controlled sharing; adoption and time-saving metrics are not asserted.",
    preview: "notes",
    color: "#7c8063",
  },
  {
    slug: "private-notebook",
    title: "Room to think, offline",
    category: "Tools",
    place: "archive",
    featured: true,
    summary: "A private notebook where ideas remain on your own device.",
    role: "Product and application development in a collaborative project.",
    status: "Client project · anonymised",
    stack: ["Flutter", "SQLite", "On-device search", "Encrypted backup"],
    problem:
      "A notebook should remain useful without a network connection or an account. Search, context and recovery must work around the user’s own local collection.",
    decisions: [
      {
        title: "Local is the default",
        body: "Notes live in an on-device SQLite vault. Capture and text search remain available without remote AI calls, accounts or automatic cloud sync.",
      },
      {
        title: "Make intelligence optional",
        body: "An optional on-device embedding model supports semantic retrieval. Declining the model terms or a model failure does not prevent ordinary note-taking.",
      },
      {
        title: "Recovery is part of the product",
        body: "Versioned encrypted exports, validation before restore and explicit replacement confirmation protect an existing notebook during backup recovery.",
      },
    ],
    outcome:
      "The implementation includes local capture, linked contexts, source-backed composition and encrypted backup. No independent security certification or search-quality benchmark is claimed.",
    preview: "notes",
    color: "#8b7864",
  },
  {
    slug: "field-operations",
    title: "Work continues without a signal",
    category: "Research",
    place: "station",
    summary:
      "An offline-first field incident system built around recoverable state.",
    role: "Software engineering research and implementation.",
    status: "Pre-release research",
    stack: ["Kotlin", "Compose", "Room", "Spring"],
    problem:
      "Field work cannot assume a stable connection. Local edits, later synchronisation and conflicting information need explicit behaviour.",
    decisions: [
      {
        title: "Durable local work",
        body: "Local storage and a synchronisation boundary separate completing work from successfully contacting a server.",
      },
      {
        title: "Expose conflicts",
        body: "Conflicting updates require a reviewable decision, not a silent last-write-wins assumption.",
      },
    ],
    outcome:
      "Pre-release engineering work. Reliability goals and intended architecture are not presented as production operating results.",
    preview: "workflow",
    color: "#787f88",
  },
  {
    slug: "campus-systems",
    title: "A campus, connected",
    category: "Research",
    place: "station",
    summary:
      "Course planning, room booking and wallet operations across web and native mobile.",
    role: "Software engineering and reference product implementation.",
    status: "Local reference demo · pre-release",
    stack: ["Kotlin", "Spring Boot", "Compose", "React"],
    problem:
      "Campus services share people and permissions, but registration, room reservations and accounting each have different consistency requirements.",
    decisions: [
      {
        title: "Respect domain boundaries",
        body: "Booking actions, course registration and wallet accounting use their own explicit invariants within a modular backend.",
      },
      {
        title: "Show what is actually demonstrated",
        body: "The reference campus is labelled as a local demo. Public production release remains gated; offline policy replay is not evidence of live AI quality.",
      },
    ],
    outcome:
      "A documented local reference demonstration. Public production readiness is not claimed.",
    preview: "workflow",
    color: "#8b8271",
  },
  {
    slug: "creative-operations",
    title: "From brief to approval",
    category: "Design",
    place: "atelier",
    summary:
      "A collaborative workspace for design assignments, assets and approvals.",
    role: "Collaborative application development.",
    status: "Selected client work · anonymised",
    stack: ["Next.js", "TypeScript", "Prisma"],
    problem:
      "Creative work passes between requesters, designers and reviewers. Each person needs to understand ownership and the next decision.",
    decisions: [
      {
        title: "A visible handover",
        body: "Role-scoped assignments and approvals connect the brief, assets and review outcome.",
      },
      {
        title: "Context travels with the task",
        body: "Brand and outlet information stay attached to the work instead of depending on a separate conversation.",
      },
    ],
    outcome:
      "This selection presents the workflow and interface concerns, with reconstructed sample data rather than client records.",
    preview: "workflow",
    color: "#b18a70",
  },
  {
    slug: "desktop-payroll",
    title: "Making month-end legible",
    category: "Tools",
    place: "works",
    summary:
      "A local desktop workspace for payroll preparation, review and closing.",
    role: "Collaborative desktop application development.",
    status: "Selected client work · anonymised",
    stack: ["Tauri", "Rust", "React", "SQLite"],
    problem:
      "Closing a payroll period depends on complete attendance, reviewable calculations and controlled outputs.",
    decisions: [
      {
        title: "Make closing a sequence",
        body: "Preparation, calculation snapshots, approvals and locks are explicit steps rather than a single irreversible button.",
      },
      {
        title: "Keep records close",
        body: "Local persistence, import tools and audit history support repeatable review.",
      },
    ],
    outcome:
      "A workflow case study, not an independent audit of statutory or payroll calculation accuracy.",
    preview: "workflow",
    color: "#7d8f85",
  },
  {
    slug: "member-mobile",
    title: "A better first attempt",
    category: "Design",
    place: "atelier",
    summary:
      "A mobile warranty flow that validates before uploading supporting images.",
    role: "Flutter mobile flow implementation, collaborating with a separately authored backend API.",
    status: "Selected client work · anonymised",
    stack: ["Flutter", "Mobile APIs", "Media upload"],
    problem:
      "Uploading images before validating a submission creates avoidable failures and orphaned files.",
    decisions: [
      {
        title: "Validate before upload",
        body: "The mobile flow calls the backend validation endpoint before beginning media upload.",
      },
      {
        title: "Explain the next step",
        body: "Validation feedback keeps the user in context and directs a correction before expensive work begins.",
      },
    ],
    outcome:
      "The mobile integration is the contribution described here. Backend validation implementation is not attributed to the portfolio owner.",
    preview: "workflow",
    color: "#799496",
  },
  {
    slug: "social-map",
    title: "From a place to a plan",
    category: "Design",
    place: "atelier",
    summary:
      "Exploring a map-led path from finding friends to arranging a meet-up.",
    role: "Collaborative product and interface work.",
    status: "Product exploration",
    stack: ["Mobile", "Maps", "Interaction design"],
    problem:
      "Knowing where to meet and deciding when to go are connected tasks that often become a long chat.",
    decisions: [
      {
        title: "A small next action",
        body: "The design concept moves from discovery to an invitation, then to a shared time and place.",
      },
      {
        title: "Location is a choice",
        body: "The planned experience treats location sharing as an explicit, scoped choice.",
      },
    ],
    outcome:
      "Shown as a product exploration. The plan’s full feature set and growth targets are not presented as delivered results.",
    preview: "gallery",
    color: "#b39870",
  },
  {
    slug: "renovation-workflow",
    title: "Progress you can follow",
    category: "Systems",
    place: "works",
    summary:
      "Making the stages of a renovation project visible and actionable.",
    role: "Collaborative application development.",
    status: "Selected client work · anonymised",
    stack: ["Next.js", "TypeScript", "Workflow design"],
    problem:
      "Site visits, design, costing and works depend on different prerequisites. A timeline alone cannot explain whether a stage is ready.",
    decisions: [
      {
        title: "Stages with meaning",
        body: "Node-based stages and explicit completion conditions express the work required to move forward.",
      },
      {
        title: "Start with a useful brief",
        body: "A structured intake gathers the information needed by later stages.",
      },
    ],
    outcome:
      "A selection focused on implemented workflow structure, without claiming measured delivery improvements.",
    preview: "workflow",
    color: "#a58f72",
  },
  {
    slug: "digital-frontages",
    title: "Different places. Distinct voices.",
    category: "Design",
    place: "atelier",
    summary: "A selection of brand, retail and service website directions.",
    role: "Collaborative frontend and interface development.",
    status: "Anonymised design collection",
    stack: ["Visual design", "Next.js", "Responsive UI"],
    problem:
      "A climbing venue, an engineering practice and a retail brand should not communicate through an interchangeable template.",
    decisions: [
      {
        title: "Start with the subject",
        body: "Content hierarchy, type, imagery and motion should express what the organisation actually does.",
      },
      {
        title: "Design beyond the hero",
        body: "Responsive navigation, product information and contact flows must remain coherent after the first impression.",
      },
    ],
    outcome:
      "Client identities and original screenshots are withheld. The interactive studies here are newly authored editorial reconstructions, not screenshots of client products.",
    preview: "gallery",
    color: "#977765",
  },
  {
    slug: "wonderhao-world",
    title: "A world you can walk into",
    category: "World",
    place: "station",
    summary:
      "This island is an experiment in making a portfolio feel like a place.",
    role: "World concept, interaction direction and software implementation with AI-assisted production.",
    status: "Interactive portfolio",
    stack: ["Three.js", "React Three Fiber", "Procedural geometry", "Next.js"],
    problem:
      "A portfolio should reveal both how someone thinks and what they can make. A spatial interface brings those two experiences together without making visitors learn a game.",
    decisions: [
      {
        title: "A world generated in code",
        body: "Deterministic terrain, drainage, paths and building platforms establish the geography. World, zone, content scene and project provide four navigable scales; the scene geometry is generated in TypeScript.",
      },
      {
        title: "Two ways into the work",
        body: "The island offers exploration while HTML project pages provide direct links, readable text and keyboard access.",
      },
      {
        title: "A small memory of your visit",
        body: "A locally stored pass carries a nickname, a stable emblem and stamps. It is a souvenir, not an account or a global visitor counter.",
      },
    ],
    outcome:
      "Explore the live island to inspect the interaction. Performance and compatibility evidence is documented separately; no universal frame-rate guarantee is made.",
    preview: "world",
    color: "#64877b",
  },
];
export const placeById = (id: string | null | undefined) =>
  places.find((p) => p.id === id);
export const projectBySlug = (slug: string | null | undefined) =>
  projects.find((p) => p.slug === slug);
export const profile = {
  name: "Carl Chong",
  location: "Kuala Lumpur, Malaysia",
  email: "carl@nodegrip.com",
  github: "https://github.com/wonderhao123",
  linkedin: "https://www.linkedin.com/in/kah-hao-chong-83581926b/",
};

export interface ContentScene {
  id: string;
  place: PlaceId;
  title: string;
  subtitle: string;
  description: string;
  kind: "gateway" | "systems" | "archive" | "studio" | "research";
  projects: string[];
}
export const contentScenes: ContentScene[] = [
  {
    id: "orientation",
    place: "arrival",
    title: "The threshold",
    subtitle: "Orientation / 01",
    description:
      "An open invitation. Eight destinations, thirteen projects, and no prescribed route.",
    kind: "gateway",
    projects: [],
  },
  {
    id: "operations",
    place: "works",
    title: "Systems in motion",
    subtitle: "Operations / 02",
    description:
      "Follow the passage from an incoming order to a completed delivery. Explore two different approaches to complex operational software.",
    kind: "systems",
    projects: ["merchant-operations", "optical-ordering"],
  },
  {
    id: "workflows",
    place: "works",
    title: "Working interfaces",
    subtitle: "Workflows / 03",
    description:
      "Specialised workspaces for the people coordinating money, materials and decisions.",
    kind: "systems",
    projects: ["desktop-payroll", "renovation-workflow"],
  },
  {
    id: "maker",
    place: "commons",
    title: "Behind the world",
    subtitle: "Personal studio / 04",
    description:
      "Carl Chong. Software engineer and curious maker, connecting systems, interfaces and interactive worlds.",
    kind: "gateway",
    projects: [],
  },
  {
    id: "knowledge",
    place: "archive",
    title: "Spaces for thought",
    subtitle: "Knowledge / 05",
    description:
      "From a shared source of truth to a quiet personal notebook. Information becomes useful when its structure feels natural.",
    kind: "archive",
    projects: ["workspace-knowledge", "private-notebook"],
  },
  {
    id: "interfaces",
    place: "atelier",
    title: "Interface playground",
    subtitle: "Interaction / 06",
    description:
      "Small decisions, expressive interfaces. Explore the relationship between clarity, identity and motion.",
    kind: "studio",
    projects: ["creative-operations", "member-mobile", "social-map"],
  },
  {
    id: "frontages",
    place: "atelier",
    title: "Digital frontages",
    subtitle: "Visual design / 07",
    description:
      "Identity translated into a place on the web. A collection of responsive visual systems.",
    kind: "studio",
    projects: ["digital-frontages"],
  },
  {
    id: "connected",
    place: "station",
    title: "Connected systems",
    subtitle: "Research / 08",
    description:
      "Experiments at the boundary between an interface and the systems behind it. Each study states its evidence and limitations.",
    kind: "research",
    projects: ["field-operations", "campus-systems"],
  },
  {
    id: "worldmaking",
    place: "station",
    title: "Worldmaking lab",
    subtitle: "Playable study / 09",
    description:
      "The world you are inside: procedural landscape, spatial navigation and a browser-local identity.",
    kind: "research",
    projects: ["wonderhao-world"],
  },
  {id:"airfield",place:"airport",title:"Arrivals & departures",subtitle:"Island infrastructure",description:"One runway, shared taxiways and a quieter rhythm between flights. A procedural part of the WONDERHAO world.",kind:"gateway",projects:[]},
  {id:"reef",place:"dive",title:"The living reef",subtitle:"Underwater exploration",description:"Sand gives way to seagrass and sheltered rock gardens. Observe the schools of fish from above.",kind:"gateway",projects:[]},
  {id:"observatory",place:"dive",title:"Underwater observatory",subtitle:"Marine research habitat",description:"A small observation station on an open seabed platform, beyond the reef. Part of this fictional world, not a real research facility.",kind:"gateway",projects:[]},
];
export const sceneById = (id?: string | null) =>
  contentScenes.find((s) => s.id === id);
export const sceneForProject = (slug: string) =>
  contentScenes.find((s) => s.projects.includes(slug));
