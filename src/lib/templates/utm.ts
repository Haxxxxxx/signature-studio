import { TrackingConfig } from "../types";
import { normalizeUrl } from "../utils";

/**
 * Normalize a URL and, when tracking is on, append UTM params to http(s) links.
 * mailto:/tel: links are returned untouched. Existing utm_* params are kept.
 */
export function trackedUrl(raw: string, tracking?: TrackingConfig): string {
  const url = normalizeUrl(raw);
  if (!tracking?.enabled) return url;
  if (!/^https?:\/\//i.test(url)) return url;

  const [base, hash = ""] = url.split("#");
  const [path, existingQuery = ""] = base.split("?");
  const params = new URLSearchParams(existingQuery);
  const set = (k: string, v: string) => {
    if (v.trim() && !params.has(k)) params.set(k, v.trim());
  };
  set("utm_source", tracking.source);
  set("utm_medium", tracking.medium);
  set("utm_campaign", tracking.campaign);

  const qs = params.toString();
  return `${path}${qs ? `?${qs}` : ""}${hash ? `#${hash}` : ""}`;
}
