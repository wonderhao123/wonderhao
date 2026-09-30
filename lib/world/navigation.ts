import {
  placeById,
  projectBySlug,
  sceneById,
  sceneForProject,
  type PlaceId,
} from "./content";
export type WorldRoute = {
  place?: PlaceId;
  scene?: string;
  project?: string;
  unknown?: boolean;
  level?: "b1" | "b2";
  view?: "underwater";
};
/** A project supplies its canonical parentage; inconsistent external links remain recoverable. */
export function resolveWorldRoute(search: string): WorldRoute {
  const params = new URLSearchParams(search);
  const place = placeById(params.get("place"));
  const project = projectBySlug(params.get("project"));
  const requestedScene = sceneById(params.get("scene"));
  const scene = project ? sceneForProject(project.slug) : requestedScene;
  const parent = project?.place ?? scene?.place ?? place?.id;
  const level = params.get("level"), view = params.get("view");
  return {
    ...(parent === "commons" && (level === "b1" || level === "b2") ? { level } : {}),
    ...(parent === "dive" && view === "underwater" ? { view: "underwater" as const } : {}),
    place: project?.place ?? scene?.place ?? place?.id,
    scene: scene?.id,
    project: project?.slug,
    unknown: !!(
      (params.has("level") && (parent !== "commons" || !["b1", "b2"].includes(level!))) ||
      (params.has("view") && (parent !== "dive" || view !== "underwater")) ||
      (params.has("place") && !place) ||
      (params.has("project") && !project) ||
      (params.has("scene") && !requestedScene) ||
      (scene && place && scene.place !== place.id) ||
      (project &&
        requestedScene &&
        !requestedScene.projects.includes(project.slug))
    ),
  };
}
