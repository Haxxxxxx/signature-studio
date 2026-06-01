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
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  listSendAs,
  requestGmailToken,
  SendAsAddress,
  setGmailSignature,
} from "@/lib/gmail";
import { CheckCircle2, Loader2, Mail, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = "intro" | "connecting" | "choose" | "pushing" | "done" | "error";

export function GmailPushDialog({
  html,
  children,
}: {
  html: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [stage, setStage] = React.useState<Stage>("intro");
  const [token, setToken] = React.useState<string | null>(null);
  const [addresses, setAddresses] = React.useState<SendAsAddress[]>([]);
  const [selected, setSelected] = React.useState<string>("");
  const [error, setError] = React.useState("");

  function reset() {
    setStage("intro");
    setToken(null);
    setAddresses([]);
    setSelected("");
    setError("");
  }

  async function connect() {
    setStage("connecting");
    setError("");
    try {
      const t = await requestGmailToken();
      setToken(t);
      const list = await listSendAs(t);
      setAddresses(list);
      setSelected(list.find((a) => a.isPrimary)?.sendAsEmail ?? list[0]?.sendAsEmail ?? "");
      setStage("choose");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed.");
      setStage("error");
    }
  }

  async function push() {
    if (!token || !selected) return;
    setStage("pushing");
    setError("");
    try {
      await setGmailSignature(token, selected, html);
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Push failed.");
      setStage("error");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTimeout(reset, 200);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Push to Gmail
          </DialogTitle>
          <DialogDescription>
            Write this signature straight into your Gmail account settings.
          </DialogDescription>
        </DialogHeader>

        {!isFirebaseConfigured ? (
          <Notice
            icon={<AlertCircle className="h-4 w-4" />}
            tone="warn"
            text="Direct push needs Firebase + Google OAuth configured. Add your Firebase env vars (see README) — or just use “Copy signature” and paste it into Gmail manually."
          />
        ) : stage === "intro" ? (
          <div className="space-y-4">
            <Notice
              icon={<ShieldCheck className="h-4 w-4" />}
              tone="info"
              text="You'll grant the gmail.settings.basic scope. The token stays in your browser and is only used to update your signature — nothing is stored on a server."
            />
            <Button className="w-full" onClick={connect}>
              <Mail /> Connect Gmail
            </Button>
          </div>
        ) : stage === "connecting" ? (
          <Busy label="Opening Google consent…" />
        ) : stage === "choose" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Apply to which address?</p>
            <div className="space-y-1.5">
              {addresses.map((a) => (
                <button
                  key={a.sendAsEmail}
                  type="button"
                  onClick={() => setSelected(a.sendAsEmail)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                    selected === a.sendAsEmail
                      ? "border-primary ring-1 ring-primary"
                      : "border-input hover:bg-accent"
                  )}
                >
                  <span>
                    {a.sendAsEmail}
                    {a.isPrimary ? (
                      <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        primary
                      </span>
                    ) : null}
                  </span>
                  {selected === a.sendAsEmail && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
            <Button className="w-full" onClick={push} disabled={!selected}>
              Apply signature
            </Button>
          </div>
        ) : stage === "pushing" ? (
          <Busy label="Updating Gmail…" />
        ) : stage === "done" ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <p className="font-medium">Signature applied 🎉</p>
              <p className="text-sm text-muted-foreground">
                Open Gmail → Compose to see it. You may need to reload Gmail.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Notice icon={<AlertCircle className="h-4 w-4" />} tone="warn" text={error} />
            <Button variant="outline" className="w-full" onClick={reset}>
              Try again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Busy({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function Notice({
  icon,
  text,
  tone,
}: {
  icon: React.ReactNode;
  text: string;
  tone: "info" | "warn";
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border p-3 text-xs leading-relaxed",
        tone === "warn"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-blue-200 bg-blue-50 text-blue-800"
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
