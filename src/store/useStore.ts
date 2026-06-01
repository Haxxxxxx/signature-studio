"use client";

import { create } from "zustand";
import { Signature } from "@/lib/types";
import { createDefaultSignature, normalizeSignature } from "@/lib/defaults";
import { uid } from "@/lib/utils";
import {
  fbDeleteSignature,
  fbListSignatures,
  fbSaveSignature,
} from "@/lib/firestore";

const LS_KEY = "gss:signatures:v1";

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface StoreState {
  hydrated: boolean;
  user: AuthUser | null;
  signatures: Signature[];
  currentId: string | null;

  hydrate: () => void;
  setUser: (user: AuthUser | null) => Promise<void>;

  current: () => Signature | null;
  select: (id: string) => void;
  newSignature: () => void;
  addSignature: (sig: Signature) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;

  /** Patch the current signature (shallow-merge per top-level key via updater). */
  update: (updater: (sig: Signature) => Signature) => void;
}

function loadLocal(): Signature[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<Signature>[];
    return Array.isArray(parsed) ? parsed.map(normalizeSignature) : [];
  } catch {
    return [];
  }
}

function saveLocal(sigs: Signature[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(sigs));
  } catch {
    /* quota / private mode — ignore */
  }
}

export const useStore = create<StoreState>((set, get) => ({
  hydrated: false,
  user: null,
  signatures: [],
  currentId: null,

  hydrate: () => {
    if (get().hydrated) return;
    let sigs = loadLocal();
    if (sigs.length === 0) {
      sigs = [createDefaultSignature()];
      saveLocal(sigs);
    }
    set({ signatures: sigs, currentId: sigs[0]?.id ?? null, hydrated: true });
  },

  setUser: async (user) => {
    set({ user });
    if (!user) return;
    // Signed in: Firestore becomes the source of truth. Upload any local-only
    // signatures that aren't in the cloud yet, then load the merged set.
    const remote = (await fbListSignatures(user.uid)).map(normalizeSignature);
    const local = get().signatures;
    const remoteIds = new Set(remote.map((s) => s.id));
    const localOnly = local.filter((s) => !remoteIds.has(s.id));
    await Promise.all(localOnly.map((s) => fbSaveSignature(user.uid, s)));
    const merged = [...localOnly, ...remote].sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
    const final = merged.length ? merged : [createDefaultSignature()];
    if (!merged.length) await fbSaveSignature(user.uid, final[0]);
    saveLocal(final);
    set({
      signatures: final,
      currentId: get().currentId ?? final[0]?.id ?? null,
    });
  },

  current: () => {
    const { signatures, currentId } = get();
    return signatures.find((s) => s.id === currentId) ?? signatures[0] ?? null;
  },

  select: (id) => set({ currentId: id }),

  newSignature: () => {
    const sig = createDefaultSignature({
      name: `Signature ${get().signatures.length + 1}`,
    });
    const signatures = [sig, ...get().signatures];
    set({ signatures, currentId: sig.id });
    persist(get, sig);
  },

  addSignature: (sig) => {
    const signatures = [sig, ...get().signatures];
    set({ signatures, currentId: sig.id });
    saveLocal(signatures);
    persist(get, sig);
  },

  duplicate: (id) => {
    const orig = get().signatures.find((s) => s.id === id);
    if (!orig) return;
    const copy: Signature = {
      ...orig,
      id: uid("sig"),
      name: `${orig.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const signatures = [copy, ...get().signatures];
    set({ signatures, currentId: copy.id });
    persist(get, copy);
  },

  remove: (id) => {
    const remaining = get().signatures.filter((s) => s.id !== id);
    const list = remaining.length ? remaining : [createDefaultSignature()];
    set({
      signatures: list,
      currentId: get().currentId === id ? list[0].id : get().currentId,
    });
    saveLocal(list);
    const user = get().user;
    if (user) void fbDeleteSignature(user.uid, id);
    if (!remaining.length) persist(get, list[0]);
  },

  rename: (id, name) => {
    applyToSignature(set, get, id, (s) => ({ ...s, name }));
  },

  update: (updater) => {
    const id = get().current()?.id;
    if (!id) return;
    applyToSignature(set, get, id, updater);
  },
}));

/** Mutate one signature, bump updatedAt, persist locally + remotely. */
function applyToSignature(
  set: (partial: Partial<StoreState>) => void,
  get: () => StoreState,
  id: string,
  updater: (sig: Signature) => Signature
) {
  let updated: Signature | null = null;
  const signatures = get().signatures.map((s) => {
    if (s.id !== id) return s;
    updated = { ...updater(s), updatedAt: Date.now() };
    return updated;
  });
  set({ signatures });
  saveLocal(signatures);
  if (updated) persist(get, updated);
}

/** Fire-and-forget remote save (debounced per signature id). */
const timers = new Map<string, ReturnType<typeof setTimeout>>();
function persist(get: () => StoreState, sig: Signature) {
  const user = get().user;
  if (!user) return;
  const existing = timers.get(sig.id);
  if (existing) clearTimeout(existing);
  timers.set(
    sig.id,
    setTimeout(() => {
      void fbSaveSignature(user.uid, sig);
      timers.delete(sig.id);
    }, 600)
  );
}
