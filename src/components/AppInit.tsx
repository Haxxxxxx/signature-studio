"use client";

import * as React from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useStore } from "@/store/useStore";
import { getFirebaseAuth } from "@/lib/firebase";

/** Runs once on mount: hydrate local state and subscribe to Firebase auth. */
export function AppInit() {
  const hydrate = useStore((s) => s.hydrate);
  const setUser = useStore((s) => s.setUser);

  React.useEffect(() => {
    hydrate();
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      void setUser(
        u
          ? {
              uid: u.uid,
              displayName: u.displayName,
              email: u.email,
              photoURL: u.photoURL,
            }
          : null
      );
    });
    return unsub;
  }, [hydrate, setUser]);

  return null;
}
