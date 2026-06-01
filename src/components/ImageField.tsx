"use client";

import * as React from "react";
import { Upload, Link2, X, Loader2, AlertTriangle } from "lucide-react";
import { Field } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/toast";
import { isStorageConfigured, uploadImage, fileToDataUrl } from "@/lib/storage";

export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const user = useStore((s) => s.user);
  const toast = useToast();
  const [busy, setBusy] = React.useState(false);
  const [warn, setWarn] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const canUpload = isStorageConfigured && !!user;

  async function handleFile(file: File) {
    setBusy(true);
    setWarn(false);
    try {
      if (canUpload && user) {
        const url = await uploadImage(user.uid, file);
        onChange(url);
      } else {
        const dataUrl = await fileToDataUrl(file);
        onChange(dataUrl);
        setWarn(true); // data URLs preview fine but won't render in Gmail
      }
    } catch (e) {
      console.error(e);
      toast(e instanceof Error ? e.message : "Upload failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="h-14 w-14 rounded-md border object-cover"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed text-muted-foreground">
            <Link2 className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <Input
            value={value.startsWith("data:") ? "" : value}
            placeholder="Paste image URL…"
            onChange={(e) => {
              setWarn(false);
              onChange(e.target.value);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Upload />}
            Upload
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {warn ? (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-600">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          Embedded as data — fine for preview, but Gmail won&apos;t show it. Sign
          in to host the image, or paste a public URL.
        </p>
      ) : null}
    </Field>
  );
}
