import { writeFileSync } from "node:fs";
import { createDefaultSignature } from "../src/lib/defaults";
import { renderFullDocument } from "../src/lib/templates/render";
import { Signature } from "../src/lib/types";

// A realistic CTO signature exercising most features.
const cto: Signature = createDefaultSignature({
  name: "CTO — Work",
  fields: {
    fullName: "Marcus Chen",
    jobTitle: "Chief Technology Officer",
    company: "Nimbus Cloud",
    department: "Engineering",
    phone: "+1 (415) 555-0142",
    mobile: "+1 (415) 555-0199",
    email: "marcus@nimbus.cloud",
    website: "nimbus.cloud",
    address: "548 Market St, San Francisco, CA",
  },
  photo: {
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
    kind: "avatar",
    size: 96,
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
    url: "https://cal.com/marcus/intro",
    bgColor: "#0ea5e9",
    textColor: "#ffffff",
    rounded: true,
  },
  banner: { enabled: false, imageUrl: "", link: "", width: 480 },
  style: {
    template: "modern",
    primaryColor: "#0ea5e9",
    textColor: "#0f172a",
    mutedColor: "#64748b",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: 14,
    showDivider: true,
    dividerColor: "#e2e8f0",
    spacing: 4,
    socialStyle: "iconColor",
    socialIconSize: 22,
  },
  disclaimer:
    "This message is confidential and intended solely for the addressee. If you received it in error, please delete it and notify the sender.",
  vcardQr: true,
});

const html = renderFullDocument(cto);
writeFileSync("/tmp/cto-signature.html", html, "utf8");
console.log("Wrote /tmp/cto-signature.html");
console.log("\n--- raw signature fragment (first 600 chars) ---\n");
console.log(html.slice(html.indexOf("<body"), html.indexOf("<body") + 600));
