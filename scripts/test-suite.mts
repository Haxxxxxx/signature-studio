/**
 * Feature test suite — exercises the core logic paths the way clients will hit
 * them. Run: npx tsx scripts/test-suite.mts
 */
import { createDefaultSignature, normalizeSignature } from "../src/lib/defaults";
import { renderSignatureHtml, renderFullDocument } from "../src/lib/templates/render";
import { trackedUrl } from "../src/lib/templates/utm";
import { buildVCard, vcardQrUrl } from "../src/lib/templates/vcard";
import { serializeSignature, parseSignature } from "../src/lib/io";
import { minifyHtml } from "../src/lib/clipboard";
import { isValidEmail, isValidUrl, normalizeUrl } from "../src/lib/utils";
import { PRESETS } from "../src/lib/presets";
import { TEMPLATES, TemplateId } from "../src/lib/types";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name} ${detail ? "— " + detail : ""}`);
  }
}

console.log("\n1. Renderer — every template produces valid table HTML");
for (const t of TEMPLATES) {
  const sig = createDefaultSignature({ style: { ...createDefaultSignature().style, template: t.id } });
  const html = renderSignatureHtml(sig);
  check(
    `template "${t.id}"`,
    html.includes("<table") && html.includes("Charles Vincent") && !html.includes("undefined"),
    html.slice(0, 60)
  );
}

console.log("\n2. UTM tracking");
const off = trackedUrl("acme.com", { enabled: false, source: "s", medium: "m", campaign: "c" });
check("disabled = no utm", off === "https://acme.com");
const on = trackedUrl("acme.com/path", { enabled: true, source: "email_signature", medium: "email", campaign: "q3" });
check("enabled appends utm", on.includes("utm_source=email_signature") && on.includes("utm_campaign=q3"), on);
const mailto = trackedUrl("mailto:a@b.com", { enabled: true, source: "s", medium: "m", campaign: "c" });
check("mailto untouched", mailto === "mailto:a@b.com", mailto);
const existing = trackedUrl("acme.com?utm_source=keep", { enabled: true, source: "new", medium: "m", campaign: "" });
check("keeps existing utm_source", existing.includes("utm_source=keep") && !existing.includes("utm_source=new"), existing);

console.log("\n3. UTM actually lands in rendered HTML");
const utmSig = createDefaultSignature();
utmSig.tracking = { enabled: true, source: "sig", medium: "email", campaign: "test" };
utmSig.cta = { ...utmSig.cta, enabled: true };
const utmHtml = renderSignatureHtml(utmSig);
check("website link carries utm", utmHtml.includes("utm_source=sig"));
check("cta link carries utm", (utmHtml.match(/utm_source=sig/g) || []).length >= 2);

console.log("\n4. vCard + QR");
const vc = buildVCard(createDefaultSignature());
check("vCard well-formed", vc.startsWith("BEGIN:VCARD") && vc.includes("END:VCARD") && vc.includes("FN:"));
check("QR url hosted png", vcardQrUrl(createDefaultSignature()).startsWith("https://api.qrserver.com"));

console.log("\n5. Presets all build without error");
for (const p of PRESETS) {
  try {
    const s = p.build();
    const html = renderSignatureHtml(s);
    check(`preset "${p.id}"`, !!s.id && html.includes("<table") && !html.includes("undefined"));
  } catch (e) {
    check(`preset "${p.id}"`, false, String(e));
  }
}

console.log("\n6. Migration — old signature missing new fields must not crash");
const legacy: Record<string, unknown> = {
  id: "old_1",
  name: "Legacy",
  fields: { fullName: "Old User", jobTitle: "", company: "", department: "", phone: "", mobile: "", email: "", website: "", address: "" },
  photo: { url: "", kind: "avatar", size: 90, shape: "circle" },
  social: [],
  style: { template: "horizontal", primaryColor: "#000", textColor: "#000", mutedColor: "#666", fontFamily: "Arial", fontSize: 14, showDivider: true, dividerColor: "#eee", spacing: 4, socialStyle: "iconColor", socialIconSize: 22 },
  createdAt: 1,
  updatedAt: 1,
  // NOTE: no tracking / cta / banner / disclaimer / vcardQr / customHtml
};
const migrated = normalizeSignature(legacy);
check("backfills tracking", !!migrated.tracking && migrated.tracking.enabled === false);
check("backfills cta", !!migrated.cta && migrated.cta.enabled === false);
check("backfills banner", !!migrated.banner);
check("preserves id", migrated.id === "old_1");
check("renders after migrate", renderSignatureHtml(migrated).includes("Old User"));

console.log("\n7. JSON export/import round-trip");
const original = PRESETS.find((p) => p.id === "marketing")!.build();
const json = serializeSignature(original);
const reimported = parseSignature(json);
check("round-trips template", reimported.style.template === original.style.template);
check("round-trips tracking", reimported.tracking.enabled === original.tracking.enabled);
check("fresh id on import", reimported.id !== original.id);
check("accepts bare signature object too", parseSignature(JSON.stringify(original)).name === original.name);

console.log("\n8. Export formats");
const full = renderFullDocument(createDefaultSignature());
check("full doc has doctype", full.startsWith("<!DOCTYPE html>"));
const min = minifyHtml(renderSignatureHtml(createDefaultSignature()));
check("minify removes inter-tag whitespace", !/>\s+</.test(min));

console.log("\n9. Validation helpers");
check("valid email", isValidEmail("a@b.com") && !isValidEmail("nope"));
check("valid url", isValidUrl("acme.com") && isValidUrl("https://x.io") && !isValidUrl("nope"));
check("normalizeUrl adds scheme", normalizeUrl("acme.com") === "https://acme.com");

console.log("\n10. Custom HTML mode overrides templates");
const custom = createDefaultSignature();
custom.customHtmlEnabled = true;
custom.customHtml = "<b>raw</b>";
check("custom html used verbatim", renderSignatureHtml(custom) === "<b>raw</b>");

console.log("\n11. XSS / escaping");
const evil = createDefaultSignature();
evil.fields.fullName = '<script>alert(1)</script>';
check("escapes html in fields", !renderSignatureHtml(evil).includes("<script>alert"));

console.log("\n12. Custom layout — block order honored");
const customSig = createDefaultSignature();
customSig.style.template = "custom";
customSig.style.blocks = [
  { id: "identity", enabled: true },
  { id: "contact", enabled: false },
  { id: "social", enabled: true },
];
const customHtml = renderSignatureHtml(customSig);
check("custom renders enabled blocks", customHtml.includes("Charles Vincent") && customHtml.includes("<table"));
check("custom omits disabled contact", !customHtml.includes(">E<") || !customHtml.includes("charles@cliphow.com"));
const templateIds: TemplateId[] = TEMPLATES.map((t) => t.id);
check("6 templates registered (incl. custom)", templateIds.length === 6 && templateIds.includes("custom"));

console.log("\n13. Links open in a new tab (target=_blank)");
const linkSig = createDefaultSignature();
linkSig.cta = { ...linkSig.cta, enabled: true };
const linkHtml = renderSignatureHtml(linkSig);
check("external links have target=_blank", linkHtml.includes('target="_blank"'));
check("mailto not target-blanked", !/mailto:[^"]*"\s+target/.test(linkHtml));

console.log("\n14. Custom layout — orientation, border, custom fields");
const cf = createDefaultSignature();
cf.style.template = "custom";
cf.style.customBorder = true;
cf.style.customOrientation = "horizontal";
cf.customFields = [{ id: "x", label: "Pronouns", value: "he/him" }];
const cfHtml = renderSignatureHtml(cf);
check("border wrap present", cfHtml.includes("border-left:4px solid"));
check("custom field renders", cfHtml.includes("Pronouns") && cfHtml.includes("he/him"));
const cfLink = createDefaultSignature();
cfLink.style.template = "custom";
cfLink.customFields = [{ id: "y", label: "Book", value: "calendly", url: "calendly.com/charles" }];
check(
  "custom field link works",
  renderSignatureHtml(cfLink).includes("https://calendly.com/charles")
);

console.log("\n15. Default signature = Charles Vincent / ClipHow");
const def = createDefaultSignature();
check("default name", def.fields.fullName === "Charles Vincent");
check("default company", def.fields.company === "ClipHow");
check("default logo is cliphow favicon", def.photo.url.includes("cliphow.com/favicon.png"));
check("default linkedin profile", def.social.some((s) => s.url.includes("charles-vincent123")));

console.log("\n16. CTA variants render");
const ctaSig = createDefaultSignature();
ctaSig.cta = { ...ctaSig.cta, enabled: true, variant: "outline", borderColor: "#e11d48", bgColor: "#e11d48", radius: 20, align: "center", fullWidth: true };
const ctaHtml = renderSignatureHtml(ctaSig);
check("outline cta has border", ctaHtml.includes("solid #e11d48"));
check("cta radius applied", ctaHtml.includes("border-radius:20px"));
check("cta full width", ctaHtml.includes("width:100%"));

console.log("\n17. Figma URL parsing + contact icons");
const { parseFigmaUrl } = await import("../src/lib/figma");
const fp = parseFigmaUrl("https://www.figma.com/design/Ii7tQrAZUJgTGwQ2cLxpvu/Templates?node-id=2-337&m=dev");
check("parses fileKey", fp?.fileKey === "Ii7tQrAZUJgTGwQ2cLxpvu");
check("parses + normalizes nodeId", fp?.nodeId === "2:337");
check("rejects non-figma / no node", parseFigmaUrl("https://example.com") === null);
const iconSig = createDefaultSignature();
iconSig.style.contactStyle = "icons";
check("contact icons render img", renderSignatureHtml(iconSig).includes("img.icons8.com/ios-glyphs"));

console.log("\n18. Company logo slot");
const logoSig = createDefaultSignature();
logoSig.logo = { url: "https://example.com/logo.png", width: 120, link: "https://example.com" };
const logoHtml = renderSignatureHtml(logoSig);
check("logo renders in horizontal", logoHtml.includes("https://example.com/logo.png"));
check("logo is linked", logoHtml.includes("https://example.com") && logoHtml.includes("target=\"_blank\""));
const noLogo = createDefaultSignature();
noLogo.logo = { url: "", width: 120, link: "" };
check("empty logo renders fine", renderSignatureHtml(noLogo).includes("Charles Vincent"));
check("logo backfilled on migrate", !!normalizeSignature({ id: "x", style: {} }).logo);

console.log(`\n${"=".repeat(40)}\nRESULT: ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
