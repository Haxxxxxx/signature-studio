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

  // Pick the avatar/logo image: prefer round, then most square, leftmost.
  const imgs = [...ex.images].filter((i) => i.url);
  imgs.sort((a, b) => {
    if (a.round !== b.round) return a.round ? -1 : 1;
    const sq = (i: FigmaImage) => Math.abs(i.width / i.height - 1);
    return sq(a) - sq(b) || a.x - b.x;
  });
  const photo = imgs[0] ?? null;
  if (ex.images.length > imgs.length) notes.push("Some images couldn't be resolved.");
  if (imgs.length > 1) notes.push(`${imgs.length} images found — used the best fit as the photo/logo.`);
  if (photo) notes.push("Images use temporary Figma URLs — re-upload (or paste a hosted URL) so they show in Gmail.");

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
          kind: photo.round || Math.abs(photo.width / photo.height - 1) < 0.3 ? "avatar" : "logo",
          size: 80,
          shape: photo.round ? "circle" : "rounded",
        }
      : { ...base.photo, url: "" },
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
