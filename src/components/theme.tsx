"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "gss:theme";

interface ThemeCtx {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
}
const Ctx = React.createContext<ThemeCtx | null>(null);

/** Blocking script: applies the saved theme before paint to avoid a flash. */
export const themeInitScript = `(function(){try{var p=new URLSearchParams(location.search).get('theme');if(p==='dark'||p==='light'||p==='system'){localStorage.setItem('${STORAGE_KEY}',p);}var t=localStorage.getItem('${STORAGE_KEY}')||'system';var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t==='dark'||(t==='system'&&m);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function savedTheme(): Theme {
  if (typeof window === "undefined") return "system";
  // Optional ?theme=dark|light|system override (shareable / QA-friendly).
  const param = new URLSearchParams(window.location.search).get("theme");
  if (param === "dark" || param === "light" || param === "system") {
    localStorage.setItem(STORAGE_KEY, param);
    return param;
  }
  return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
}

function resolve(t: Theme): "light" | "dark" {
  return t === "dark" || (t === "system" && systemPrefersDark()) ? "dark" : "light";
}

const THEME_EVENT = "gss-theme-change";

/** Subscribe to theme changes (our own dispatch + cross-tab storage events). */
function subscribe(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(THEME_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore reads localStorage as an external store — it hydrates
  // with the server snapshot ("system") then re-reads on the client AFTER
  // hydration, so the toggle reflects the real saved theme without a
  // setState-in-effect cascade or a hydration mismatch.
  const theme = React.useSyncExternalStore(
    subscribe,
    savedTheme,
    () => "system" as Theme
  );
  // Derived, not state — so the effect never calls setState.
  const resolved: "light" | "dark" =
    typeof window === "undefined" ? "light" : resolve(theme);

  // Apply the DOM class whenever the theme changes; follow OS changes in
  // "system" mode. All DOM mutations, no React setState here.
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", resolve(theme) === "dark");
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(STORAGE_KEY) as Theme) === "system") {
        document.documentElement.classList.toggle("dark", mq.matches);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = React.useCallback((t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return <Ctx.Provider value={{ theme, resolved, setTheme }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

const OPTIONS: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: "light", icon: <Sun className="h-3.5 w-3.5" />, label: "Light" },
  { value: "dark", icon: <Moon className="h-3.5 w-3.5" />, label: "Dark" },
  { value: "system", icon: <Monitor className="h-3.5 w-3.5" />, label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center rounded-full border bg-card p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          suppressHydrationWarning
          title={o.label}
          aria-label={o.label}
          aria-pressed={theme === o.value}
          onClick={() => setTheme(o.value)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer",
            theme === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent"
          )}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
