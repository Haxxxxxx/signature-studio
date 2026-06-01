import { getStorage } from "firebase/storage";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getApps, getApp } from "firebase/app";
import { isFirebaseConfigured } from "./firebase";

export const isStorageConfigured =
  isFirebaseConfigured && Boolean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

/** Upload an image to Firebase Storage and return a public download URL. */
export async function uploadImage(uid: string, file: File): Promise<string> {
  if (!isStorageConfigured) throw new Error("Storage is not configured.");
  if (!getApps().length) throw new Error("Firebase app not initialized.");
  const storage = getStorage(getApp());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `users/${uid}/images/${Date.now()}_${safeName}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type });
  return getDownloadURL(r);
}

/** Read a file as a data URL (browser-preview fallback; not Gmail-safe). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}
