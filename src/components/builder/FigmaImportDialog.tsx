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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/toast";
import {
  fetchFigmaExtraction,
  mapExtractionToSignature,
  parseFigmaUrl,
} from "@/lib/figma";
import { Signature } from "@/lib/types";
import {
  Frame,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Link2,
  Info,
} from "lucide-react";

const TOKEN_KEY = "gss:figma-token";
type Stage = "form" | "loading" | "preview" | "error";

export function FigmaImportDialog({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const [unc, setUnc] = React.useState(false);
  const isOpen = open ?? unc;
  const setOpen = onOpenChange ?? setUnc;
  const addSignature = useStore((s) => s.addSignature);
  const toast = useToast();

  const [url, setUrl] = React.useState("");
  // Token persists locally; lazy-read once (it never leaves the browser except to fetch).
  const [token, setToken] = React.useState(() =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) || "" : ""
  );
  const [stage, setStage] = React.useState<Stage>("form");
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<{
    signature: Signature;
    notes: string[];
    previewUrl: string | null;
  } | null>(null);

  const urlValid = !!parseFigmaUrl(url);

  async function runImport() {
    setStage("loading");
    setError("");
    try {
      localStorage.setItem(TOKEN_KEY, token.trim());
      const ex = await fetchFigmaExtraction(url.trim(), token.trim());
      const mapped = mapExtractionToSignature(ex);
      setResult({ ...mapped, previewUrl: ex.previewUrl });
      setStage("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
      setStage("error");
    }
  }

  function confirmAdd() {
    if (!result) return;
    addSignature(result.signature);
    toast("Imported from Figma — tweak anything in the editor");
    setOpen(false);
    setTimeout(() => {
      setStage("form");
      setResult(null);
      setUrl("");
    }, 200);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {onOpenChange ? null : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Frame /> Import from Figma
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Frame className="h-5 w-5 text-primary" /> Import from Figma
          </DialogTitle>
          <DialogDescription>
            Turn a Figma signature mockup into an editable, Gmail-ready signature.
          </DialogDescription>
        </DialogHeader>

        {stage === "preview" && result ? (
          <div className="space-y-4">
            {result.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.previewUrl}
                alt="Figma frame"
                className="w-full rounded-lg border bg-white p-2"
              />
            ) : null}
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="mb-1 font-medium">Mapped fields</p>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {result.signature.fields.fullName && <li>Name: {result.signature.fields.fullName}</li>}
                {result.signature.fields.jobTitle && <li>Title: {result.signature.fields.jobTitle}</li>}
                {result.signature.fields.company && <li>Company: {result.signature.fields.company}</li>}
                {result.signature.fields.email && <li>Email: {result.signature.fields.email}</li>}
                {result.signature.fields.website && <li>Website: {result.signature.fields.website}</li>}
                {result.signature.fields.mobile && <li>Phone: {result.signature.fields.mobile}</li>}
              </ul>
            </div>
            {result.notes.map((n) => (
              <p key={n} className="flex items-start gap-1.5 text-[11px] text-amber-600">
                <Info className="mt-0.5 h-3 w-3 shrink-0" /> {n}
              </p>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStage("form")}>
                Back
              </Button>
              <Button className="flex-1" onClick={confirmAdd}>
                <CheckCircle2 /> Add to my signatures
              </Button>
            </div>
          </div>
        ) : stage === "loading" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <span className="text-sm">Reading your Figma frame…</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* How it works */}
            <div className="space-y-2 rounded-lg border border-primary/20 bg-accent/30 p-3 text-xs">
              <p className="font-semibold text-foreground">How it works</p>
              <ol className="space-y-1.5 text-muted-foreground">
                <li>
                  <b>1.</b> In Figma, select your signature <b>frame</b>, then{" "}
                  <b>right-click → Copy link to selection</b> (the URL must contain{" "}
                  <code className="rounded bg-muted px-1">?node-id=</code>).
                </li>
                <li>
                  <b>2.</b> Create a read-only <b>personal access token</b> at{" "}
                  <a
                    href="https://www.figma.com/developers/api#access-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    figma.com → Settings → Security
                  </a>{" "}
                  (scope: <i>File content → read-only</i>).
                </li>
                <li>
                  <b>3.</b> We read the frame&apos;s <b>text, colors &amp; images</b> and map them
                  to your signature fields. Everything stays editable after import.
                </li>
              </ol>
              <p className="text-[11px] text-muted-foreground/80">
                Your token is stored only in this browser and sent once to read your file —
                never saved on our servers. Imported images use temporary Figma URLs, so
                re-upload them (or paste a hosted URL) for Gmail.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> Figma frame URL
              </Label>
              <Input
                value={url}
                placeholder="https://figma.com/design/…?node-id=2-337"
                onChange={(e) => setUrl(e.target.value)}
              />
              {url && !urlValid && (
                <p className="text-[11px] text-destructive">
                  Need a link with <code>?node-id=</code> — use “Copy link to selection”.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" /> Figma access token
              </Label>
              <Input
                type="password"
                value={token}
                placeholder="figd_…"
                onChange={(e) => setToken(e.target.value)}
              />
            </div>

            {stage === "error" && (
              <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
              </p>
            )}

            <Button className="w-full" disabled={!urlValid || !token.trim()} onClick={runImport}>
              Import design <ArrowRight />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
