"use client";

import { Plus, Trash2 } from "lucide-react";
import { CustomField } from "@/lib/types";
import { createCustomField } from "@/lib/defaults";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Add/edit arbitrary extra rows (label + value + optional link). */
export function CustomFieldsEditor({
  fields,
  onChange,
}: {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}) {
  function patch(id: string, p: Partial<CustomField>) {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...p } : f)));
  }

  return (
    <div className="space-y-2.5">
      {fields.length === 0 && (
        <p className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
          Add your own rows — pronouns, booking link, Skype, anything.
        </p>
      )}
      {fields.map((f) => (
        <div key={f.id} className="flex items-start gap-2 rounded-lg border bg-card p-2">
          <div className="grid flex-1 gap-1.5">
            <div className="grid grid-cols-[100px_1fr] gap-1.5">
              <Input
                value={f.label}
                placeholder="Label"
                onChange={(e) => patch(f.id, { label: e.target.value })}
              />
              <Input
                value={f.value}
                placeholder="Value"
                onChange={(e) => patch(f.id, { value: e.target.value })}
              />
            </div>
            <Input
              value={f.url ?? ""}
              placeholder="Link (optional) — https://…"
              onChange={(e) => patch(f.id, { url: e.target.value })}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onChange(fields.filter((x) => x.id !== f.id))}
            aria-label="Remove field"
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...fields, createCustomField()])}
      >
        <Plus />
        Add custom field
      </Button>
    </div>
  );
}
