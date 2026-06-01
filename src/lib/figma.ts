import { Signature } from "./types";
import { createDefaultSignature } from "./defaults";

/**
 * Client side of the Figma import: call the proxy route, then heuristically map
 * the extracted text/images/colors onto a Signature. The result is fully
 * editable in the builder, so imperfect guesses are easy to fix.
 */

export interface FigmaText {
  text: string;
  size: number;
  weight: number;
  color: string | null;
  x: number;
  y: number;
}
export interface FigmaImage {
  imageRef: string;
  url: string | null;
  width: number;
  height: number;
  round: boolean;
  x: number;
}
export interface FigmaExtraction {
  name: string;
  frameWidth: number | null;
  texts: FigmaText[];
  images: FigmaImage[];
  previewUrl: string | null;
}

export function parseFigmaUrl(url: string): { fileKey: string; nodeId: string } | null {
  try {
    const u = new URL(url.trim());
    const m = u.pathname.match(/\/(?:design|file)\/([a-zA-Z0-9]+)/);
    const fileKey = m?.[1];
    const rawNode = u.searchParams.get("node-id");
    if (!fileKey || !rawNode) return null;
    return { fileKey, nodeId: rawNode.replace(/-/g, ":") };
  } catch {
    return null;
  }
}

export async function fetchFigmaExtraction(url: string, token: string): Promise<FigmaExtraction> {
  const res = await fetch("/api/figma/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Import failed.");
  return data as FigmaExtraction;
}

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const URL_RE = /^(https?:\/\/|www\.)|\.[a-z]{2,}(\/|$)/i;
const PHONE_RE = /^[+(]?[\d][\d\s().-]{6,}\d$/;

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = hex.replace("#", "");
  if (m.length !== 6) return null;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  if (max !== min) s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  return { h: 0, s, l };
}
function isColorful(hex: string | null): boolean {
  if (!hex) return false;
  const hsl = hexToHsl(hex);
  return !!hsl && hsl.s > 0.25 && hsl.l > 0.12 && hsl.l < 0.85;
}

/** Map a Figma extraction onto a Signature using content + style heuristics. */
export function mapExtractionToSignature(ex: FigmaExtraction): {
  signature: Signature;
  notes: string[];
} {
  const notes: string[] = [];
  const texts = [...ex.texts];

  const take = (re: RegExp) => {
    const i = texts.findIndex((t) => re.test(t.text));
    return i >= 0 ? texts.splice(i, 1)[0] : null;
  };
  const email = take(EMAIL_RE);
  const phone = texts.find((t) => PHONE_RE.test(t.text.replace(/\s/g, "")))
    ? texts.splice(texts.findIndex((t) => PHONE_RE.test(t.text.replace(/\s/g, ""))), 1)[0]
    : null;
  const website = take(URL_RE);

  // Remaining texts: largest/boldest first → name, title, company
  const rest = texts.sort((a, b) => b.size - a.size || b.weight - a.weight);
  const name = rest[0] ?? null;
  const title = rest[1] ?? null;
  const company = rest[2] ?? null;

  // Colors
  const primaryColor =
    (isColorful(name?.color ?? null) && name?.color) ||
    ex.texts.map((t) => t.color).find((c) => isColorful(c)) ||
    "#4f46e5";
  const dark = ex.texts
    .map((t) => t.color)
    .filter((c): c is string => !!c && !isColorful(c))
    .sort((a, b) => (hexToHsl(a)?.l ?? 1) - (hexToHsl(b)?.l ?? 1))[0];

  // Split images: a portrait/round one → avatar photo; a wide one → company logo.
  const imgs = [...ex.images].filter((i) => i.url);
  const aspect = (i: FigmaImage) => i.width / i.height;
  const portraits = imgs
    .filter((i) => i.round || aspect(i) < 1.4)
    .sort((a, b) => {
      if (a.round !== b.round) return a.round ? -1 : 1;
      return Math.abs(aspect(a) - 1) - Math.abs(aspect(b) - 1) || a.x - b.x;
    });
  const wides = imgs.filter((i) => !i.round && aspect(i) >= 1.4).sort((a, b) => b.x - a.x);
  const photo = portraits[0] ?? null;
  const logoImg = wides[0] ?? (portraits[1] ?? null);
  if (ex.images.length > imgs.length) notes.push("Some images couldn't be resolved.");
  if (photo || logoImg)
    notes.push("Images use temporary Figma URLs — re-upload (or paste a hosted URL) so they show in Gmail.");

  const base = createDefaultSignature({ name: ex.name || "Imported from Figma" });
  const signature: Signature = {
    ...base,
    fields: {
      ...base.fields,
      fullName: name?.text ?? "",
      jobTitle: title?.text ?? "",
      company: company?.text ?? "",
      department: "",
      phone: "",
      mobile: phone?.text ?? "",
      email: email?.text ?? "",
      website: website?.text ?? "",
      address: "",
    },
    photo: photo
      ? {
          url: photo.url!,
          kind: "avatar" as const,
          size: 80,
          shape: photo.round ? ("circle" as const) : ("rounded" as const),
        }
      : { ...base.photo, url: "" },
    logo: logoImg
      ? { url: logoImg.url!, width: Math.min(160, Math.max(80, logoImg.width)), link: "" }
      : { ...base.logo },
    social: [],
    style: {
      ...base.style,
      template: "horizontal",
      primaryColor,
      textColor: dark ?? base.style.textColor,
      contactStyle: "icons",
    },
  };
  return { signature, notes };
}
