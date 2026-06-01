import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirebaseAuth, GMAIL_SETTINGS_SCOPE } from "./firebase";

/**
 * Direct Gmail push.
 *
 * We obtain a short-lived OAuth access token (with the gmail.settings.basic
 * scope) via a Google popup, then call the Gmail REST API straight from the
 * browser — Google's APIs allow CORS for Bearer-token requests, so no server
 * round-trip is needed and the token never leaves the client.
 */

export interface SendAsAddress {
  sendAsEmail: string;
  displayName?: string;
  isPrimary?: boolean;
  isDefault?: boolean;
}

/** Pop a Google consent screen and return an access token with the Gmail scope. */
export async function requestGmailToken(): Promise<string> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured.");
  const provider = new GoogleAuthProvider();
  provider.addScope(GMAIL_SETTINGS_SCOPE);
  provider.setCustomParameters({ prompt: "consent" });
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  if (!token) throw new Error("Could not obtain a Gmail access token.");
  return token;
}

export async function listSendAs(token: string): Promise<SendAsAddress[]> {
  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(await describeError(res));
  const data = (await res.json()) as { sendAs?: SendAsAddress[] };
  return data.sendAs ?? [];
}

/** Patch the signature for a specific send-as address. */
export async function setGmailSignature(
  token: string,
  sendAsEmail: string,
  html: string
): Promise<void> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs/${encodeURIComponent(
      sendAsEmail
    )}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ signature: html }),
    }
  );
  if (!res.ok) throw new Error(await describeError(res));
}

async function describeError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const msg = body?.error?.message ?? res.statusText;
    if (res.status === 403)
      return `Gmail API denied (403): ${msg}. Make sure the Gmail API is enabled and the gmail.settings.basic scope was granted.`;
    return `Gmail API error (${res.status}): ${msg}`;
  } catch {
    return `Gmail API error (${res.status})`;
  }
}
