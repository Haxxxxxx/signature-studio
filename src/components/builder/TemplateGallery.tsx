"use client";

import { TEMPLATES, TemplateId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/** Tiny abstract glyph per template so users can eyeball the layout. */
function Thumb({ id }: { id: TemplateId }) {
  const bar = "rounded-full bg-current";
  switch (id) {
    case "vertical":
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="h-4 w-4 rounded-full bg-current" />
          <div className={cn(bar, "h-1 w-8")} />
          <div className={cn(bar, "h-1 w-6 opacity-50")} />
        </div>
      );
    case "card":
      return (
        <div className="flex w-full items-center gap-1.5 rounded border-l-2 border-current px-1.5">
          <div className="h-4 w-4 rounded-full bg-current" />
          <div className="space-y-1">
            <div className={cn(bar, "h-1 w-7")} />
            <div className={cn(bar, "h-1 w-5 opacity-50")} />
          </div>
        </div>
      );
    case "minimal":
      return (
        <div className="space-y-1">
          <div className={cn(bar, "h-1.5 w-9")} />
          <div className={cn(bar, "h-1 w-7 opacity-50")} />
          <div className={cn(bar, "h-1 w-5 opacity-30")} />
        </div>
      );
    case "modern":
      return (
        <div className="space-y-1.5">
          <div className={cn(bar, "h-1 w-10")} />
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-full bg-current" />
            <div className="space-y-1">
              <div className={cn(bar, "h-1 w-6")} />
              <div className={cn(bar, "h-1 w-4 opacity-50")} />
            </div>
          </div>
        </div>
      );
    case "custom":
      return (
        <div className="space-y-1">
          <div className={cn(bar, "h-1.5 w-8 opacity-80")} />
          <div className={cn(bar, "h-1.5 w-6 opacity-60")} />
          <div className={cn(bar, "h-1.5 w-7 opacity-40")} />
          <div className="text-[8px] font-bold leading-none opacity-70">↕ reorder</div>
        </div>
      );
    case "horizontal":
    default:
      return (
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-current" />
          <div className="space-y-1">
            <div className={cn(bar, "h-1 w-7")} />
            <div className={cn(bar, "h-1 w-6 opacity-50")} />
            <div className={cn(bar, "h-1 w-4 opacity-30")} />
          </div>
        </div>
      );
  }
}

export function TemplateGallery({
  value,
  onChange,
}: {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {TEMPLATES.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "group relative flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors cursor-pointer",
              active
                ? "border-primary ring-1 ring-primary"
                : "border-input hover:border-primary/40 hover:bg-accent/40"
            )}
          >
            {active && (
              <span className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
            <div
              className={cn(
                "flex h-12 items-center justify-center rounded-md bg-muted/60 px-2",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Thumb id={t.id} />
            </div>
            <div>
              <div className="text-xs font-semibold">{t.name}</div>
              <div className="text-[10px] leading-tight text-muted-foreground">
                {t.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
