"use client";

import * as React from "react";
import { useStore } from "@/store/useStore";
import { renderSignatureHtml } from "@/lib/templates/render";
import { cn } from "@/lib/utils";
import { Monitor, Smartphone, Sun, Moon, AlertTriangle, Ruler } from "lucide-react";

type Bg = "light" | "dark";
type Device = "desktop" | "mobile";

/** Relative luminance + WCAG contrast ratio for the dark-mode readability check. */
function luminance(hex: string): number {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return 0;
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function Preview() {
  const sig = useStore((s) => s.current());
  const [bg, setBg] = React.useState<Bg>("light");
  const [device, setDevice] = React.useState<Device>("desktop");
  const [width, setWidth] = React.useState<number | null>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const html = sig ? renderSignatureHtml(sig) : "";
  const pageBg = bg === "light" ? "#ffffff" : "#1f1f1f";

  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="color-scheme" content="light dark"/>
    <base target="_blank"/>
    <style>html,body{margin:0;}
    body{min-height:100%;padding:24px;background:${pageBg};
    display:flex;align-items:flex-start;justify-content:center;}
    .sig-wrap{display:inline-block;}
    table{max-width:100%;}</style>
    </head><body><div class="sig-wrap">${html}</div></body></html>`;

  // Measure the rendered signature width after each render.
  const onLoad = React.useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      const el = doc?.body?.firstElementChild as HTMLElement | undefined;
      if (el) setWidth(Math.round(el.getBoundingClientRect().width));
    } catch {
      /* cross-origin guard — never happens for srcDoc */
    }
  }, []);

  // Dark-mode readability: warn if main text contrast on a dark bg is poor.
  const darkContrastWarn =
    bg === "dark" && sig
      ? contrast(sig.style.textColor, "#1f1f1f") < 3
      : false;

  const tooWide = width != null && width > 600;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Live preview
        </span>
        <div className="flex items-center gap-1">
          <ToggleBtn active={device === "desktop"} onClick={() => setDevice("desktop")} label="Desktop">
            <Monitor className="h-3.5 w-3.5" />
          </ToggleBtn>
          <ToggleBtn active={device === "mobile"} onClick={() => setDevice("mobile")} label="Mobile">
            <Smartphone className="h-3.5 w-3.5" />
          </ToggleBtn>
          <div className="mx-1 h-4 w-px bg-border" />
          <ToggleBtn active={bg === "light"} onClick={() => setBg("light")} label="Light inbox">
            <Sun className="h-3.5 w-3.5" />
          </ToggleBtn>
          <ToggleBtn active={bg === "dark"} onClick={() => setBg("dark")} label="Dark inbox">
            <Moon className="h-3.5 w-3.5" />
          </ToggleBtn>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-auto rounded-xl border bg-muted/40 p-4">
        <iframe
          ref={iframeRef}
          title="Signature preview"
          srcDoc={srcDoc}
          onLoad={onLoad}
          className={cn(
            "h-full min-h-[320px] rounded-lg border shadow-sm transition-all",
            device === "mobile" ? "w-[380px]" : "w-full"
          )}
          style={{ background: pageBg }}
        />
      </div>

      {/* Readout / warnings */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Ruler className="h-3 w-3" />
          {width != null ? `${width}px wide` : "measuring…"}
        </span>
        <span className={tooWide ? "text-amber-600" : "text-green-600"}>
          {tooWide ? "Wider than 600px — may clip on mobile" : "Email-width safe (≤600px)"}
        </span>
      </div>
      {darkContrastWarn && (
        <p className="mt-1.5 flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          Low contrast on a dark inbox — lighten your text color (or pick a
          lighter palette) so it stays readable in dark mode.
        </p>
      )}
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}
