import { SocialPlatform } from "../types";

/**
 * Map our platforms to icons8 slugs.
 * We use icons8 because it serves real PNGs over HTTPS — these render in Gmail,
 * Outlook and Apple Mail, unlike SVGs (which Gmail blocks) or data-URI images
 * (also blocked by Gmail).
 */
const ICONS8_SLUG: Record<SocialPlatform, string> = {
  linkedin: "linkedin",
  x: "twitterx",
  instagram: "instagram-new",
  facebook: "facebook-new",
  github: "github",
  youtube: "youtube-play",
  tiktok: "tiktok",
  dribbble: "dribbble",
  behance: "behance",
  whatsapp: "whatsapp",
  telegram: "telegram-app",
  website: "domain",
  custom: "link",
};

/** Brand-colored PNG icon (multicolor). */
export function socialIconColorUrl(platform: SocialPlatform, sizePx: number): string {
  const px = Math.max(32, Math.round(sizePx * 2)); // 2x for retina
  return `https://img.icons8.com/color/${px}/${ICONS8_SLUG[platform]}.png`;
}

/** Monochrome dark PNG icon. */
export function socialIconMonoUrl(platform: SocialPlatform, sizePx: number): string {
  const px = Math.max(32, Math.round(sizePx * 2));
  return `https://img.icons8.com/ios-filled/${px}/${ICONS8_SLUG[platform]}.png`;
}
