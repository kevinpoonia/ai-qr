// Edge-safe session token helpers. Uses only Web Crypto + TextEncoder/atob/btoa
// so this module can run in both Next.js middleware/proxy (Edge runtime) and API routes.

import type { Role } from "./types";

export const SESSION_COOKIE = "aiqr_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: number;
  businessId: number | null;
  role: Role;
  exp: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer as ArrayBuffer;
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(
  secret: string,
  payload: Omit<SessionPayload, "exp">,
  maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const full: SessionPayload = { ...payload, exp: Date.now() + maxAgeSeconds * 1000 };
  const payloadStr = base64UrlEncode(encoder.encode(JSON.stringify(full)));
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadStr));
  return `${payloadStr}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  secret: string
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [payloadStr, signature] = token.split(".");
  if (!payloadStr || !signature) return null;

  try {
    const key = await getKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signature),
      encoder.encode(payloadStr)
    );
    if (!valid) return null;

    const payload = JSON.parse(decoder.decode(base64UrlDecode(payloadStr))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;
    if (typeof payload.userId !== "number") return null;
    if (payload.businessId !== null && typeof payload.businessId !== "number") return null;

    return payload;
  } catch {
    return null;
  }
}
