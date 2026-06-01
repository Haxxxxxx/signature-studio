"use client";

import Link from "next/link";
import { useStore } from "@/store/useStore";
import { AppInit } from "@/components/AppInit";
import { AuthButton } from "@/components/AuthButton";
import { SignatureMenu } from "@/components/SignatureMenu";
import { ThemeToggle } from "@/components/theme";
import { Editor } from "@/components/builder/Editor";
import { Preview } from "@/components/builder/Preview";
import { ExportBar } from "@/components/builder/ExportBar";
import { Mail } from "lucide-react";

export default function BuilderPage() {
  const hydrated = useStore((s) => s.hydrated);

  return (
    <>
      <AppInit />
      <div className="flex min-h-screen flex-col bg-background lg:h-screen lg:overflow-hidden">
        {/* Header */}
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Mail className="h-4 w-4" />
              </span>
              <span className="hidden text-sm font-bold sm:block">Signature Studio</span>
            </Link>
            <div className="h-5 w-px bg-border" />
            {hydrated && <SignatureMenu />}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthButton />
          </div>
        </header>

        {/* Body */}
        {!hydrated ? (
          <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <main className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(420px,1fr)_minmax(420px,1.1fr)] lg:overflow-hidden">
            {/* Editor */}
            <section className="flex min-h-0 flex-col rounded-2xl border bg-card p-4 shadow-sm lg:overflow-hidden">
              <Editor />
            </section>

            {/* Preview + export */}
            <section className="flex min-h-0 flex-col gap-4 lg:overflow-hidden">
              <div className="flex min-h-[360px] flex-col rounded-2xl border bg-card p-4 shadow-sm lg:min-h-0 lg:flex-1">
                <Preview />
              </div>
              <ExportBar />
            </section>
          </main>
        )}
      </div>
    </>
  );
}
