import Link from "next/link";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import {
  Mail,
  ArrowRight,
  Palette,
  Share2,
  BarChart3,
  Code2,
  QrCode,
  Moon,
  CloudUpload,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { TEMPLATES } from "@/lib/types";

const FEATURES = [
  { icon: Palette, title: "5 pro templates", body: "Horizontal, vertical, card, minimal & modern — plus brand palettes and 9 email-safe fonts." },
  { icon: Share2, title: "Social, CTA & banners", body: "13 platforms with brand-colored icons, a call-to-action button and promo banners." },
  { icon: BarChart3, title: "UTM link tracking", body: "Auto-append utm_source / medium / campaign to every link for clean attribution." },
  { icon: Code2, title: "Clean HTML export", body: "Table-based, fully inline styles that survive Gmail, Outlook & Apple Mail. Minify on demand." },
  { icon: QrCode, title: "vCard QR code", body: "A scannable QR that drops your full contact card into anyone's phone." },
  { icon: Moon, title: "Dark-mode aware", body: "Live light/dark inbox preview with contrast warnings so nothing disappears." },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Mail className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold">Signature Studio</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/app">
                Open builder <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="animate-float-slow pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="mx-auto max-w-6xl px-5 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Free · No sign-up required
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-6xl">
            Email signatures that{" "}
            <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
              actually look good
            </span>{" "}
            in Gmail.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Design a polished, on-brand signature in minutes — templates, social
            icons, UTM tracking, vCard QR — then copy-paste or push it straight
            into Gmail. Built for marketers and engineers alike.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/app">
                Build my signature <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/app">Browse templates</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {["Works offline (local mode)", "Gmail-safe HTML", "Re-editable JSON export"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> {t}
              </span>
            ))}
          </div>

          {/* Signature mock */}
          <div className="mx-auto mt-14 max-w-xl rounded-2xl border bg-card p-6 text-left shadow-xl">
            <div className="mb-3 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-sky-500" />
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a7e0a0] to-[#2eaf96] text-xl font-bold text-white">
                CV
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-foreground">Charles Vincent</p>
                <p className="text-sm text-muted-foreground">Co-founder &amp; CTO</p>
                <p className="text-sm font-semibold text-[#2eaf96]">ClipHow</p>
                <p className="mt-1.5 truncate text-xs text-muted-foreground">
                  charles@cliphow.com · cliphow.com · France
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-center text-2xl font-bold">Start from a template</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
          Five layouts, fully customizable. Switch any time without losing your content.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {TEMPLATES.map((t) => (
            <Link
              key={t.id}
              href="/app"
              className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex h-20 items-center justify-center rounded-lg bg-muted/60 text-xs font-medium text-muted-foreground">
                {t.name}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Built for */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h3 className="mt-3 text-lg font-bold">For marketers</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {["UTM tracking on every link", "Promo banners & CTA buttons", "Role-based starter presets", "Brand palettes in one click"].map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <Code2 className="h-6 w-6 text-primary" />
            <h3 className="mt-3 text-lg font-bold">For engineers</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {["Clean, inline-styled table HTML", "Minified export + raw code copy", "Custom HTML mode", "Re-editable JSON import/export"].map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-3xl border bg-gradient-to-br from-primary to-sky-600 p-10 text-center text-white">
          <CloudUpload className="mx-auto h-10 w-10" />
          <h2 className="mt-4 text-3xl font-bold">Ship a better signature today</h2>
          <p className="mx-auto mt-2 max-w-md text-white/85">
            No account needed to start. Copy-paste into Gmail in under a minute.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link href="/app">
              Open the builder <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>© Signature Studio. Built with Next.js.</span>
          <Link href="/app" className="hover:text-foreground">
            Open builder →
          </Link>
        </div>
      </footer>
    </div>
  );
}
