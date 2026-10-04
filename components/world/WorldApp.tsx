"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  Home,
  Minus,
  Moon,
  Plus,
  RotateCw,
  Settings2,
  Sun,
  Ticket,
  X,
} from "lucide-react";
import {
  resolveWorldRoute,
  type WorldRoute as Route,
} from "@/lib/world/navigation";
import { assetPath } from "@/lib/world/assets";
import {
  places,
  placeById,
  projectBySlug,
  contentScenes,
  sceneById,
  sceneForProject,
  type PlaceId,
  type Project,
} from "@/lib/world/content";
import {
  createPass,
  collectDiveKit,
  defaultSettings,
  parsePass,
  parseSettings,
  PASS_KEY,
  SETTINGS_KEY,
  stampPass,
  type WorldPass as Pass,
  type WorldSettings,
} from "@/lib/world/pass";
import {mountainSites} from '@/lib/world/city-plan';
import {projectBuildings} from "@/lib/world/city-buildings";
import type { CameraAction, CameraSnapshot } from "./IslandScene";
import { Dialog } from "./Dialog";
import { WorldPass } from "./WorldPass";
import { ProjectDirectory } from "@/components/portfolio/ProjectDirectory";
import { ProjectContent } from "@/components/portfolio/ProjectContent";
import { AboutContent } from "@/components/portfolio/AboutContent";
const IslandScene = dynamic(() => import("./IslandScene"), { ssr: false });
const DiveKitViewer = dynamic(() => import("./DiveKitViewer"), { ssr: false, loading: () => <div className="kit-loading-frame kit-fallback" role="status">Preparing your equipment…</div> });
class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
type Panel =
  "building" | "projects" | "pass" | "about" | "contact" | "settings" | "places" | "kit" | null;
export function WorldApp() {
  const [pass, setPass] = useState<Pass | null>(null);
  const passRef = useRef<Pass | null>(null);
  const [settings, setSettings] = useState<WorldSettings>(defaultSettings);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [systemReduced, setSystemReduced] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [regionStates, setRegionStates] = useState<Record<string,string>>({});
  const onRegionStatus = useCallback((id:string, state:string) => setRegionStates(old => old[id] === state ? old : {...old, [id]:state}), []);
  const onExplore = useCallback(() => setDetailsOpen(false), []);
  const [hovered, setHovered] = useState<PlaceId | undefined>();
  const [route, setRoute] = useState<Route>({});
  const [panel, setPanel] = useState<Panel>(null);
  const [traffic,setTraffic]=useState("");
  const [pace,setPace]=useState(1);
  const [metrics,setMetrics]=useState<{fps:number;calls:number;triangles:number}|null>(null);
  const [rotateMode,setRotateMode]=useState(false);
  const [returnTarget,setReturnTarget]=useState<string>();
  const [focusedBuilding,setFocusedBuilding]=useState<string>();
  const buildingToFocus=useRef<string|undefined>(undefined);
  const [buildingId,setBuildingId]=useState<string>();
  const [admitted,setAdmitted]=useState(false);
  const activeBuilding=projectBuildings.find(b=>b.id===buildingId);
  const [readyKey, setReadyKey] = useState('');
  const [retry,setRetry]=useState(0);
  const preparationKey=`${settings.quality}:${route.view??'surface'}:${route.level??'exterior'}:${retry}`;
  const ready=readyKey===preparationKey;
  const [failed, setFailed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [notice, setNotice] = useState("");
  const [crane, setCrane] = useState(0);
  const [prism, setPrism] = useState(35);
  const [intro, setIntro] = useState(false);
  const [command, setCommand] = useState<CameraAction>({ id: 0, type: "home" });
  const reduced = systemReduced || settings.reducedMotion;
  const first = !!pass && !admitted && !route.project;
  const activePlace = placeById(route.place);
  const project = projectBySlug(route.project);
  const activeScene = sceneById(route.scene);
  const modal = !!panel || !!project;
  const paused = first || modal || hidden;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      // R3F configures its renderer asynchronously; detect unsupported contexts
      // before mounting it so the HTML map remains usable even without WebGL.
      try {
        const probe = document.createElement("canvas");
        const context = probe.getContext("webgl2");
        if (!context) setFailed(true);
        else context.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        setFailed(true);
      }
      let p: Pass | null = null;
      let opts = defaultSettings;
      try {
        p = parsePass(localStorage.getItem(PASS_KEY));
        opts = parseSettings(localStorage.getItem(SETTINGS_KEY));
      } catch {
        setStorageAvailable(false);
      }
      if (!p) p = createPass();
      const r = resolveWorldRoute(window.location.search);
      if (r.place) p = stampPass(p, r.place);
      passRef.current = p;
      setPass(p);
      setSettings(opts);
      setRoute(r);
      if(r.project)setAdmitted(true);
      setDetailsOpen(true);
      if (r.place)
        setCommand((c) => ({
          id: c.id + 1,
          type: "focus",
          place: r.place,
          detail: !!r.scene,
          instant: true,
        }));
      try {
        localStorage.setItem(PASS_KEY, JSON.stringify(p));
      } catch {
        setStorageAvailable(false);
      }
      setSystemReduced(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    });
    const pop = () => {
      const r = resolveWorldRoute(window.location.search);
      setRoute(r);
      if(r.project)setAdmitted(true);
      setDetailsOpen(true);
      setPanel(null);
      const s = window.history.state?.islandCamera as
        CameraSnapshot | undefined;
      if (
        s && s.version === 3 &&
        Array.isArray(s.position) &&
        s.position.length === 3 &&
        Array.isArray(s.target) &&
        s.target.length === 3 &&
        [...s.position, ...s.target, s.zoom].every(Number.isFinite)
      ) {
        setCommand((c) => ({
          id: c.id + 1,
          type: "restore",
          snapshot: s,
          instant: true,
        }));
      } else
        setCommand((c) => ({
          id: c.id + 1,
          type: r.place ? "focus" : "home",
          place: r.place,
          detail: !!r.scene,
          instant: true,
        }));
    };
    const vis = () => setHidden(document.hidden);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setSystemReduced(media.matches);
    window.addEventListener("popstate", pop);
    document.addEventListener("visibilitychange", vis);
    media.addEventListener("change", motion);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("popstate", pop);
      document.removeEventListener("visibilitychange", vis);
      media.removeEventListener("change", motion);
    };
  }, []);
  useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setRotateMode(false);if(!document.querySelector('dialog[open]')){setFocusedBuilding(undefined);document.querySelector<HTMLElement>('.world-viewport')?.focus()}}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)},[]);
  const savePass = useCallback((update: (p: Pass) => Pass) => {
    const current = passRef.current;
    if (!current) return;
    const next = update(current);
    passRef.current = next;
    setPass(next);
    try {
      localStorage.setItem(PASS_KEY, JSON.stringify(next));
    } catch {
      setStorageAvailable(false);
    }
  }, []);
  const updateSettings = (change: Partial<WorldSettings>) => {
    const next = { ...settings, ...change };
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      setStorageAvailable(false);
    }
  };
  const camera = useCallback(
    (type: CameraAction["type"], place?: PlaceId, instant = false) =>
      setCommand((c) => ({ id: c.id + 1, type, place, instant })),
    [],
  );
  const navigate = useCallback((next: Route, replace = false) => {
    const u = new URL(window.location.href);
    u.search = "";
    if (next.place) u.searchParams.set("place", next.place);
    if (next.project) u.searchParams.set("project", next.project);
    if (next.scene) u.searchParams.set("scene", next.scene);
    if (next.level) u.searchParams.set("level", next.level);
    if (next.view) u.searchParams.set("view", next.view);
    window.history[replace ? "replaceState" : "pushState"](
      {
        ...window.history.state,
        worldProjectEntry: !!next.project && !replace,
      },
      "",
      u,
    );
    setRoute(next);
    setDetailsOpen(true);
  }, []);
  const selectPlace = useCallback(
    (id: PlaceId) => {
      navigate({ place: id });
      setPanel(null);
      setHovered(undefined);
      savePass((p) => stampPass(p, id));
      camera("focus", id);
    },
    [navigate, savePass, camera],
  );
  const openProject = (p: Project) => {
    if(panel==="projects")setReturnTarget("directory");
    navigate({
      place: p.place,
      scene: sceneForProject(p.slug)?.id,
      project: p.slug,
    });
    setPanel(null);
    savePass((v) => stampPass(v, p.place));
  };
  const locateBuilding = (id: string) => {
    buildingToFocus.current=id;
    navigate({});
    setPanel(null);
    setFocusedBuilding(id);
    setCommand(c=>({id:c.id+1,type:"building",building:id}));
  };
  const openBuilding = (id: string) => {
    const building = projectBuildings.find(b=>b.id===id);
    if (!building) return;
    buildingToFocus.current=undefined;
    setReturnTarget(failed ? "directory" : id);
    if (building.projects.length === 1) {
      const project = projectBySlug(building.projects[0]);
      if (project) openProject(project);
    } else {
      setBuildingId(id);
      setPanel("building");
    }
  };
  const enterScene = (id: string) => {
    const scene = sceneById(id);
    if (!scene) return;
    navigate({ place: scene.place, scene: scene.id, ...(scene.place === "dive" && scene.id!=="cube" && scene.id!=="sphere" && pass?.diveKit ? {view:"underwater" as const} : {}) });
    setCommand((c) => ({
      id: c.id + 1,
      type: "focus",
      place: scene.place,
      detail: true,
    }));
  };
  const onCamera = useCallback((snapshot: CameraSnapshot) => {
    window.history.replaceState(
      { ...window.history.state, islandCamera: snapshot },
      "",
      window.location.href,
    );
    const building=projectBuildings.find(b=>b.id===buildingToFocus.current);
    if(building&&Math.hypot(...snapshot.target.map((v,i)=>v-building.position[i]))<.2){
      // Html can be hidden behind the camera during travel. Focus after its
      // projection has updated, rather than losing focus on an invisible card.
      requestAnimationFrame(()=>{
        if(buildingToFocus.current!==building.id)return;
        const target=document.querySelector<HTMLButtonElement>(`button[aria-label="Explore ${building.name}"]`);
        if(target?.getClientRects().length&&!target.closest('[inert]')){
          target.focus();
          if(document.activeElement===target)buildingToFocus.current=undefined;
        }
      });
    }
  }, []);
  const onReady = useCallback(() => setReadyKey(preparationKey), [preparationKey]);
  const onFailure = useCallback(() => {
    setFailed(true);
    setNotice(
      "The 3D view is unavailable. All places and projects are still here.",
    );
  }, []);
  const enter = () => {
    setAdmitted(true);
    savePass((p) => stampPass({ ...p, entered: true }, "arrival"));
    setIntro(!reduced && !failed);
    setNotice(
      "Welcome to the island. Your first stamp is waiting on your pass.",
    );
  };
  useEffect(() => {
    if (!intro || !ready) return;
    const frame = requestAnimationFrame(() => camera("home"));
    const timer = setTimeout(() => {
      setIntro(false);
      camera("home");
    }, 1800);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [intro, ready, camera]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!pass?.entered || !route.place) return;
    savePass((p) => stampPass(p, route.place!));
  }, [route.place, pass?.entered, savePass]);
  useEffect(() => {
    const title = project
      ? `${project.title} — WONDERHAO`
      : activeScene
        ? `${activeScene.title} — WONDERHAO`
        : activePlace
          ? `${activePlace.name} — WONDERHAO`
          : "WONDERHAO — An independent digital world";
    document.title = title;
  }, [project, activePlace, activeScene]);
  const closeProject = () => {
    if (window.history.state?.worldProjectEntry) window.history.back();
    else navigate({ place: route.place, scene: route.scene }, true);
  };
  const onWorldKeys = (e: React.KeyboardEvent) => {
    if(e.key === "Escape" && rotateMode){e.preventDefault();setRotateMode(false);return;}
    if (paused || e.target !== e.currentTarget) return;
    const keys: Record<string, CameraAction["type"]> = {
      ArrowLeft: "pan-left",
      ArrowRight: "pan-right",
      ArrowUp: "pan-up",
      ArrowDown: "pan-down",
      "+": "zoom-in",
      "=": "zoom-in",
      "-": "zoom-out",
      Home: "home",
    };
    if (keys[e.key]) {
      e.preventDefault();
      if (keys[e.key] === "home") navigate({});
      camera(e.shiftKey && e.key === "ArrowUp" ? "tilt-up" : e.shiftKey && e.key === "ArrowDown" ? "tilt-down" : e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight") ? "rotate" : keys[e.key]);
    }
  };
  return (
    <main
      data-reduced-motion={reduced}
      data-world-ready={ready||failed}
      className={`world-app ${activeScene ? "in-content-scene" : ""} ${settings.dusk ? "is-dusk" : ""} ${first ? "at-border" : ""}`}
    >
      <a
        className="skip-link"
        href="#world-navigation"
        onClick={() => setPanel("places")}
      >
        Skip to world navigation
      </a>
      <div
        className="world-viewport"
        inert={first || modal || !ready}
        tabIndex={first || modal || failed || !ready ? -1 : 0}
        role="region"
        aria-label={
          failed
            ? "Illustrated island overview"
            : "City map. Drag to move, scroll to zoom. Use Rotate view to orbit. Arrow keys move the camera."
        }
        onKeyDown={onWorldKeys}
        style={{
          backgroundImage: `url(${assetPath("/world/procedural-map.svg")})`,
        }}
      >
        {!failed && pass && (
          <SceneBoundary onFailure={onFailure}>
            <IslandScene key={preparationKey}
              rotateMode={rotateMode}
              focusedBuilding={focusedBuilding}
              onFocusBuilding={setFocusedBuilding}
              onBuilding={openBuilding}
              weather={settings.weather}
              level={route.level}
              underwater={route.view === "underwater" && !!pass?.diveKit}
              onExplore={()=>{setIntro(false);setFocusedBuilding(undefined);onExplore()}}
              onRegionStatus={onRegionStatus}
              dusk={settings.dusk}
              low={settings.quality === "low"}
              reduced={reduced}
              paused={paused}
              selected={route.place}
              hovered={hovered}
              scene={route.scene}
              onHover={setHovered}
              onProject={(slug) => {
                const p = projectBySlug(slug);
                if (p) openProject(p);
              }}
              command={command}
              crane={crane}
              prism={prism}
              onPlace={selectPlace}
              onReady={onReady}
              onMetrics={setMetrics}
              pace={pace}
              onTraffic={setTraffic}
              onFailure={onFailure}
              onCamera={onCamera}
            />
          </SceneBoundary>
        )}
      </div>
      <div className="world-interface" inert={first || modal}>
        <button
          type="button"
          className="pass-nav pass-float"
          aria-label="Open World Pass"
          onClick={() => setPanel("pass")}
        >
          <Ticket size={16} />
          <span>World Pass</span>
          {!!pass?.stamps.length && <small>{pass.stamps.length}</small>}
        </button>
        <nav
          id="world-navigation"
          className="spatial-breadcrumb"
          data-card-surface=""
          aria-label="Spatial navigation"
        >
          <button
            type="button"
            aria-current={!activePlace ? "page" : undefined}
            onClick={() => {
              navigate({});
              camera("home");
            }}
          >
            World
          </button>
          {activePlace && (
            <>
              <ChevronRight size={12} />
              <button
                type="button"
                aria-current={!activeScene ? "page" : undefined}
                onClick={() => selectPlace(activePlace.id)}
              >
                {activePlace.short}
              </button>
            </>
          )}
          {activeScene && (
            <>
              <ChevronRight size={12} />
              <span aria-current="page">{activeScene.title}</span>
            </>
          )}
        </nav>
        <div className="city-work-link"><button onClick={()=>setPanel("projects")}><BookOpen size={16}/> Browse projects</button><button onClick={()=>setPanel("contact")}>Contact ↗</button></div>
        <button className="city-directory" onClick={() => setPanel("places")} aria-label="Island directory"><Compass size={17}/> Explore my work <ArrowUpRight size={14}/></button>
        {route.view === "underwater" && pass?.diveKit && <button className="city-return" onClick={() => navigate({place:"dive"})}>↑ Return to shore</button>}
        {route.level && <div className="city-levels" data-card-surface="" aria-label="Citadel levels">{(["exterior","b1","b2"] as const).map(level => <button key={level} aria-pressed={level === route.level} onClick={() => {navigate({place:"commons", ...(level !== "exterior" ? {level} : {})});setDetailsOpen(false)}}>{level === "exterior" ? "Back outside" : level.toUpperCase()}</button>)}</div>}
        {Object.values(regionStates).includes("error") && <div className="city-load" data-card-surface="" role="alert">A district could not load. <button onClick={() => window.dispatchEvent(new Event("world-retry-region"))}>Retry</button><button onClick={() => {navigate({});camera("home")}}>Return to town</button><Link href="/work">Browse projects</Link></div>}
        {ready && Object.values(regionStates).includes("loading") && <div className="city-load" data-card-surface="" role="status">Preparing this district…</div>}
        {activePlace && detailsOpen && (
          <section
            key={activeScene?.id || activePlace.id}
            className="place-panel"
            data-card-surface=""
            aria-label={activePlace.name}
          >
            <div className="place-panel-heading">
              <span className="eyebrow">
                {activeScene ? "CONTENT SCENE" : "ZONE"} {activePlace.number} /{" "}
                {activePlace.stamp}
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label={
                  activeScene ? "Back to zone" : "Close place details"
                }
                onClick={() => {
                  if (activeScene) selectPlace(activePlace.id);
                  else {
                    setDetailsOpen(false);
                  }
                }}
              >
                <X size={17} />
              </button>
            </div>
            <h2>{activeScene?.title || activePlace.name}</h2>
            <p>{activeScene?.description || activePlace.description}</p>
            {activePlace.id === "arrival" && (
              <button
                type="button"
                className="primary-button"
                onClick={() => setPanel("places")}
              >
                Choose your next stop <ArrowRight size={16} />
              </button>
            )}
            {traffic && <p className="city-observe" aria-label="Live transport activity">{traffic}</p>}
            {activePlace.id === "commons" && (
              <div className="place-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setPanel("about")}
                >
                  Meet Carl <ArrowUpRight size={15} />
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setPanel("projects")}
                >
                  All projects
                </button>
              </div>
            )}
            {activePlace.id === "commons" && !route.level && <button className="primary-button" onClick={() => {navigate({place:"commons",level:"b1"});setDetailsOpen(false)}}>Explore inside <ArrowRight size={16}/></button>}
            {activePlace.id === "dive" && <div className="dive-kit">
              {!modal && !first && <DiveKitViewer low={settings.quality === "low"} onExpand={()=>setPanel("kit")}/>}
              <p>{pass?.diveKit ? "Your dive kit is ready. The reef is yours to explore." : "A mask, fins, a wetsuit and an air cylinder. Collect your kit to open the underwater view."}</p>
              {!pass?.diveKit ? <button className="primary-button" onClick={() => {savePass(collectDiveKit);setNotice("Dive kit collected. Your World Pass is ready for the reef.")}}>Collect dive kit <ArrowRight size={16}/></button> : route.view !== "underwater" ? <button className="primary-button" onClick={() => navigate({place:"dive",scene:activeScene?.id==="cube"?"cube":activeScene?.id==="sphere"?"sphere":"reef",view:"underwater"})}>{activeScene?.id==="cube"?"Descend to The Cube":activeScene?.id==="sphere"?"Descend beneath The Sphere":"Enter underwater world"} <ArrowRight size={16}/></button> : <button className="secondary-button" onClick={() => navigate({place:"dive"})}>Return to shore</button>}
            </div>}
            {["airport","arrival","works"].includes(activePlace.id) && <p className="city-observe">{activePlace.id === "airport" ? "Watch the apron: aircraft push back, taxi and take turns on the runway." : activePlace.id === "arrival" ? "Cruise and ferry berths share the passenger waterfront. Ships arrive, pause alongside and depart." : "Supply ships work the quay; the dry dock holds a vessel under repair."}</p>}
            {["airport","dive","commons"].includes(activePlace.id) && <button className="text-button" onClick={() => openProject(projectBySlug("wonderhao-world")!)}>How this world is made ↗</button>}
            <div className="place-projects">
              {activeScene
                ? activeScene.projects.map((slug) => {
                    const p = projectBySlug(slug)!;
                    return (
                      <button
                        type="button"
                        key={p.slug}
                        onClick={() => openProject(p)}
                      >
                        <span>
                          <small>{p.category} / Project</small>
                          {p.title}
                        </span>
                        <ArrowUpRight size={16} />
                      </button>
                    );
                  })
                : contentScenes
                    .filter((s) => s.place === activePlace.id)
                    .map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        className="scene-entry"
                        onClick={() => enterScene(s.id)}
                      >
                        <span>
                          <small>{s.subtitle}</small>
                          {s.title}
                          <em>
                            {s.projects.length
                              ? `${s.projects.length} ${s.projects.length === 1 ? "project" : "projects"}`
                              : "Explore"}
                          </em>
                        </span>
                        <ArrowRight size={18} />
                      </button>
                    ))}
            </div>
            {activeScene && activePlace.id === "works" && (
              <div className="mini-interaction">
                <span className="eyebrow">WORKFLOW SIMULATOR</span>
                <p>
                  {
                    [
                      "A crate is ready at the loading dock.",
                      "Cargo secured. Lift it across the dock.",
                      "Almost there. Lower the crate into place.",
                      "Delivered. A small job, well done.",
                    ][crane]
                  }
                </p>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setCrane((crane + 1) % 4)}
                >
                  {
                    [
                      "1 · Lift the crate",
                      "2 · Move the crane",
                      "3 · Set it down",
                      "Reset the crane",
                    ][crane]
                  }
                  <ArrowRight size={14} />
                </button>
                <span className="sr-only" role="status">
                  Crane step {crane} of 3
                </span>
              </div>
            )}
            {activeScene && activePlace.id === "atelier" && (
              <div className="mini-interaction">
                <label className="eyebrow" htmlFor="prism-angle">
                  THE OPTICAL GARDEN
                </label>
                <p>Turn the rings. Find a different perspective.</p>
                <input
                  id="prism-angle"
                  type="range"
                  min="0"
                  max="100"
                  value={prism}
                  onChange={(e) => setPrism(Number(e.target.value))}
                />
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setPrism(35)}
                >
                  Reset arrangement
                </button>
              </div>
            )}
          </section>
        )}
        <div className="world-bottom">
          <div className="world-coordinates">
            <span className="world-brand"><Logo /> EXPLORABLE PORTFOLIO</span>
            <span>
              EST. 2026 <i />{" "}
              {settings.dusk ? "18:40 / BLUE HOUR" : "16:20 / LATE AFTERNOON"}
            </span>
          </div>
          <div
            className="camera-controls"
            data-card-surface=""
            aria-label="Camera controls"
          >
            <button
              type="button"
              aria-label="Zoom out"
              disabled={failed}
              title="Zoom out"
              onClick={() => camera("zoom-out")}
            >
              <Minus size={17} />
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              disabled={failed}
              title="Zoom in"
              onClick={() => camera("zoom-in")}
            >
              <Plus size={17} />
            </button>
            <span className="control-divider" />
            <button
              type="button"
              aria-label={rotateMode?"Switch to pan mode":"Rotate view"}
              aria-pressed={rotateMode}
              disabled={failed}
              title={rotateMode?"Drag to rotate · Esc to pan":"Rotate view"}
              onClick={() => setRotateMode(v=>!v)}
            >
              <RotateCw size={16} /><span className="mode-label">{rotateMode?"Rotating":"Rotate"}</span>
            </button>
            <button
              type="button"
              aria-label="Return to town"
              disabled={failed}
              title="Return to town"
              onClick={() => {
                navigate({});
                camera("home");
              }}
            >
              <Home size={16} />
            </button>
            <button type="button" aria-label="View whole island" title="View whole island" onClick={() => {navigate({});camera("overview")}}><Compass size={17}/></button>
            <span className="control-divider" />
            <button
              type="button"
              aria-label={
                settings.dusk ? "Switch to afternoon" : "Switch to dusk"
              }
              title={settings.dusk ? "Afternoon" : "Dusk"}
              onClick={() => updateSettings({ dusk: !settings.dusk })}
            >
              {settings.dusk ? <Moon size={16} /> : <Sun size={17} />}
            </button>
            <button
              type="button"
              aria-label="World settings"
              title="World settings"
              onClick={() => setPanel("settings")}
            >
              <Settings2 size={16} />
            </button>
          </div>
          <button
            type="button"
            className="mobile-directory secondary-button"
            onClick={() => setPanel("places")}
          >
            <Compass size={16} />
            Places
          </button>
          <div className="navigation-hint">
            {failed
              ? "Choose a place from the directory."
              : rotateMode?"Drag to rotate · Esc to move":"Drag to move · Scroll to zoom"}
          </div>
        </div>
        {intro && (
          <button
            type="button"
            className="skip-arrival secondary-button"
            onClick={() => {
              setIntro(false);
              camera("home", undefined, true);
            }}
          >
            Skip arrival <ArrowRight size={14} />
          </button>
        )}
        {failed && (
          <div className="fallback-notice" data-card-surface="">
            <span>Postcard mode · All projects remain available.</span>
            <button
              type="button"
              className="text-button"
              onClick={() => setPanel("places")}
            >
              Explore places <ArrowRight size={14} />
            </button>
          </div>
        )}
        {route.unknown && (
          <div className="route-notice" data-card-surface="" role="status">
            That destination isn’t on this island.{" "}
            <button type="button" onClick={() => navigate({})}>
              Return to the map
            </button>
          </div>
        )}
      </div>
      {!ready && !failed && pass && !first && !modal && <section className="world-reveal" aria-label="Preparing your world" role="status">
        <Logo /><span className="eyebrow">ARRIVING</span><div className="reveal-orbit" aria-hidden="true"/>
        <h2>{Object.values(regionStates).includes('error')?'The crossing needs another try.':regionStates.gpu==='loading'?'Bringing the city into light.':'The bay is taking shape.'}</h2>
        <p>Preparing the streets, mountain ridges and waterfront for your first view.</p>
        <div><button className="secondary-button" onClick={()=>{setRegionStates({});setRetry(v=>v+1)}}>Retry</button><button className="secondary-button" onClick={()=>{setRegionStates({});updateSettings({quality:'low'});setRetry(v=>v+1)}}>Use lightweight view</button><Link href="/work">Browse the work ↗</Link></div>
      </section>}
      {!pass && (
        <div className="initial-loading" role="status">
          <Logo />
          <p>A little world is waiting.</p>
          <span className="loading-dot" />
          <Link href="/work">Browse the work</Link>
        </div>
      )}
      {first && pass && (
        <section className="arrival-screen" aria-label="Welcome to WONDERHAO">
          <header>
            <Logo />
            <Link href="/work">
              Just here for the work? <ArrowUpRight size={15} />
            </Link>
          </header>
          <div className="arrival-layout">
            <WorldPass
              key={pass.id}
              pass={pass}
              onSave={(nickname) => savePass((p) => ({ ...p, nickname }))}
              onEnter={enter}
              first
              storageAvailable={storageAvailable}
            />
          </div>

        </section>
      )}
      {panel && (
        <Dialog
          title={
            {
              building: activeBuilding?.name??"Projects",
              projects: "Selected work",
              pass: "Your World Pass",
              about: "About the maker",
              contact: "Say hello",
              settings: "Make yourself at home",
              places: "Island directory",
              kit: "Dive kit",
            }[panel]
          }
          restoreFocus={panel==='kit'?()=>document.querySelector<HTMLButtonElement>('.kit-expand'):panel==='building'?()=>document.querySelector<HTMLButtonElement>(`button[aria-label="Explore ${activeBuilding?.name}"]`)??document.querySelector<HTMLElement>('.world-viewport'):panel==='places'||panel==='projects'?()=>{const id=buildingToFocus.current;return id?document.querySelector<HTMLButtonElement>(`button[aria-label="Explore ${projectBuildings.find(b=>b.id===id)?.name}"]`):null}:undefined}
          onClose={() => setPanel(null)}
          wide={panel === "projects" || panel === "about" || panel === "kit"}
        >
          {panel === "kit" && <DiveKitViewer low={settings.quality === "low"} expanded/>}
          {panel === "building" && activeBuilding && <div className="building-projects"><span className="eyebrow">{activeBuilding.programme}</span><p>{activeBuilding.description}</p>{activeBuilding.projects.map(slug=>{const p=projectBySlug(slug);return p&&<button className="scene-entry" key={slug} onClick={()=>openProject(p)}><strong>{p.title}</strong><span>{p.summary}</span><ArrowUpRight size={18}/></button>})}</div>}
          {panel === "projects" && (
            <ProjectDirectory
              onProject={openProject}
              onLocate={failed?undefined:p=>{const b=projectBuildings.find(v=>v.projects.includes(p.slug));if(b)locateBuilding(b.id)}}
            />
          )}{" "}
          {panel === "pass" && pass && (
            <WorldPass
              key={pass.id}
              pass={pass}
              onSave={(nickname) => savePass((p) => ({ ...p, nickname }))}
              storageAvailable={storageAvailable}
            />
          )}{" "}
          {panel === "about" && <AboutContent />}
          {panel === "contact" && <AboutContent contactOnly />}
          {panel === "places" && (
            <div className="place-directory">
              <span className="eyebrow">A PORTFOLIO, BUILT INTO A CITY</span>
              <h2>My work lives here.</h2>
              <p className="building-directory-intro">Explore {projectBuildings.reduce((count,b)=>count+b.projects.length,0)} projects across {projectBuildings.length} buildings. Choose a building to {failed?"read":"find"} the work inside.</p>
              {projectBuildings.map(b=><button key={b.id} type="button" className="building-directory-entry" aria-label={`${failed?'Read projects in':'Visit'} ${b.name}`} onClick={()=>failed?openBuilding(b.id):locateBuilding(b.id)}>
                <BookOpen size={18} aria-hidden="true"/>
                <div><span className="eyebrow">{b.programme}</span><strong>{b.name}</strong><p>{b.projects.map(slug=>projectBySlug(slug)?.title).join(' · ')}</p></div>
                <ChevronRight size={18} aria-hidden="true"/>
              </button>)}
              <h3 className="building-directory-surroundings">Around the island</h3>
              {places.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {setFocusedBuilding(undefined);selectPlace(p.id)}}
                >
                  <span>{p.number}</span>
                  <div>
                    <strong>{p.name}</strong>
                    <p>{p.description}</p>
                  </div>
                  <ChevronRight size={18} />
                </button>
              ))}
              {Object.entries(mountainSites).map(([id,site])=><button key={id} onClick={()=>{navigate({});setPanel(null);setFocusedBuilding(undefined);setNotice(site.description);setCommand(c=>({id:c.id+1,type:'mountain',building:id}))}}><span>↟</span><div><strong>{site.name}</strong><p>{site.description}</p></div><ChevronRight size={18}/></button>)}
              <button onClick={()=>{setPanel(null);setFocusedBuilding(undefined);enterScene('cube')}}><span>◇</span><div><strong>The Cube</strong><p>A silent light beneath the open sea. Visit the offshore trench.</p></div><ChevronRight size={18}/></button>
              <Link href="/work" className="text-button">
                <BookOpen size={16} />
                Prefer a list? Browse every project.
              </Link>
            </div>
          )}
          {panel === "settings" && (
            <div className="settings-panel">
              <h2>Set the atmosphere.</h2>
              <p>Small adjustments for a comfortable visit.</p>
              {metrics && <details className="city-diagnostics"><summary>Rendering details</summary><p>Last active sample: {metrics.fps} fps · {metrics.calls} draw calls · {Math.round(metrics.triangles/1000)}k triangles. The world pauses while this panel is open.</p></details>}
              <label className="setting-toggle"><span>Observation speed<small>Speed up the living world to watch a complete arrival or departure.</small></span><select aria-label="Observation speed" value={pace} onChange={e=>setPace(Number(e.target.value))}><option value="1">Real time</option><option value="4">4×</option><option value="12">12×</option></select></label>
              <label className="setting-toggle"><span>Weather<small>Auto moves slowly from sun to clouds and light rain.</small></span><select aria-label="Weather" value={settings.weather} onChange={e => updateSettings({weather:e.target.value as WorldSettings["weather"]})}><option value="auto">Auto</option><option value="sunny">Sunny</option><option value="cloudy">Cloudy</option><option value="rain">Light rain</option></select></label>
              <label className="setting-toggle">
                <span>
                  Blue hour
                  <small>
                    Violet skylight, brighter architectural accents.
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.dusk}
                  onChange={(e) => updateSettings({ dusk: e.target.checked })}
                />
              </label>
              <label className="setting-toggle">
                <span>
                  Lightweight view
                  <small>
                    Fewer trees, no live shadows or ambient animation.
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.quality === "low"}
                  onChange={(e) =>
                    updateSettings({
                      quality: e.target.checked ? "low" : "auto",
                    })
                  }
                />
              </label>
              <label className="setting-toggle">
                <span>
                  Reduce motion
                  <small>
                    {systemReduced
                      ? "Your system already requests reduced motion."
                      : "Instant camera changes and a still environment."}
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={reduced}
                  disabled={systemReduced}
                  onChange={(e) =>
                    updateSettings({ reducedMotion: e.target.checked })
                  }
                />
              </label>
              <div className="direction-controls">
                <span className="eyebrow">MOVE WITHOUT DRAGGING</span>
                <div>
                  {(
                    [
                      ["pan-left", "Pan left", ArrowLeft],
                      ["pan-up", "Pan up", ArrowUp],
                      ["pan-down", "Pan down", ArrowDown],
                      ["pan-right", "Pan right", ArrowRight],
                    ] as const
                  ).map(([type, label, Icon]) => (
                    <button
                      key={type}
                      type="button"
                      className="icon-button"
                      aria-label={label}
                      onClick={() => {
                        setPanel(null);
                        camera(type);
                      }}
                    >
                      <Icon size={18} />
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setFailed(true);
                  setPanel(null);
                }}
              >
                Use the still postcard view <ArrowUpRight size={14} />
              </button>
              <p className="pass-note">
                Your pass and preferences stay in this browser. Clearing site
                data removes them. A downloaded pass is a souvenir, not a
                backup.
              </p>
              {!storageAvailable && (
                <p role="status">
                  Preferences cannot be saved in this browser.
                </p>
              )}
            </div>
          )}
        </Dialog>
      )}
      {project && (
        <Dialog
          title={`${project.category} / Case study`}
          restoreFocus={()=>returnTarget==='directory'?document.querySelector<HTMLButtonElement>('.city-work-link button'):document.querySelector<HTMLButtonElement>(`button[aria-label="Explore ${projectBuildings.find(b=>b.id===returnTarget)?.name}"]`)??document.querySelector<HTMLElement>('.world-viewport')}
          onClose={closeProject}
          wide
        >
          <nav className="case-path" aria-label="Project location">
            <span>World</span>
            <ChevronRight size={12} />
            <span>{activePlace?.short}</span>
            <ChevronRight size={12} />
            <button
              type="button"
              onClick={() =>
                navigate({ place: route.place, scene: route.scene }, true)
              }
            >
              {activeScene?.title || "Scene"}
            </button>
            <ChevronRight size={12} />
            <strong>Project</strong>
          </nav>
          <ProjectContent project={project} overlay />
        </Dialog>
      )}
      <div
        className="world-toast"
        data-card-surface=""
        role="status"
        aria-live="polite"
      >
        {notice && (
          <>
            <Check size={15} />
            {notice}
          </>
        )}
      </div>
      <noscript>
        <div className="noscript-access">
          <h1>WONDERHAO — A little world of work</h1>
          <p>
            The interactive island uses JavaScript. You can read every project
            without it.
          </p>
          <a href={assetPath("/work")}>Browse projects</a>
          <a href={assetPath("/about")}>About & contact</a>
        </div>
      </noscript>
    </main>
  );
}
