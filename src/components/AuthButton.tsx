"use client";

import * as React from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, LogOut, Loader2, CloudOff } from "lucide-react";

export function AuthButton() {
  const user = useStore((s) => s.user);
  const [busy, setBusy] = React.useState(false);

  if (!isFirebaseConfigured) {
    return (
      <span
        className="hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground sm:flex"
        title="Firebase not configured — signatures are saved locally in this browser."
      >
        <CloudOff className="h-3.5 w-3.5" /> Local mode
      </span>
    );
  }

  async function signIn() {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider());
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
  }

  if (!user) {
    return (
      <Button size="sm" onClick={signIn} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <LogIn />}
        Sign in
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 text-sm transition-colors hover:bg-accent cursor-pointer">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full" />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {(user.displayName ?? user.email ?? "?").slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="hidden max-w-[120px] truncate sm:block">
            {user.displayName ?? user.email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
