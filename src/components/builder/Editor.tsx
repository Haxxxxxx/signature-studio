"use client";

import { useStore } from "@/store/useStore";
import {
  BRAND_PALETTES,
  FONT_STACKS,
  ImageShape,
  Signature,
  SignatureFields,
  SignatureStyle,
  TemplateId,
} from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Field, TextField, ColorField, RangeField, PillGroup } from "@/components/fields";
import { isValidEmail, isValidUrl } from "@/lib/utils";
import { ImageField } from "@/components/ImageField";
import { TemplateGallery } from "./TemplateGallery";
import { SocialEditor } from "./SocialEditor";
import { LayoutEditor } from "./LayoutEditor";
import { User, Palette, Share2, Settings2 } from "lucide-react";

const TABS = ["content", "design", "social", "advanced"];

export function Editor() {
  const sig = useStore((s) => s.current());
  const update = useStore((s) => s.update);
  // Optional ?tab= deep-link (also handy for QA / sharing a specific panel).
  const initialTab =
    typeof window !== "undefined"
      ? TABS.find((t) => t === new URLSearchParams(window.location.search).get("tab")) ?? "content"
      : "content";
  if (!sig) return null;

  const setField = (key: keyof SignatureFields, value: string) =>
    update((s) => ({ ...s, fields: { ...s.fields, [key]: value } }));
  const setStyle = <K extends keyof SignatureStyle>(key: K, value: SignatureStyle[K]) =>
    update((s) => ({ ...s, style: { ...s.style, [key]: value } }));
  const setPhoto = (p: Partial<Signature["photo"]>) =>
    update((s) => ({ ...s, photo: { ...s.photo, ...p } }));
  const setCta = (c: Partial<Signature["cta"]>) =>
    update((s) => ({ ...s, cta: { ...s.cta, ...c } }));
  const setBanner = (b: Partial<Signature["banner"]>) =>
    update((s) => ({ ...s, banner: { ...s.banner, ...b } }));

  return (
    <Tabs defaultValue={initialTab} className="flex h-full flex-col">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="content">
          <User className="h-3.5 w-3.5" /> Content
        </TabsTrigger>
        <TabsTrigger value="design">
          <Palette className="h-3.5 w-3.5" /> Design
        </TabsTrigger>
        <TabsTrigger value="social">
          <Share2 className="h-3.5 w-3.5" /> Social
        </TabsTrigger>
        <TabsTrigger value="advanced">
          <Settings2 className="h-3.5 w-3.5" /> Advanced
        </TabsTrigger>
      </TabsList>

      <div className="scroll-thin mt-4 flex-1 overflow-y-auto pr-1">
        {/* CONTENT ------------------------------------------------------- */}
        <TabsContent value="content" className="mt-0 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Full name" value={sig.fields.fullName} onChange={(v) => setField("fullName", v)} placeholder="Jane Doe" />
            <TextField label="Job title" value={sig.fields.jobTitle} onChange={(v) => setField("jobTitle", v)} placeholder="Product Designer" />
            <TextField label="Company" value={sig.fields.company} onChange={(v) => setField("company", v)} placeholder="Acme Inc." />
            <TextField label="Department" value={sig.fields.department} onChange={(v) => setField("department", v)} placeholder="Design" />
            <TextField label="Phone" value={sig.fields.phone} onChange={(v) => setField("phone", v)} placeholder="+1 555 000 1111" />
            <TextField label="Mobile" value={sig.fields.mobile} onChange={(v) => setField("mobile", v)} placeholder="+1 555 222 3333" />
            <TextField label="Email" value={sig.fields.email} onChange={(v) => setField("email", v)} placeholder="jane@acme.com" validate={(v) => (isValidEmail(v) ? null : "Doesn't look like a valid email")} />
            <TextField label="Website" value={sig.fields.website} onChange={(v) => setField("website", v)} placeholder="acme.com" validate={(v) => (isValidUrl(v) ? null : "Doesn't look like a valid URL")} />
          </div>
          <TextField label="Address" value={sig.fields.address} onChange={(v) => setField("address", v)} placeholder="123 Market St, San Francisco" />

          <div className="rounded-lg border bg-card p-3 space-y-3">
            <ImageField label="Photo / Logo" value={sig.photo.url} onChange={(url) => setPhoto({ url })} />
            <div className="grid grid-cols-2 gap-3">
              <PillGroup<Signature["photo"]["kind"]>
                label="Type"
                value={sig.photo.kind}
                onChange={(kind) => setPhoto({ kind })}
                options={[
                  { value: "avatar", label: "Avatar" },
                  { value: "logo", label: "Logo" },
                ]}
              />
              <PillGroup<ImageShape>
                label="Shape"
                value={sig.photo.shape}
                onChange={(shape) => setPhoto({ shape })}
                options={[
                  { value: "circle", label: "Circle" },
                  { value: "rounded", label: "Rounded" },
                  { value: "square", label: "Square" },
                ]}
              />
            </div>
            <RangeField label="Image size" value={sig.photo.size} min={48} max={160} onChange={(size) => setPhoto({ size })} />
          </div>
        </TabsContent>

        {/* DESIGN -------------------------------------------------------- */}
        <TabsContent value="design" className="mt-0 space-y-4">
          <Field label="Template">
            <TemplateGallery value={sig.style.template} onChange={(template: TemplateId) => setStyle("template", template)} />
          </Field>

          {sig.style.template === "custom" && (
            <Field label="Section order" hint="Drag the order, toggle blocks on/off — your structure, your way.">
              <LayoutEditor
                blocks={sig.style.blocks}
                onChange={(blocks) => setStyle("blocks", blocks)}
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Font">
              <Select value={sig.style.fontFamily} onValueChange={(v) => setStyle("fontFamily", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_STACKS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <RangeField label="Base font size" value={sig.style.fontSize} min={11} max={20} onChange={(v) => setStyle("fontSize", v)} />
          </div>

          <Field label="Brand palette">
            <div className="flex flex-wrap gap-1.5">
              {BRAND_PALETTES.map((p) => {
                const active =
                  sig.style.primaryColor.toLowerCase() === p.primary.toLowerCase();
                return (
                  <button
                    key={p.name}
                    type="button"
                    title={p.name}
                    onClick={() =>
                      update((s) => ({
                        ...s,
                        style: {
                          ...s.style,
                          primaryColor: p.primary,
                          textColor: p.text,
                          mutedColor: p.muted,
                          dividerColor: p.divider,
                        },
                      }))
                    }
                    className={
                      "flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-all cursor-pointer hover:scale-110 " +
                      (active ? "ring-2 ring-foreground" : "")
                    }
                    style={{ backgroundColor: p.primary }}
                  >
                    <span className="sr-only">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <ColorField label="Accent" value={sig.style.primaryColor} onChange={(v) => setStyle("primaryColor", v)} />
            <ColorField label="Text" value={sig.style.textColor} onChange={(v) => setStyle("textColor", v)} />
            <ColorField label="Muted" value={sig.style.mutedColor} onChange={(v) => setStyle("mutedColor", v)} />
          </div>

          <div className="rounded-lg border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Show divider</Label>
              <Switch checked={sig.style.showDivider} onCheckedChange={(v) => setStyle("showDivider", v)} />
            </div>
            {sig.style.showDivider && (
              <ColorField label="Divider color" value={sig.style.dividerColor} onChange={(v) => setStyle("dividerColor", v)} />
            )}
          </div>
        </TabsContent>

        {/* SOCIAL -------------------------------------------------------- */}
        <TabsContent value="social" className="mt-0 space-y-4">
          <Field label="Social links">
            <SocialEditor links={sig.social} onChange={(social) => update((s) => ({ ...s, social }))} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <PillGroup<SignatureStyle["socialStyle"]>
              label="Icon style"
              value={sig.style.socialStyle}
              onChange={(v) => setStyle("socialStyle", v)}
              options={[
                { value: "iconColor", label: "Color" },
                { value: "icon", label: "Mono" },
                { value: "text", label: "Text" },
              ]}
            />
            {sig.style.socialStyle !== "text" && (
              <RangeField label="Icon size" value={sig.style.socialIconSize} min={16} max={36} onChange={(v) => setStyle("socialIconSize", v)} />
            )}
          </div>

          {/* CTA */}
          <div className="rounded-lg border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Call-to-action button</Label>
              <Switch checked={sig.cta.enabled} onCheckedChange={(v) => setCta({ enabled: v })} />
            </div>
            {sig.cta.enabled && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Button text" value={sig.cta.text} onChange={(v) => setCta({ text: v })} />
                  <TextField label="Button URL" value={sig.cta.url} onChange={(v) => setCta({ url: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ColorField label="Background" value={sig.cta.bgColor} onChange={(v) => setCta({ bgColor: v })} />
                  <ColorField label="Text color" value={sig.cta.textColor} onChange={(v) => setCta({ textColor: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-foreground">Rounded corners</Label>
                  <Switch checked={sig.cta.rounded} onCheckedChange={(v) => setCta({ rounded: v })} />
                </div>
              </>
            )}
          </div>

          {/* Banner */}
          <div className="rounded-lg border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Promo banner</Label>
              <Switch checked={sig.banner.enabled} onCheckedChange={(v) => setBanner({ enabled: v })} />
            </div>
            {sig.banner.enabled && (
              <>
                <ImageField label="Banner image" value={sig.banner.imageUrl} onChange={(url) => setBanner({ imageUrl: url })} />
                <TextField label="Banner link" value={sig.banner.link} onChange={(v) => setBanner({ link: v })} placeholder="https://…" />
                <RangeField label="Banner width" value={sig.banner.width} min={200} max={600} step={10} onChange={(v) => setBanner({ width: v })} />
              </>
            )}
          </div>
        </TabsContent>

        {/* ADVANCED ------------------------------------------------------ */}
        <TabsContent value="advanced" className="mt-0 space-y-4">
          {/* UTM tracking */}
          <div className="rounded-lg border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm text-foreground">Link tracking (UTM)</Label>
                <p className="text-[11px] text-muted-foreground">
                  Auto-append UTM params to every link for analytics attribution.
                </p>
              </div>
              <Switch
                checked={sig.tracking.enabled}
                onCheckedChange={(v) =>
                  update((s) => ({ ...s, tracking: { ...s.tracking, enabled: v } }))
                }
              />
            </div>
            {sig.tracking.enabled && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="utm_source"
                    value={sig.tracking.source}
                    onChange={(v) => update((s) => ({ ...s, tracking: { ...s.tracking, source: v } }))}
                    placeholder="email_signature"
                  />
                  <TextField
                    label="utm_medium"
                    value={sig.tracking.medium}
                    onChange={(v) => update((s) => ({ ...s, tracking: { ...s.tracking, medium: v } }))}
                    placeholder="email"
                  />
                </div>
                <TextField
                  label="utm_campaign"
                  value={sig.tracking.campaign}
                  onChange={(v) => update((s) => ({ ...s, tracking: { ...s.tracking, campaign: v } }))}
                  placeholder="q3_launch"
                />
                <p className="rounded-md bg-muted p-2 text-[11px] text-muted-foreground">
                  Applies to website, social, CTA &amp; banner links — not email/phone.
                </p>
              </>
            )}
          </div>

          <Field label="Legal disclaimer" hint="Small print appended under the signature.">
            <Textarea
              value={sig.disclaimer}
              placeholder="This email and any attachments are confidential…"
              onChange={(e) => update((s) => ({ ...s, disclaimer: e.target.value }))}
            />
          </Field>

          <div className="flex items-center justify-between rounded-lg border bg-card p-3">
            <div>
              <Label className="text-sm text-foreground">vCard QR code</Label>
              <p className="text-[11px] text-muted-foreground">Scannable QR that saves your contact.</p>
            </div>
            <Switch checked={sig.vcardQr} onCheckedChange={(v) => update((s) => ({ ...s, vcardQr: v }))} />
          </div>

          <div className="rounded-lg border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm text-foreground">Custom HTML mode</Label>
                <p className="text-[11px] text-muted-foreground">Override the builder with raw HTML.</p>
              </div>
              <Switch
                checked={sig.customHtmlEnabled}
                onCheckedChange={(v) =>
                  update((s) => ({
                    ...s,
                    customHtmlEnabled: v,
                    customHtml: v && s.customHtml == null ? "" : s.customHtml,
                  }))
                }
              />
            </div>
            {sig.customHtmlEnabled && (
              <Textarea
                className="min-h-[160px] font-mono text-xs"
                value={sig.customHtml ?? ""}
                placeholder="<table>…</table>"
                onChange={(e) => update((s) => ({ ...s, customHtml: e.target.value }))}
              />
            )}
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
