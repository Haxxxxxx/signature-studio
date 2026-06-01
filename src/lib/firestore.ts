import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { Signature } from "./types";

/**
 * Firestore layout:
 *   users/{uid}/signatures/{signatureId}
 *
 * All operations are no-ops returning null/empty when Firebase isn't
 * configured — the store falls back to localStorage in that case.
 */

function sigCol(uid: string) {
  const db = getDb();
  if (!db) return null;
  return collection(db, "users", uid, "signatures");
}

export async function fbListSignatures(uid: string): Promise<Signature[]> {
  const col = sigCol(uid);
  if (!col) return [];
  const snap = await getDocs(query(col, orderBy("updatedAt", "desc")));
  return snap.docs.map((d) => d.data() as Signature);
}

export async function fbSaveSignature(uid: string, sig: Signature): Promise<void> {
  const db = getDb();
  if (!db) return;
  await setDoc(doc(db, "users", uid, "signatures", sig.id), sig, { merge: true });
}

export async function fbDeleteSignature(uid: string, id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, "users", uid, "signatures", id));
}
