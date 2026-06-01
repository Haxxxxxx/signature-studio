"use client";

import * as React from "react";
import { useStore } from "@/store/useStore";
import { renderSignatureHtml, renderFullDocument } from "@/lib/templates/render";
import {
  copyRichHtml,
  copyText,
  downloadFile,
  minifyHtml,
} from "@/lib/clipboard";
import { serializeSignature, parseSignature } from "@/lib/io";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GmailPushDialog } from "./GmailPushDialog";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Copy,
  Check,
  Download,
  Code2,
  Mail,
  HelpCircle,
  FileJson,
  Upload,
} from "lucide-react";

export function ExportBar() {
  const sig = useStore((s) => s.current());
  const addSignature = useStore((s) => s.addSignature);
  const toast = useToast();
  const [copied, setCopied] = React.useState<"rich" | "code" | null>(null);
  const [minify, setMinify] = React.useState(false);
  const importRef = React.useRef<HTMLInputElement>(null);
  if (!sig) return null;

  const html = renderSignatureHtml(sig);
  const htmlOut = minify ? minifyHtml(html) : html;
  const slug = sig.name.replace(/\s+/g, "-").toLowerCase() || "signature";

  async function flash(kind: "rich" | "code", fn: () => Promise<void>, msg: string) {
    try {
      await fn();
      setCopied(kind);
      toast(msg);
      setTimeout(() => setCopied(null), 1800);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Copy failed.", "error");
    }
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const imported = parseSignature(text);
      addSignature(imported);
      toast(`Imported “${imported.name}”`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Import failed.", "error");
    }
  }

  return (
    <div className="space-y-2.5 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2">
        <Button
          className="flex-1"
          onClick={() => flash("rich", () => copyRichHtml(html), "Signature copied — paste into Gmail")}
        >
          {copied === "rich" ? <Check /> : <Copy />}
          {copied === "rich" ? "Copied!" : "Copy signature"}
        </Button>
        <GmailPushDialog html={html}>
          <Button variant="secondary">
            <Mail /> Push to Gmail
          </Button>
        </GmailPushDialog>
        <InstructionsDialog />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => flash("code", () => copyText(htmlOut), "HTML copied")}
        >
          {copied === "code" ? <Check /> : <Code2 />}
          {copied === "code" ? "Copied!" : "Copy HTML"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            downloadFile(`${slug}-signature.html`, minify ? minifyHtml(renderFullDocument(sig)) : renderFullDocument(sig));
            toast("Downloaded .html");
          }}
        >
          <Download /> .html
        </Button>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground">
          <Switch checked={minify} onCheckedChange={setMinify} />
          Minify
        </label>
      </div>

      {/* Re-editable JSON format */}
      <div className="flex items-center gap-2 border-t pt-2.5">
        <span className="text-[11px] text-muted-foreground">Re-editable backup:</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={() => {
            downloadFile(`${slug}.json`, serializeSignature(sig), "application/json");
            toast("Exported editable .json");
          }}
        >
          <FileJson /> Export
        </Button>
        <Button variant="ghost" size="sm" className="h-7" onClick={() => importRef.current?.click()}>
          <Upload /> Import
        </Button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImport(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function InstructionsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="How to add to Gmail">
          <HelpCircle />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Gmail manually</DialogTitle>
        </DialogHeader>
        <ol className="space-y-3 text-sm">
          {[
            ["Copy", "Click “Copy signature” — it copies the formatted signature, not raw code."],
            ["Open settings", "In Gmail, click the ⚙️ gear → “See all settings”."],
            ["Find the signature box", "On the “General” tab, scroll to “Signature” and create or select one."],
            ["Paste", "Click into the box and paste (⌘/Ctrl + V). The formatting comes with it."],
            ["Save", "Scroll down and hit “Save Changes”. Done!"],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          Tip: if social icons don&apos;t appear, switch the icon style to
          “Text” in the Social tab — some inboxes block remote images by default.
        </p>
      </DialogContent>
    </Dialog>
  );
}
