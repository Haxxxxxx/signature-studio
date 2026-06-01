"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PRESETS } from "@/lib/presets";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/toast";
import { Sparkles, FileText, Briefcase, Megaphone, Code2, Phone, Minus } from "lucide-react";

const ICON: Record<string, React.ReactNode> = {
  blank: <FileText className="h-4 w-4" />,
  executive: <Briefcase className="h-4 w-4" />,
  marketing: <Megaphone className="h-4 w-4" />,
  engineer: <Code2 className="h-4 w-4" />,
  sales: <Phone className="h-4 w-4" />,
  minimalist: <Minus className="h-4 w-4" />,
};

export function NewSignatureDialog({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const [uncontrolled, setUncontrolled] = React.useState(false);
  const open = controlledOpen ?? uncontrolled;
  const setOpen = onOpenChange ?? setUncontrolled;
  const addSignature = useStore((s) => s.addSignature);
  const toast = useToast();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Start from a preset
          </DialogTitle>
          <DialogDescription>
            Pick a starting point — you can customize everything after.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                addSignature(p.build());
                setOpen(false);
                toast(`Created “${p.name}” signature`);
              }}
              className="flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/40 cursor-pointer"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-foreground">
                {ICON[p.id]}
              </span>
              <span className="text-sm font-semibold">{p.name}</span>
              <span className="text-[11px] leading-tight text-muted-foreground">
                {p.blurb}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
