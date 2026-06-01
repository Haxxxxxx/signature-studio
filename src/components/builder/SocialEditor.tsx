"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { SocialLink, SocialPlatform, SOCIAL_META } from "@/lib/types";
import { createSocialLink } from "@/lib/defaults";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PLATFORMS = Object.keys(SOCIAL_META) as SocialPlatform[];

export function SocialEditor({
  links,
  onChange,
}: {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}) {
  function patch(id: string, p: Partial<SocialLink>) {
    onChange(links.map((l) => (l.id === id ? { ...l, ...p } : l)));
  }
  function move(index: number, dir: -1 | 1) {
    const next = [...links];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-2.5">
      {links.length === 0 && (
        <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
          No social links yet.
        </p>
      )}
      {links.map((link, i) => (
        <div key={link.id} className="flex items-start gap-2">
          <div className="flex flex-col pt-1.5">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label="Move up"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>
          <div className="grid flex-1 grid-cols-[120px_1fr] gap-2">
            <Select
              value={link.platform}
              onValueChange={(v) => patch(link.id, { platform: v as SocialPlatform })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {SOCIAL_META[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-1.5">
              <Input
                value={link.url}
                placeholder={SOCIAL_META[link.platform].placeholder}
                onChange={(e) => patch(link.id, { url: e.target.value })}
              />
              {link.platform === "custom" && (
                <Input
                  value={link.label ?? ""}
                  placeholder="Label (e.g. Portfolio)"
                  onChange={(e) => patch(link.id, { label: e.target.value })}
                />
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onChange(links.filter((l) => l.id !== link.id))}
            aria-label="Remove link"
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...links, createSocialLink()])}
      >
        <Plus />
        Add social link
      </Button>
    </div>
  );
}
