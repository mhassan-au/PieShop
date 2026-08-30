import { createHash, randomBytes } from "node:crypto";

const SESSION_TOKEN_BYTES = 32;
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

type EntropySource = () => Uint8Array;

export type OpaqueSessionCredential = Readonly<{
  token: string;
  tokenHash: string;
}>;

function encodeBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export function parseSessionToken(input: unknown): string | null {
  return typeof input === "string" && SESSION_TOKEN_PATTERN.test(input)
    ? input
    : null;
}

export async function hashSessionToken(input: unknown): Promise<string | null> {
  const token = parseSessionToken(input);
  if (!token) return null;
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createOpaqueSessionCredential(
  entropySource: EntropySource = () => randomBytes(SESSION_TOKEN_BYTES),
): Promise<OpaqueSessionCredential> {
  const entropy = entropySource();
  if (entropy.byteLength !== SESSION_TOKEN_BYTES) {
    throw new Error("Session entropy source returned an invalid length");
  }

  const token = encodeBase64Url(entropy);
  const tokenHash = await hashSessionToken(token);
  if (!tokenHash) {
    throw new Error("Session credential creation failed");
  }

  return { token, tokenHash };
}
