import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Stable-ish id without external deps. */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.abs(hashString(`${performance.now()}-${navigator?.userAgent ?? ""}-${counter++}`)).toString(36)}`;
}

let counter = 0;
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

/** Escape a string for safe insertion into HTML text / attribute context. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Loose email check for inline validation hints (not RFC-strict). */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Loose check that a string looks like a usable web URL/domain. */
export function isValidUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return /^([a-z][a-z0-9+.-]*:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(v);
}

/** Normalize a user-entered URL so it always has a scheme. */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
