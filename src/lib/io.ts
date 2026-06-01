import { Signature } from "./types";
import { normalizeSignature } from "./defaults";
import { uid } from "./utils";

/**
 * Portable signature file format.
 *
 * The HTML export is one-way (for pasting into Gmail). For *re-editable*
 * backups/sharing we serialize the full Signature model as JSON — re-importing
 * drops you back into the builder with everything intact.
 */
export const SIGNATURE_FILE_VERSION = 1;

interface SignatureFile {
  format: "signature-studio";
  version: number;
  signature: Signature;
}

export function serializeSignature(sig: Signature): string {
  const file: SignatureFile = {
    format: "signature-studio",
    version: SIGNATURE_FILE_VERSION,
    signature: sig,
  };
  return JSON.stringify(file, null, 2);
}

/**
 * Parse an imported .json file back into a Signature. Tolerant: accepts either
 * the wrapped file format or a bare signature object, and backfills any missing
 * fields from defaults so older/partial exports still load.
 */
export function parseSignature(raw: string): Signature {
  const data = JSON.parse(raw);
  const incoming: Partial<Signature> =
    data?.format === "signature-studio" && data.signature ? data.signature : data;

  if (!incoming || typeof incoming !== "object") {
    throw new Error("Not a valid signature file.");
  }

  // Backfill missing fields, then assign a fresh id/timestamps so importing
  // never collides with an existing signature.
  return {
    ...normalizeSignature(incoming),
    id: uid("sig"),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
