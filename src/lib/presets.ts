import { Signature } from "./types";
import { createDefaultSignature, createSocialLink } from "./defaults";

export interface Preset {
  id: string;
  name: string;
  blurb: string;
  build: () => Signature;
}

/**
 * Role-based starting points. Each builds a full default signature then layers
 * a curated style + sensible field/social scaffold on top.
 */
export const PRESETS: Preset[] = [
  {
    id: "blank",
    name: "Blank",
    blurb: "Start from scratch.",
    build: () =>
      createDefaultSignature({
        name: "New signature",
        fields: {
          fullName: "",
          jobTitle: "",
          company: "",
          department: "",
          phone: "",
          mobile: "",
          email: "",
          website: "",
          address: "",
        },
        social: [],
      }),
  },
  {
    id: "executive",
    name: "Executive",
    blurb: "Refined, serif, understated.",
    build: () =>
      createDefaultSignature({
        name: "Executive",
        social: [createSocialLink("linkedin")],
        style: {
          ...createDefaultSignature().style,
          template: "card",
          primaryColor: "#111827",
          textColor: "#111827",
          mutedColor: "#6b7280",
          fontFamily: "Georgia, 'Times New Roman', serif",
          dividerColor: "#e5e7eb",
          socialStyle: "icon",
        },
      }),
  },
  {
    id: "marketing",
    name: "Marketing",
    blurb: "Bold accent, CTA, UTM tracking on.",
    build: () => {
      const base = createDefaultSignature({ name: "Marketing" });
      return {
        ...base,
        social: [createSocialLink("linkedin"), createSocialLink("instagram")],
        cta: {
          ...base.cta,
          enabled: true,
          text: "See what's new",
          url: "https://example.com/launch",
          bgColor: "#e11d48",
          textColor: "#ffffff",
          borderColor: "#e11d48",
        },
        tracking: {
          enabled: true,
          source: "email_signature",
          medium: "email",
          campaign: "always_on",
        },
        style: {
          ...base.style,
          template: "modern",
          primaryColor: "#e11d48",
          socialStyle: "iconColor",
        },
      };
    },
  },
  {
    id: "engineer",
    name: "Engineer",
    blurb: "Monospace touches, GitHub-first.",
    build: () => {
      const base = createDefaultSignature({ name: "Engineer" });
      return {
        ...base,
        social: [createSocialLink("github"), createSocialLink("linkedin"), createSocialLink("x")],
        style: {
          ...base.style,
          template: "minimal",
          primaryColor: "#0ea5e9",
          textColor: "#0f172a",
          mutedColor: "#64748b",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          socialStyle: "icon",
        },
      };
    },
  },
  {
    id: "sales",
    name: "Sales",
    blurb: "Photo, phone-forward, booking CTA.",
    build: () => {
      const base = createDefaultSignature({ name: "Sales" });
      return {
        ...base,
        social: [createSocialLink("linkedin")],
        cta: {
          ...base.cta,
          enabled: true,
          text: "Book a call",
          url: "https://cal.com/you",
          bgColor: "#059669",
          textColor: "#ffffff",
          borderColor: "#059669",
        },
        style: {
          ...base.style,
          template: "horizontal",
          primaryColor: "#059669",
          socialStyle: "iconColor",
        },
      };
    },
  },
  {
    id: "minimalist",
    name: "Minimalist",
    blurb: "Just the essentials, no photo.",
    build: () => {
      const base = createDefaultSignature({ name: "Minimalist" });
      return {
        ...base,
        photo: { ...base.photo, url: "" },
        social: [],
        style: {
          ...base.style,
          template: "minimal",
          primaryColor: "#475569",
          textColor: "#1e293b",
          mutedColor: "#64748b",
          showDivider: false,
          socialStyle: "text",
        },
      };
    },
  },
];
