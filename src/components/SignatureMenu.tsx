"use client";

import * as React from "react";
import { useStore } from "@/store/useStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewSignatureDialog } from "@/components/builder/NewSignatureDialog";
import {
  ChevronDown,
  Plus,
  Copy,
  Trash2,
  Check,
  FileSignature,
  Pencil,
} from "lucide-react";

export function SignatureMenu() {
  const { signatures, currentId, current, select, newSignature, duplicate, remove, rename } =
    useStore();
  const active = current();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [presetOpen, setPresetOpen] = React.useState(false);

  if (!active) return null;

  function commitRename() {
    if (draft.trim()) rename(active!.id, draft.trim());
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-1.5">
      {editing ? (
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setEditing(false);
          }}
          className="h-8 w-44"
        />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent cursor-pointer">
              <FileSignature className="h-4 w-4 text-muted-foreground" />
              <span className="max-w-[160px] truncate">{active.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Your signatures</DropdownMenuLabel>
            {signatures.map((s) => (
              <DropdownMenuItem
                key={s.id}
                onClick={() => select(s.id)}
                className="justify-between"
              >
                <span className="max-w-[150px] truncate">{s.name}</span>
                {s.id === currentId && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setTimeout(() => setPresetOpen(true), 0)}>
              <Plus /> New from preset
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => newSignature()}>
              <Plus /> Blank signature
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicate(active.id)}>
              <Copy /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (confirm(`Delete “${active.name}”?`)) remove(active.id);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {!editing && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => {
            setDraft(active.name);
            setEditing(true);
          }}
          aria-label="Rename"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}

      <NewSignatureDialog open={presetOpen} onOpenChange={setPresetOpen} />
    </div>
  );
}
