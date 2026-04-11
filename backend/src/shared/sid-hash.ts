import { createHash } from "crypto";

export function getSidHash(sessionId: string): string {
  const hash = createHash("sha256");
  hash.update(sessionId);
  return hash.digest("hex");
}