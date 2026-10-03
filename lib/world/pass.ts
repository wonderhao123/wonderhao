import { places, type PlaceId } from "./content";
export interface WorldPass {
  version: 1;
  id: string;
  nickname: string;
  issuedAt: string;
  entered: boolean;
  stamps: PlaceId[];
  diveKit?: string;
}
export interface WorldSettings {
  quality: "auto" | "low";
  dusk: boolean;
  reducedMotion: boolean;
  weather: "auto" | "sunny" | "cloudy" | "rain";
}
export const PASS_KEY = "wonderhao.pass.v1";
export const SETTINGS_KEY = "wonderhao.settings.v1";
export const defaultSettings: WorldSettings = {
  quality: "auto",
  dusk: false,
  reducedMotion: false,
  weather: "sunny",
};
export function cleanNickname(value: string) {
  return Array.from(value.replace(/[\p{Cc}\p{Cf}]/gu, "").trim())
    .slice(0, 24)
    .join("");
}
export function createPass(): WorldPass {
  return {
    version: 1,
    id: crypto.randomUUID(),
    nickname: "",
    issuedAt: new Date().toISOString(),
    entered: false,
    stamps: [],
  };
}
export function parsePass(raw: string | null): WorldPass | null {
  try {
    const p = JSON.parse(raw || "null");
    if (
      !p ||
      p.version !== 1 ||
      typeof p.id !== "string" ||
      !/^[a-f\d-]{36}$/i.test(p.id) ||
      typeof p.nickname !== "string" ||
      typeof p.issuedAt !== "string" ||
      !Number.isFinite(Date.parse(p.issuedAt)) ||
      typeof p.entered !== "boolean" ||
      !Array.isArray(p.stamps)
    )
      return null;
    return {
      version: 1,
      id: p.id,
      nickname: cleanNickname(p.nickname),
      issuedAt: p.issuedAt,
      entered: p.entered,
      ...(typeof p.diveKit === "string" && Number.isFinite(Date.parse(p.diveKit)) ? { diveKit: p.diveKit } : {}),
      stamps: [
        ...new Set<PlaceId>(
          p.stamps.filter((id: unknown) =>
            places.some((place) => place.id === id),
          ),
        ),
      ],
    };
  } catch {
    return null;
  }
}
export function parseSettings(raw: string | null): WorldSettings {
  try {
    const p = JSON.parse(raw || "{}");
    return {
      quality: p?.quality === "low" ? "low" : "auto",
      dusk: p?.dusk === true,
      reducedMotion: p?.reducedMotion === true,
      weather: ["auto", "sunny", "cloudy", "rain"].includes(p?.weather) ? p.weather : "sunny",
    };
  } catch {
    return { ...defaultSettings };
  }
}
export function collectDiveKit(pass: WorldPass): WorldPass {
  return pass.diveKit ? pass : { ...pass, diveKit: new Date().toISOString() };
}
export function stampPass(pass: WorldPass, id: PlaceId): WorldPass {
  return pass.stamps.includes(id)
    ? pass
    : { ...pass, stamps: [...pass.stamps, id] };
}
export function passNumber(pass: WorldPass) {
  return "WH–" + pass.id.replaceAll("-", "").slice(0, 8).toUpperCase();
}
export function emblemSeed(pass: WorldPass) {
  return parseInt(pass.id.replaceAll("-", "").slice(0, 6), 16);
}
export function issuedDate(pass: WorldPass) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(pass.issuedAt));
}
export async function downloadPass(pass: WorldPass, patternUrl?: string) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1450;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("Image creation unavailable");
  c.fillStyle = "#08090c";
  c.fillRect(0, 0, 1000, 1450);
  c.fillStyle = "#0a0a0a";
  c.fillRect(40, 40, 920, 1370);
  if (patternUrl) {
    const pattern = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Pass logo could not load"));
      image.src = patternUrl;
    });
    // Colour only the logo pixels, keeping the black card and logo cutouts clear.
    const foilCanvas = document.createElement("canvas");
    foilCanvas.width = canvas.width;
    foilCanvas.height = canvas.height;
    const foilContext = foilCanvas.getContext("2d");
    if (!foilContext) throw new Error("Image creation unavailable");
    foilContext.save();
    foilContext.translate(820, 1100);
    foilContext.rotate(-Math.PI / 10);
    foilContext.drawImage(pattern, -295, -310, 590, 620);
    foilContext.restore();
    foilContext.globalCompositeOperation = "source-in";
    const foil = foilContext.createLinearGradient(525, 790, 1115, 1410);
    foil.addColorStop(0, "#64c8ff");
    foil.addColorStop(0.25, "#c7a2ff");
    foil.addColorStop(0.45, "#ff89c8");
    foil.addColorStop(0.68, "#64ffc8");
    foil.addColorStop(1, "#ffc864");
    foilContext.fillStyle = foil;
    foilContext.fillRect(0, 0, canvas.width, canvas.height);
    // A fixed-angle souvenir of the same fine-grained foil used on the card.
    foilContext.globalCompositeOperation = "source-atop";
    let grainSeed = emblemSeed(pass);
    for (let i = 0; i < 18000; i++) {
      grainSeed = (Math.imul(grainSeed, 1664525) + 1013904223) >>> 0;
      const x = 430 + (grainSeed % 720);
      grainSeed = (Math.imul(grainSeed, 1664525) + 1013904223) >>> 0;
      const y = 730 + (grainSeed % 720);
      foilContext.fillStyle = `rgba(225, 239, 255, ${0.1 + (grainSeed % 40) / 100})`;
      foilContext.fillRect(x, y, 1.5, 1.5);
    }
    foilContext.strokeStyle = "#e5efff24";
    foilContext.lineWidth = 2;
    foilContext.beginPath();
    for (let x = -500; x < 1500; x += 42) {
      foilContext.moveTo(x, 730);
      foilContext.lineTo(x + 900, 1450);
    }
    foilContext.stroke();
    c.save();
    c.beginPath();
    c.rect(40, 40, 920, 1370);
    c.clip();
    c.globalAlpha = 0.3;
    c.drawImage(foilCanvas, 0, 0);
    c.restore();
  }
  c.fillStyle = "#ffffff";
  c.font = "bold 145px sans-serif";
  c.fillText("World", 85, 340);
  c.fillStyle = "#ffffff66";
  c.fillText("Pass.", 85, 480);
  c.fillStyle = "#67e8f9";
  c.font = "22px monospace";
  c.fillText("—  ISLAND EXPLORER", 90, 545);
  c.fillStyle = "#ffffff";
  c.font = "40px sans-serif";
  c.fillText(pass.nickname || "Fellow explorer", 90, 800, 820);
  c.font = "24px monospace";
  c.fillText(passNumber(pass), 90, 850);
  c.fillText("FIRST ARRIVAL  " + issuedDate(pass).toUpperCase(), 90, 902);
  c.strokeStyle = "#22d3ee33";
  c.beginPath();
  c.moveTo(90, 950);
  c.lineTo(910, 950);
  c.stroke();
  places.forEach((place, i) => {
    const x = 90 + (i % 3) * 278,
      y = 1005 + Math.floor(i / 3) * 100;
    c.fillStyle = pass.stamps.includes(place.id) ? "#67e8f9" : "#a5f3fc80";
    c.font = "20px monospace";
    c.fillText(
      pass.stamps.includes(place.id) ? place.stamp : "— UNVISITED",
      x,
      y,
    );
    c.font = "16px sans-serif";
    c.fillText(place.name, x, y + 30);
  });
  c.fillStyle = "#a5f3fc80";
  c.font = "19px sans-serif";
  c.fillText(pass.diveKit ? "DIVE KIT · READY TO EXPLORE" : "A little proof that you were here.", 90, 1310);
  c.font = "15px monospace";
  c.fillText("PERSONAL SOUVENIR · NOT AN IDENTITY DOCUMENT", 90, 1350);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Unable to create image"))),
      "image/png",
    ),
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wonderhao-${pass.id.slice(0, 8)}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
