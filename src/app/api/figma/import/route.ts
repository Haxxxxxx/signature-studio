import { NextRequest, NextResponse } from "next/server";

/**
 * Figma import proxy.
 *
 * Figma's REST API does not send CORS headers, so the browser can't call it
 * directly — this route does it server-side. The user's Figma token is used
 * transiently to fetch their file and is never stored or logged.
 *
 * Returns a flat extraction (text nodes + image fills + a preview render) that
 * the client maps heuristically onto a Signature.
 */

interface RGBA {
  r: number;
  g: number;
  b: number;
  a?: number;
}
interface FigmaNode {
  id: string;
  name?: string;
  type: string;
  characters?: string;
  style?: { fontSize?: number; fontWeight?: number };
  fills?: Array<{ type: string; color?: RGBA; imageRef?: string; visible?: boolean }>;
  cornerRadius?: number;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  children?: FigmaNode[];
}

function toHex(c?: RGBA): string | null {
  if (!c) return null;
  const h = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

/** Pull fileKey + nodeId out of a Figma URL (design or file links). */
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

interface ExtractedText {
  text: string;
  size: number;
  weight: number;
  color: string | null;
  x: number;
  y: number;
}
interface ExtractedImage {
  imageRef: string;
  url: string | null;
  width: number;
  height: number;
  round: boolean;
  x: number;
}

function walk(
  node: FigmaNode,
  texts: ExtractedText[],
  imageRefs: ExtractedImage[]
) {
  const bb = node.absoluteBoundingBox;
  if (node.type === "TEXT" && node.characters?.trim()) {
    const solid = node.fills?.find((f) => f.type === "SOLID" && f.visible !== false);
    texts.push({
      text: node.characters.trim(),
      size: node.style?.fontSize ?? 12,
      weight: node.style?.fontWeight ?? 400,
      color: toHex(solid?.color),
      x: bb?.x ?? 0,
      y: bb?.y ?? 0,
    });
  }
  const imgFill = node.fills?.find((f) => f.type === "IMAGE" && f.imageRef);
  if (imgFill?.imageRef && bb) {
    const round =
      node.type === "ELLIPSE" ||
      (typeof node.cornerRadius === "number" && node.cornerRadius >= Math.min(bb.width, bb.height) / 2 - 1);
    imageRefs.push({
      imageRef: imgFill.imageRef,
      url: null,
      width: Math.round(bb.width),
      height: Math.round(bb.height),
      round,
      x: bb.x,
    });
  }
  node.children?.forEach((c) => walk(c, texts, imageRefs));
}

export async function POST(req: NextRequest) {
  let body: { url?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { url, token } = body;
  if (!url || !token) {
    return NextResponse.json({ error: "Figma URL and token are required." }, { status: 400 });
  }
  const parsed = parseFigmaUrl(url);
  if (!parsed) {
    return NextResponse.json(
      { error: "Couldn't read that URL. Use a link with a ?node-id= (open a frame, then “Copy link”)." },
      { status: 400 }
    );
  }
  const { fileKey, nodeId } = parsed;
  const headers = { "X-Figma-Token": token };

  // 1) Node tree
  const nodesRes = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`,
    { headers }
  );
  if (nodesRes.status === 403) {
    return NextResponse.json({ error: "Figma rejected the token (403). Check your access token." }, { status: 403 });
  }
  if (!nodesRes.ok) {
    return NextResponse.json({ error: `Figma API error (${nodesRes.status}).` }, { status: 502 });
  }
  const nodesData = await nodesRes.json();
  const doc: FigmaNode | undefined = nodesData?.nodes?.[nodeId]?.document;
  if (!doc) {
    return NextResponse.json({ error: "Node not found in that file." }, { status: 404 });
  }

  const texts: ExtractedText[] = [];
  const images: ExtractedImage[] = [];
  walk(doc, texts, images);

  // 2) Resolve image fill refs → hosted URLs
  if (images.length) {
    try {
      const imgRes = await fetch(`https://api.figma.com/v1/files/${fileKey}/images`, { headers });
      if (imgRes.ok) {
        const map = (await imgRes.json())?.meta?.images ?? {};
        images.forEach((im) => (im.url = map[im.imageRef] ?? null));
      }
    } catch {
      /* non-fatal */
    }
  }

  // 3) A flat PNG render of the whole node for preview
  let previewUrl: string | null = null;
  try {
    const renderRes = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`,
      { headers }
    );
    if (renderRes.ok) {
      previewUrl = (await renderRes.json())?.images?.[nodeId] ?? null;
    }
  } catch {
    /* non-fatal */
  }

  return NextResponse.json({
    name: doc.name ?? "Imported signature",
    frameWidth: doc.absoluteBoundingBox?.width ?? null,
    texts,
    images,
    previewUrl,
  });
}
