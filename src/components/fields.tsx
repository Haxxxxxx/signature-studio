"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Labelled wrapper. */
export function Field({
  label,
  children,
  className,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Labelled text input bound to a value/onChange. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
  validate,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
  /** Return an error string to show, or null when valid. Only shown if non-empty. */
  validate?: (v: string) => string | null;
}) {
  const error = validate && value.trim() ? validate(value) : null;
  return (
    <Field label={label} hint={error ? undefined : hint}>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-destructive focus-visible:ring-destructive" : undefined}
      />
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </Field>
  );
}

/** Color picker + hex text input side by side. */
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        {/* Full-bleed color chip: the swatch fills the box, the native picker
            sits invisibly on top so it reads as a solid color, not an empty box. */}
        <span
          className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-input shadow-sm"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={label}
          />
        </span>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 px-2 font-mono text-xs uppercase"
        />
      </div>
    </Field>
  );
}

/** Native range slider with a value readout. */
export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "px",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
        />
        <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
    </Field>
  );
}

/** A row of selectable pills. */
export function PillGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              value === o.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-accent"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Field>
  );
}
