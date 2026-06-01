/**
 * Core data model for an email signature.
 * Everything here is serializable so it can be stored in Firestore / localStorage
 * and rendered to email-safe HTML by `lib/templates/render.ts`.
 */

export type TemplateId =
  | "horizontal"
  | "vertical"
  | "card"
  | "minimal"
  | "modern"
  | "custom";

/** The reorderable building blocks of a signature (used by the Custom template). */
export type BlockId =
  | "photo"
  | "identity"
  | "contact"
  | "social"
  | "cta"
  | "banner"
  | "qr"
  | "disclaimer";

export interface LayoutBlock {
  id: BlockId;
  enabled: boolean;
}

export const BLOCK_LABELS: Record<BlockId, string> = {
  photo: "Photo / Logo",
  identity: "Name, title & company",
  contact: "Contact details",
  social: "Social icons",
  cta: "Call-to-action",
  banner: "Promo banner",
  qr: "vCard QR code",
  disclaimer: "Legal disclaimer",
};

export const DEFAULT_BLOCK_ORDER: LayoutBlock[] = [
  { id: "photo", enabled: true },
  { id: "identity", enabled: true },
  { id: "contact", enabled: true },
  { id: "social", enabled: true },
  { id: "cta", enabled: true },
  { id: "banner", enabled: true },
  { id: "qr", enabled: true },
  { id: "disclaimer", enabled: true },
];

export type SocialPlatform =
  | "linkedin"
  | "x"
  | "instagram"
  | "facebook"
  | "github"
  | "youtube"
  | "tiktok"
  | "dribbble"
  | "behance"
  | "whatsapp"
  | "telegram"
  | "website"
  | "custom";

export type ImageShape = "circle" | "rounded" | "square";

export interface SignatureFields {
  fullName: string;
  jobTitle: string;
  company: string;
  department: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  address: string;
}

export interface SignaturePhoto {
  /** Public URL (data URL or hosted). Empty string = no image. */
  url: string;
  /** avatar = personal headshot, logo = company logo. Affects default sizing. */
  kind: "avatar" | "logo";
  size: number; // px width
  shape: ImageShape;
}

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  /** Only used when platform === "custom". */
  label?: string;
}

export interface CallToAction {
  enabled: boolean;
  text: string;
  url: string;
  bgColor: string;
  textColor: string;
  rounded: boolean;
}

export interface Banner {
  enabled: boolean;
  imageUrl: string;
  link: string;
  width: number; // px
}

export interface TrackingConfig {
  /** Append UTM params to every external (http/https) link. */
  enabled: boolean;
  source: string;
  medium: string;
  campaign: string;
}

export interface SignatureStyle {
  template: TemplateId;
  primaryColor: string; // accent / links
  textColor: string;
  mutedColor: string; // secondary text (title/company)
  fontFamily: string; // email-safe stack
  fontSize: number; // base px
  /** Show 1px divider between photo block and text block. */
  showDivider: boolean;
  dividerColor: string;
  /** Spacing scale, px between rows. */
  spacing: number;
  /** Render social as colored icons vs text links. */
  socialStyle: "icon" | "iconColor" | "text";
  socialIconSize: number;
  /** Block order + visibility, honored by the "custom" template. */
  blocks: LayoutBlock[];
}

export interface Signature {
  id: string;
  /** Human label, e.g. "Work — Sales". */
  name: string;
  fields: SignatureFields;
  photo: SignaturePhoto;
  social: SocialLink[];
  cta: CallToAction;
  banner: Banner;
  style: SignatureStyle;
  tracking: TrackingConfig;
  disclaimer: string;
  /** vCard QR toggle — encodes contact details as a scannable QR. */
  vcardQr: boolean;
  /** When set, the renderer outputs this raw HTML instead of the builder output. */
  customHtml: string | null;
  customHtmlEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export const SOCIAL_META: Record<
  SocialPlatform,
  { label: string; color: string; placeholder: string }
> = {
  linkedin: { label: "LinkedIn", color: "#0A66C2", placeholder: "linkedin.com/in/username" },
  x: { label: "X", color: "#000000", placeholder: "x.com/username" },
  instagram: { label: "Instagram", color: "#E4405F", placeholder: "instagram.com/username" },
  facebook: { label: "Facebook", color: "#1877F2", placeholder: "facebook.com/username" },
  github: { label: "GitHub", color: "#181717", placeholder: "github.com/username" },
  youtube: { label: "YouTube", color: "#FF0000", placeholder: "youtube.com/@channel" },
  tiktok: { label: "TikTok", color: "#000000", placeholder: "tiktok.com/@username" },
  dribbble: { label: "Dribbble", color: "#EA4C89", placeholder: "dribbble.com/username" },
  behance: { label: "Behance", color: "#1769FF", placeholder: "behance.net/username" },
  whatsapp: { label: "WhatsApp", color: "#25D366", placeholder: "wa.me/15551234567" },
  telegram: { label: "Telegram", color: "#26A5E4", placeholder: "t.me/username" },
  website: { label: "Website", color: "#475569", placeholder: "example.com" },
  custom: { label: "Custom", color: "#475569", placeholder: "https://…" },
};

export const FONT_STACKS: { label: string; value: string }[] = [
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  {
    label: "System UI",
    value:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
];

/** One-click brand palettes (primary / text / muted / divider). */
export const BRAND_PALETTES: {
  name: string;
  primary: string;
  text: string;
  muted: string;
  divider: string;
}[] = [
  { name: "Indigo", primary: "#4f46e5", text: "#1f2937", muted: "#6b7280", divider: "#e5e7eb" },
  { name: "Sky", primary: "#0ea5e9", text: "#0f172a", muted: "#64748b", divider: "#e2e8f0" },
  { name: "Emerald", primary: "#059669", text: "#14241e", muted: "#5b6b64", divider: "#dce7e2" },
  { name: "Rose", primary: "#e11d48", text: "#1f2937", muted: "#6b7280", divider: "#f1e0e4" },
  { name: "Amber", primary: "#d97706", text: "#292524", muted: "#78716c", divider: "#ece4dc" },
  { name: "Violet", primary: "#7c3aed", text: "#1e1b2e", muted: "#6b6580", divider: "#e7e2f0" },
  { name: "Slate", primary: "#475569", text: "#1e293b", muted: "#64748b", divider: "#e2e8f0" },
  { name: "Charcoal", primary: "#111827", text: "#111827", muted: "#6b7280", divider: "#e5e7eb" },
];

export const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
  { id: "horizontal", name: "Horizontal", description: "Photo left, details right — the classic." },
  { id: "vertical", name: "Vertical", description: "Photo on top, stacked details below." },
  { id: "card", name: "Card", description: "Bordered card with accent bar." },
  { id: "minimal", name: "Minimal", description: "Text only, clean and tight." },
  { id: "modern", name: "Modern", description: "Bold accent divider, roomy spacing." },
  { id: "custom", name: "Custom", description: "Assemble blocks in your own order." },
];
