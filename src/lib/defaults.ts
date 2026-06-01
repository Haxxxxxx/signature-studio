import {
  BlockId,
  CustomField,
  DEFAULT_BLOCK_ORDER,
  LayoutBlock,
  Signature,
  SocialLink,
} from "./types";
import { uid } from "./utils";

export function createCustomField(): CustomField {
  return { id: uid("fld"), label: "", value: "", url: "" };
}

/** Keep a saved block order but append any newly-introduced blocks at the end. */
function mergeBlocks(saved?: LayoutBlock[]): LayoutBlock[] {
  if (!Array.isArray(saved) || saved.length === 0) {
    return DEFAULT_BLOCK_ORDER.map((b) => ({ ...b }));
  }
  const known = new Set(DEFAULT_BLOCK_ORDER.map((b) => b.id));
  const kept = saved.filter((b) => b && known.has(b.id as BlockId));
  const present = new Set(kept.map((b) => b.id));
  const missing = DEFAULT_BLOCK_ORDER.filter((b) => !present.has(b.id));
  return [...kept, ...missing].map((b) => ({ id: b.id, enabled: b.enabled !== false }));
}

/**
 * Backfill any missing keys on a stored/imported signature from current
 * defaults. Critical for forward-compat: signatures saved before a field
 * existed (e.g. `tracking`) must not crash the UI. Preserves id/timestamps.
 */
export function normalizeSignature(raw: Partial<Signature>): Signature {
  const base = createDefaultSignature();
  return {
    ...base,
    ...raw,
    id: raw.id || base.id,
    name: raw.name ?? base.name,
    fields: { ...base.fields, ...raw.fields },
    photo: { ...base.photo, ...raw.photo },
    social: Array.isArray(raw.social) ? raw.social : base.social,
    cta: { ...base.cta, ...raw.cta },
    banner: { ...base.banner, ...raw.banner },
    style: { ...base.style, ...raw.style, blocks: mergeBlocks(raw.style?.blocks) },
    tracking: { ...base.tracking, ...raw.tracking },
    customFields: Array.isArray(raw.customFields) ? raw.customFields : base.customFields,
    disclaimer: raw.disclaimer ?? "",
    vcardQr: raw.vcardQr ?? false,
    customHtml: raw.customHtml ?? null,
    customHtmlEnabled: raw.customHtmlEnabled ?? false,
    createdAt: raw.createdAt ?? base.createdAt,
    updatedAt: raw.updatedAt ?? base.updatedAt,
  };
}

export function createSocialLink(
  platform: SocialLink["platform"] = "linkedin"
): SocialLink {
  return { id: uid("soc"), platform, url: "" };
}

/** A fresh signature with sensible, demo-friendly defaults. */
export function createDefaultSignature(overrides: Partial<Signature> = {}): Signature {
  const now = Date.now();
  return {
    id: uid("sig"),
    name: "My Signature",
    fields: {
      fullName: "Charles Vincent",
      jobTitle: "Co-founder & CTO",
      company: "ClipHow",
      department: "",
      phone: "",
      mobile: "+33 6 12 34 56 78",
      email: "charles@cliphow.com",
      website: "cliphow.com",
      address: "France",
    },
    photo: {
      url: "https://cliphow.com/favicon.png",
      kind: "avatar",
      size: 72,
      shape: "rounded",
    },
    social: [
      { id: uid("soc"), platform: "linkedin", url: "linkedin.com/in/charles-vincent123" },
      { id: uid("soc"), platform: "custom", url: "linkedin.com/company/cliphow", label: "ClipHow" },
    ],
    cta: {
      enabled: false,
      text: "Book a demo",
      url: "https://cliphow.com",
      bgColor: "#2eaf96",
      textColor: "#ffffff",
      rounded: true,
      variant: "filled",
      radius: 6,
      size: "md",
      borderColor: "#2eaf96",
      borderWidth: 1,
      fullWidth: false,
      bold: true,
      align: "left",
    },
    banner: {
      enabled: false,
      imageUrl: "",
      link: "",
      width: 480,
    },
    style: {
      template: "horizontal",
      primaryColor: "#2eaf96",
      textColor: "#1f2937",
      mutedColor: "#6b7280",
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: 14,
      showDivider: true,
      dividerColor: "#e5e7eb",
      dividerWidth: 1,
      dividerStyle: "solid",
      dividerSpacing: 16,
      spacing: 4,
      socialStyle: "iconColor",
      socialIconSize: 22,
      contactStyle: "letters",
      blocks: DEFAULT_BLOCK_ORDER.map((b) => ({ ...b })),
      customOrientation: "horizontal",
      customBorder: false,
    },
    tracking: {
      enabled: false,
      source: "email_signature",
      medium: "email",
      campaign: "",
    },
    customFields: [],
    disclaimer: "",
    vcardQr: false,
    customHtml: null,
    customHtmlEnabled: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
