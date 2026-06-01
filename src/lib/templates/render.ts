import { Signature, SignatureStyle, SocialLink, SOCIAL_META } from "../types";
import { escapeHtml } from "../utils";
import { socialIconColorUrl, socialIconMonoUrl } from "./icons";
import { vcardQrUrl } from "./vcard";
import { trackedUrl } from "./utm";

/**
 * Email signature renderer.
 *
 * Produces table-based HTML with fully inline styles — the only thing that
 * survives across Gmail, Outlook and Apple Mail. No <style> blocks, no flexbox,
 * no SVG, no data-URI images. Width-controlled with nested tables.
 */

type Sig = Signature;

const FONT_FALLBACK = "Arial, Helvetica, sans-serif";

function s(style: Record<string, string | number | undefined>): string {
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

/** Open http(s) links in a new tab; leave mailto:/tel: alone. */
function targetAttr(href: string): string {
  return /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
}

function radiusFor(shape: string, size: number): string {
  if (shape === "circle") return "50%";
  if (shape === "rounded") return `${Math.round(size * 0.16)}px`;
  return "0";
}

/* ---------------------------------- pieces --------------------------------- */

function photoCell(sig: Sig): string {
  const { photo } = sig;
  if (!photo.url) return "";
  return `<img src="${escapeHtml(photo.url)}" width="${photo.size}" height="${
    photo.kind === "logo" ? "" : photo.size
  }" alt="${escapeHtml(sig.fields.fullName || sig.fields.company)}" style="${s({
    display: "block",
    "border-radius": radiusFor(photo.shape, photo.size),
    width: `${photo.size}px`,
    height: photo.kind === "logo" ? "auto" : `${photo.size}px`,
    "object-fit": "cover",
    border: "0",
    outline: "none",
    "text-decoration": "none",
  })}" />`;
}

function nameBlock(sig: Sig): string {
  const { fields: f, style: st } = sig;
  const parts: string[] = [];
  if (f.fullName) {
    parts.push(
      `<div style="${s({
        "font-size": `${st.fontSize + 5}px`,
        "font-weight": "bold",
        color: st.textColor,
        "line-height": "1.2",
        "padding-bottom": "2px",
      })}">${escapeHtml(f.fullName)}</div>`
    );
  }
  const titleLine = [f.jobTitle, f.department].filter(Boolean).join(" · ");
  if (titleLine) {
    parts.push(
      `<div style="${s({
        "font-size": `${st.fontSize}px`,
        color: st.mutedColor,
        "line-height": "1.3",
      })}">${escapeHtml(titleLine)}</div>`
    );
  }
  if (f.company) {
    parts.push(
      `<div style="${s({
        "font-size": `${st.fontSize}px`,
        "font-weight": "bold",
        color: st.primaryColor,
        "line-height": "1.3",
        "padding-top": "1px",
      })}">${escapeHtml(f.company)}</div>`
    );
  }
  return parts.join("");
}

type ContactKind = "phone" | "mobile" | "email" | "website" | "address";

const CONTACT_GLYPH: Record<ContactKind, string> = {
  phone: "phone",
  mobile: "iphone",
  email: "email",
  website: "domain",
  address: "marker",
};
const CONTACT_LETTER: Record<ContactKind, string> = {
  phone: "T",
  mobile: "M",
  email: "E",
  website: "W",
  address: "A",
};

/** Leading marker for a contact row — a glyph icon or a letter label. */
function contactLead(kind: ContactKind, st: SignatureStyle): string {
  if (st.contactStyle === "icons") {
    const px = Math.max(13, st.fontSize - 1);
    return `<img src="https://img.icons8.com/ios-glyphs/60/${CONTACT_GLYPH[kind]}.png" width="${px}" height="${px}" alt="" style="display:inline-block;vertical-align:middle;margin-right:7px;border:0;width:${px}px;height:${px}px" />`;
  }
  return `<span style="${s({ color: st.primaryColor, "font-weight": "bold" })}">${CONTACT_LETTER[kind]}</span>&nbsp;`;
}

function contactRow(
  kind: ContactKind,
  value: string,
  href: string | null,
  st: SignatureStyle
): string {
  const inner = href
    ? `<a href="${escapeHtml(href)}"${targetAttr(href)} style="${s({
        color: st.textColor,
        "text-decoration": "none",
      })}">${escapeHtml(value)}</a>`
    : escapeHtml(value);
  return `<tr><td style="${s({
    "font-size": `${st.fontSize - 1}px`,
    color: st.mutedColor,
    "padding-top": "3px",
    "line-height": "1.4",
    "white-space": kind === "address" ? "normal" : "nowrap",
  })}">${contactLead(kind, st)}${inner}</td></tr>`;
}

function contactBlock(sig: Sig): string {
  const { fields: f, style: st } = sig;
  const rows: string[] = [];
  if (f.phone) rows.push(contactRow("phone", f.phone, `tel:${f.phone.replace(/\s+/g, "")}`, st));
  if (f.mobile) rows.push(contactRow("mobile", f.mobile, `tel:${f.mobile.replace(/\s+/g, "")}`, st));
  if (f.email) rows.push(contactRow("email", f.email, `mailto:${f.email}`, st));
  if (f.website) {
    const display = f.website.replace(/^https?:\/\//, "");
    rows.push(contactRow("website", display, trackedUrl(f.website, sig.tracking), st));
  }
  if (f.address) rows.push(contactRow("address", f.address, null, st));
  if (!rows.length) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tbody>${rows.join(
    ""
  )}</tbody></table>`;
}

/** User-defined extra rows (label + value, optional link). */
function extrasBlock(sig: Sig): string {
  const { style: st } = sig;
  const rows = sig.customFields
    .filter((f) => f.label.trim() || f.value.trim())
    .map((f) => {
      const val = f.url && f.url.trim()
        ? `<a href="${escapeHtml(trackedUrl(f.url, sig.tracking))}"${targetAttr(
            trackedUrl(f.url, sig.tracking)
          )} style="${s({ color: st.textColor, "text-decoration": "none" })}">${escapeHtml(
            f.value
          )}</a>`
        : escapeHtml(f.value);
      return `<tr><td style="${s({
        "font-size": `${st.fontSize - 1}px`,
        color: st.mutedColor,
        "padding-top": "2px",
        "line-height": "1.4",
      })}">${
        f.label.trim()
          ? `<span style="${s({ color: st.primaryColor, "font-weight": "bold" })}">${escapeHtml(
              f.label
            )}</span>&nbsp;`
          : ""
      }${val}</td></tr>`;
    })
    .join("");
  if (!rows) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tbody>${rows}</tbody></table>`;
}

function socialBlock(sig: Sig, topPad = 10): string {
  const { social, style: st } = sig;
  const links = social.filter((l: SocialLink) => l.url.trim());
  if (!links.length) return "";

  const cells = links
    .map((l) => {
      const href = trackedUrl(l.url, sig.tracking);
      const meta = SOCIAL_META[l.platform];
      if (st.socialStyle === "text") {
        const label = l.platform === "custom" ? l.label || "Link" : meta.label;
        return `<td style="padding-right:12px"><a href="${escapeHtml(href)}"${targetAttr(href)} style="${s({
          color: st.primaryColor,
          "font-size": `${st.fontSize - 1}px`,
          "text-decoration": "none",
          "font-weight": "bold",
        })}">${escapeHtml(label)}</a></td>`;
      }
      const iconUrl =
        st.socialStyle === "iconColor"
          ? socialIconColorUrl(l.platform, st.socialIconSize)
          : socialIconMonoUrl(l.platform, st.socialIconSize);
      return `<td style="padding-right:8px"><a href="${escapeHtml(
        href
      )}"${targetAttr(href)} style="text-decoration:none"><img src="${escapeHtml(iconUrl)}" width="${
        st.socialIconSize
      }" height="${st.socialIconSize}" alt="${escapeHtml(meta.label)}" style="${s({
        display: "block",
        border: "0",
        width: `${st.socialIconSize}px`,
        height: `${st.socialIconSize}px`,
      })}" /></a></td>`;
    })
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${s({
    "border-collapse": "collapse",
    "padding-top": `${topPad}px`,
  })}"><tbody><tr>${cells}</tr></tbody></table>`;
}

/** Lighten a hex toward white by `amount` (0..1) — for the "soft" CTA fill. */
function tint(hex: string, amount: number): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix(parseInt(m.slice(0, 2), 16));
  const g = mix(parseInt(m.slice(2, 4), 16));
  const b = mix(parseInt(m.slice(4, 6), 16));
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

const CTA_PAD: Record<string, string> = {
  sm: "6px 14px",
  md: "10px 20px",
  lg: "13px 26px",
};
const CTA_FS: Record<string, number> = { sm: -1, md: 0, lg: 1 };

function ctaBlock(sig: Sig): string {
  const { cta } = sig;
  if (!cta.enabled || !cta.text.trim()) return "";
  const radius = `${Math.max(0, cta.radius ?? (cta.rounded ? 6 : 0))}px`;
  const size = cta.size ?? "md";

  let bg = cta.bgColor;
  let fg = cta.textColor;
  let border = "0";
  if (cta.variant === "outline") {
    bg = "transparent";
    fg = cta.bgColor;
    border = `${Math.max(1, cta.borderWidth ?? 1)}px solid ${cta.borderColor || cta.bgColor}`;
  } else if (cta.variant === "soft") {
    bg = tint(cta.bgColor, 0.85);
    fg = cta.bgColor;
  } else if (cta.borderWidth && cta.borderWidth > 0) {
    border = `${cta.borderWidth}px solid ${cta.borderColor || cta.bgColor}`;
  }

  const fullWidth = cta.fullWidth;
  const cell = s({
    "background-color": bg,
    "border-radius": radius,
    border: border === "0" ? undefined : border,
    "text-align": "center",
  });
  const link = s({
    display: fullWidth ? "block" : "inline-block",
    padding: CTA_PAD[size],
    color: fg,
    "font-size": `${sig.style.fontSize + CTA_FS[size]}px`,
    "font-weight": cta.bold ? "bold" : "normal",
    "text-decoration": "none",
    "font-family": sig.style.fontFamily || FONT_FALLBACK,
    "text-align": "center",
  });
  const href = trackedUrl(cta.url, sig.tracking);
  const button = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;${
    fullWidth ? "width:100%" : ""
  }"><tbody><tr><td style="${cell}"><a href="${escapeHtml(href)}"${targetAttr(
    href
  )} style="${link}">${escapeHtml(cta.text)}</a></td></tr></tbody></table>`;

  // Honor alignment via an outer wrapper.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;padding-top:12px;width:${
    fullWidth ? "100%" : "auto"
  }"><tbody><tr><td align="${cta.align ?? "left"}">${button}</td></tr></tbody></table>`;
}

function bannerInner(sig: Sig): string {
  const { banner } = sig;
  if (!banner.enabled || !banner.imageUrl.trim()) return "";
  const img = `<img src="${escapeHtml(banner.imageUrl)}" width="${banner.width}" alt="" style="${s(
    {
      display: "block",
      "max-width": "100%",
      width: `${banner.width}px`,
      height: "auto",
      border: "0",
      "border-radius": "6px",
    }
  )}" />`;
  return banner.link.trim()
    ? `<a href="${escapeHtml(trackedUrl(banner.link, sig.tracking))}"${targetAttr(
        trackedUrl(banner.link, sig.tracking)
      )} style="text-decoration:none">${img}</a>`
    : img;
}

function bannerBlock(sig: Sig): string {
  const inner = bannerInner(sig);
  return inner ? `<tr><td style="padding-top:14px">${inner}</td></tr>` : "";
}

function qrBlock(sig: Sig): string {
  if (!sig.vcardQr) return "";
  return `<img src="${escapeHtml(vcardQrUrl(sig, 92))}" width="92" height="92" alt="Scan to save contact" style="${s(
    { display: "block", border: "0", width: "92px", height: "92px" }
  )}" />`;
}

function disclaimerInner(sig: Sig): string {
  if (!sig.disclaimer.trim()) return "";
  return `<div style="${s({
    "font-size": "11px",
    color: "#9aa0a6",
    "line-height": "1.4",
    "max-width": "520px",
  })}">${escapeHtml(sig.disclaimer).replace(/\n/g, "<br/>")}</div>`;
}

function disclaimerBlock(sig: Sig): string {
  const inner = disclaimerInner(sig);
  return inner ? `<tr><td style="padding-top:12px">${inner}</td></tr>` : "";
}

function vDivider(st: SignatureStyle): string {
  const gap = Math.max(0, st.dividerSpacing ?? 16);
  if (!st.showDivider) return `<td style="width:${gap + 2}px">&nbsp;</td>`;
  const w = Math.max(1, st.dividerWidth || 1);
  // border-left supports solid/dashed/dotted (a background fill can't be dashed).
  return `<td style="width:${gap}px">&nbsp;</td><td style="${s({
    "border-left": `${w}px ${st.dividerStyle || "solid"} ${st.dividerColor}`,
    "font-size": "1px",
    "line-height": "1px",
    width: "1px",
  })}">&nbsp;</td><td style="width:${gap}px">&nbsp;</td>`;
}

/* -------------------------------- templates -------------------------------- */

function wrapRoot(st: SignatureStyle, inner: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${s({
    "border-collapse": "collapse",
    "font-family": st.fontFamily || FONT_FALLBACK,
    color: st.textColor,
    "font-size": `${st.fontSize}px`,
  })}"><tbody>${inner}</tbody></table>`;
}

function detailsStack(sig: Sig): string {
  return [
    nameBlock(sig),
    `<div style="padding-top:6px">${contactBlock(sig)}</div>`,
    socialBlock(sig),
    ctaBlock(sig),
  ]
    .filter(Boolean)
    .join("");
}

function renderHorizontal(sig: Sig): string {
  const { style: st } = sig;
  const photo = photoCell(sig);
  const qr = qrBlock(sig);
  const left = photo
    ? `<td valign="top" style="padding-right:0">${photo}${
        qr ? `<div style="padding-top:10px">${qr}</div>` : ""
      }</td>${vDivider(st)}`
    : "";
  const main = `<tr>${left}<td valign="top">${detailsStack(sig)}</td>${
    !photo && qr ? `<td valign="top" style="padding-left:18px">${qr}</td>` : ""
  }</tr>`;
  return wrapRoot(
    st,
    `<tr><td><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tbody>${main}</tbody></table></td></tr>${bannerBlock(
      sig
    )}${disclaimerBlock(sig)}`
  );
}

function renderVertical(sig: Sig): string {
  const { style: st } = sig;
  const photo = photoCell(sig);
  const rows = [
    photo && `<tr><td style="padding-bottom:10px">${photo}</td></tr>`,
    `<tr><td>${nameBlock(sig)}</td></tr>`,
    `<tr><td style="padding-top:6px">${contactBlock(sig)}</td></tr>`,
    sig.vcardQr && `<tr><td style="padding-top:10px">${qrBlock(sig)}</td></tr>`,
    `<tr><td>${socialBlock(sig)}</td></tr>`,
    `<tr><td>${ctaBlock(sig)}</td></tr>`,
    bannerBlock(sig),
    disclaimerBlock(sig),
  ]
    .filter(Boolean)
    .join("");
  return wrapRoot(st, rows);
}

function renderCard(sig: Sig): string {
  const { style: st } = sig;
  const photo = photoCell(sig);
  const inner = `<tr>${
    photo ? `<td valign="top" style="padding-right:16px">${photo}</td>` : ""
  }<td valign="top">${detailsStack(sig)}</td>${
    sig.vcardQr ? `<td valign="top" style="padding-left:16px">${qrBlock(sig)}</td>` : ""
  }</tr>`;
  const card = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${s(
    {
      "border-collapse": "separate",
      border: `1px solid ${st.dividerColor}`,
      "border-left": `4px solid ${st.primaryColor}`,
      "border-radius": "10px",
    }
  )}"><tbody><tr><td style="padding:16px 18px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tbody>${inner}</tbody></table></td></tr></tbody></table>`;
  return wrapRoot(
    st,
    `<tr><td>${card}</td></tr>${bannerBlock(sig)}${disclaimerBlock(sig)}`
  );
}

function renderMinimal(sig: Sig): string {
  const { fields: f, style: st } = sig;
  const line = [f.jobTitle, f.company].filter(Boolean).join(", ");
  const contacts = [
    f.mobile || f.phone,
    f.email,
    f.website?.replace(/^https?:\/\//, ""),
  ].filter(Boolean);
  const rows = [
    f.fullName &&
      `<tr><td style="${s({
        "font-size": `${st.fontSize + 3}px`,
        "font-weight": "bold",
        color: st.textColor,
      })}">${escapeHtml(f.fullName)}</td></tr>`,
    line &&
      `<tr><td style="${s({
        "font-size": `${st.fontSize}px`,
        color: st.mutedColor,
        "padding-top": "2px",
      })}">${escapeHtml(line)}</td></tr>`,
    contacts.length &&
      `<tr><td style="${s({
        "font-size": `${st.fontSize - 1}px`,
        color: st.primaryColor,
        "padding-top": "4px",
      })}">${contacts.map((c) => escapeHtml(c!)).join("&nbsp;&nbsp;•&nbsp;&nbsp;")}</td></tr>`,
    `<tr><td>${socialBlock(sig, 8)}</td></tr>`,
    `<tr><td>${ctaBlock(sig)}</td></tr>`,
    bannerBlock(sig),
    disclaimerBlock(sig),
  ]
    .filter(Boolean)
    .join("");
  return wrapRoot(st, rows);
}

function renderModern(sig: Sig): string {
  const { style: st } = sig;
  const photo = photoCell(sig);
  const accent = `<tr><td colspan="2" style="${s({
    height: "3px",
    "background-color": st.primaryColor,
    "font-size": "1px",
    "line-height": "1px",
    "border-radius": "2px",
  })}">&nbsp;</td></tr><tr><td colspan="2" style="height:14px;font-size:1px;line-height:1px">&nbsp;</td></tr>`;
  const body = `<tr>${
    photo ? `<td valign="top" style="padding-right:20px">${photo}</td>` : ""
  }<td valign="top">${detailsStack(sig)}</td>${
    sig.vcardQr ? `<td valign="top" style="padding-left:20px">${qrBlock(sig)}</td>` : ""
  }</tr>`;
  return wrapRoot(
    st,
    `<tr><td><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tbody>${accent}${body}</tbody></table></td></tr>${bannerBlock(
      sig
    )}${disclaimerBlock(sig)}`
  );
}

/** Inner HTML for a single block — used by the custom (assemble-your-own) layout. */
function blockHtml(sig: Sig, id: string): string {
  switch (id) {
    case "photo":
      return photoCell(sig);
    case "identity":
      return nameBlock(sig);
    case "contact":
      return contactBlock(sig);
    case "social":
      return socialBlock(sig, 0);
    case "cta":
      return ctaBlock(sig);
    case "banner":
      return bannerInner(sig);
    case "qr":
      return qrBlock(sig);
    case "extras":
      return extrasBlock(sig);
    case "disclaimer":
      return disclaimerInner(sig);
    default:
      return "";
  }
}

/** A full-width horizontal rule honoring divider color/width/style. */
function hRule(st: SignatureStyle): string {
  const w = Math.max(1, st.dividerWidth || 1);
  return `<div style="${s({
    "border-top": `${w}px ${st.dividerStyle || "solid"} ${st.dividerColor}`,
    "font-size": "1px",
    "line-height": "1px",
  })}"></div>`;
}

/** Stack a list of block ids into spaced rows; optional horizontal dividers. */
function stackBlocks(sig: Sig, ids: string[], gap: number, withDividers = false): string {
  const pieces = ids.map((id) => blockHtml(sig, id)).filter((html) => html.trim());
  return pieces
    .map((html, i) => {
      if (i === 0) return `<tr><td>${html}</td></tr>`;
      if (withDividers) {
        const dGap = Math.max(0, sig.style.dividerSpacing ?? 12);
        return `<tr><td style="padding-top:${dGap}px;padding-bottom:${dGap}px">${hRule(
          sig.style
        )}</td></tr><tr><td>${html}</td></tr>`;
      }
      return `<tr><td style="padding-top:${gap}px">${html}</td></tr>`;
    })
    .join("");
}

/** Wrap content in a bordered accent card (used by Card + Custom-with-border). */
function cardWrap(st: SignatureStyle, innerTable: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${s(
    {
      "border-collapse": "separate",
      border: `1px solid ${st.dividerColor}`,
      "border-left": `4px solid ${st.primaryColor}`,
      "border-radius": "10px",
    }
  )}"><tbody><tr><td style="padding:16px 18px">${innerTable}</td></tr></tbody></table>`;
}

function renderCustom(sig: Sig): string {
  const { style: st } = sig;
  const gap = Math.max(6, st.spacing * 2 + 4);
  const enabled = st.blocks.filter((b) => b.enabled).map((b) => b.id);

  let body: string;
  if (st.customOrientation === "horizontal") {
    // Photo (if enabled & present) sits left; everything else stacks right.
    const hasPhoto = enabled.includes("photo") && photoCell(sig).trim();
    const rest = stackBlocks(sig, enabled.filter((id) => id !== "photo"), gap);
    const restTable = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tbody>${rest}</tbody></table>`;
    const inner = `<tr>${
      hasPhoto
        ? `<td valign="top" style="padding-right:0">${photoCell(sig)}</td>${vDivider(st)}`
        : ""
    }<td valign="top">${restTable}</td></tr>`;
    body = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tbody>${inner}</tbody></table>`;
  } else {
    body = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tbody>${stackBlocks(
      sig,
      enabled,
      gap,
      sig.style.showDivider
    )}</tbody></table>`;
  }

  const wrapped = st.customBorder ? cardWrap(st, body) : body;
  return wrapRoot(st, `<tr><td>${wrapped}</td></tr>`);
}

/* --------------------------------- public ---------------------------------- */

/** Render a signature to an email-safe HTML fragment (a single <table>). */
export function renderSignatureHtml(sig: Sig): string {
  if (sig.customHtmlEnabled && sig.customHtml != null) {
    return sig.customHtml;
  }
  switch (sig.style.template) {
    case "vertical":
      return renderVertical(sig);
    case "card":
      return renderCard(sig);
    case "minimal":
      return renderMinimal(sig);
    case "modern":
      return renderModern(sig);
    case "custom":
      return renderCustom(sig);
    case "horizontal":
    default:
      return renderHorizontal(sig);
  }
}

/** Wrap the fragment in a full HTML document (for .html download / preview). */
export function renderFullDocument(sig: Sig): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(sig.name)}</title>
</head>
<body style="margin:0;padding:24px;background:#f3f4f6">
${renderSignatureHtml(sig)}
</body>
</html>`;
}
