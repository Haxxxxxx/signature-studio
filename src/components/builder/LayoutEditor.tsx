"use client";

import { ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { BLOCK_LABELS, LayoutBlock } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** Reorder + toggle the signature's building blocks for the Custom template. */
export function LayoutEditor({
  blocks,
  onChange,
}: {
  blocks: LayoutBlock[];
  onChange: (blocks: LayoutBlock[]) => void;
}) {
  function move(index: number, dir: -1 | 1) {
    const next = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function toggle(index: number, enabled: boolean) {
    onChange(blocks.map((b, i) => (i === index ? { ...b, enabled } : b)));
  }

  return (
    <div className="space-y-1.5">
      {blocks.map((b, i) => (
        <div
          key={b.id}
          className={cn(
            "flex items-center gap-2 rounded-lg border bg-card px-2.5 py-2 transition-opacity",
            !b.enabled && "opacity-55"
          )}
        >
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm">{BLOCK_LABELS[b.id]}</span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30 cursor-pointer"
              aria-label="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === blocks.length - 1}
              className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30 cursor-pointer"
              aria-label="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <Switch checked={b.enabled} onCheckedChange={(v) => toggle(i, v)} />
        </div>
      ))}
    </div>
  );
}
