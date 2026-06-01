import { writeFileSync } from "node:fs";
import { createDefaultSignature } from "../src/lib/defaults";
import { renderSignatureHtml } from "../src/lib/templates/render";
import { Signature, TemplateId } from "../src/lib/types";

const base = (template: TemplateId): Signature =>
  createDefaultSignature({
    name: template,
    fields: {
      fullName: "Marcus Chen",
      jobTitle: "Chief Technology Officer",
      company: "Nimbus Cloud",
      department: "Engineering",
      phone: "",
      mobile: "+1 (415) 555-0199",
      email: "marcus@nimbus.cloud",
      website: "nimbus.cloud",
      address: "San Francisco, CA",
    },
    photo: {
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
      kind: "avatar",
      size: 84,
      shape: "circle",
    },
    social: [
      { id: "a", platform: "linkedin", url: "linkedin.com/in/marcuschen" },
      { id: "b", platform: "github", url: "github.com/marcuschen" },
      { id: "c", platform: "x", url: "x.com/marcusbuilds" },
    ],
    cta: {
      enabled: true,
      text: "Book a tech review",
      url: "https://cal.com/marcus",
      bgColor: "#0ea5e9",
      textColor: "#ffffff",
      rounded: true,
    },
    banner: { enabled: false, imageUrl: "", link: "", width: 480 },
    style: {
      template,
      primaryColor: "#0ea5e9",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: 14,
      showDivider: true,
      dividerColor: "#e2e8f0",
      spacing: 4,
      socialStyle: "iconColor",
      socialIconSize: 20,
    },
    disclaimer: "",
    vcardQr: false,
  });

const templates: TemplateId[] = ["horizontal", "vertical", "card", "minimal", "modern"];
const blocks = templates
  .map(
    (t) => `<div style="margin-bottom:8px">
      <div style="font:600 11px/1 Arial;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">${t}</div>
      ${renderSignatureHtml(base(t))}
    </div>`
  )
  .join('<hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0"/>');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:28px;background:#fff;width:560px">${blocks}</body></html>`;

writeFileSync("/tmp/cto-templates.html", html, "utf8");
console.log("Wrote /tmp/cto-templates.html");
