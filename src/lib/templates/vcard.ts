import { Signature } from "../types";
import { normalizeUrl } from "../utils";

/** Build a vCard 3.0 string from the signature fields. */
export function buildVCard(sig: Signature): string {
  const f = sig.fields;
  const [first = "", ...rest] = f.fullName.trim().split(/\s+/);
  const last = rest.join(" ");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${last};${first};;;`,
    `FN:${f.fullName}`,
    f.company && `ORG:${f.company}${f.department ? `;${f.department}` : ""}`,
    f.jobTitle && `TITLE:${f.jobTitle}`,
    f.email && `EMAIL;TYPE=INTERNET,WORK:${f.email}`,
    f.phone && `TEL;TYPE=WORK,VOICE:${f.phone}`,
    f.mobile && `TEL;TYPE=CELL:${f.mobile}`,
    f.website && `URL:${normalizeUrl(f.website)}`,
    f.address && `ADR;TYPE=WORK:;;${f.address.replace(/\n/g, ", ")};;;;`,
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\n");
}

/**
 * Hosted QR PNG for the vCard. We use api.qrserver.com so the image is a real
 * remote PNG (Gmail-safe). Encodes the vCard payload directly.
 */
export function vcardQrUrl(sig: Signature, sizePx = 100): string {
  const data = encodeURIComponent(buildVCard(sig));
  const px = Math.round(sizePx * 2);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&margin=0&data=${data}`;
}
