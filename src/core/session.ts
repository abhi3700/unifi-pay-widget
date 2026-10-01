import { UniFiPayError } from "./errors";

const SESSION_ID_PATTERN = /^[0-9a-f]{64}$/i;

export function isUniFiSessionId(value: string): boolean {
  return SESSION_ID_PATTERN.test(value);
}

export function createUniFiSessionId(): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new UniFiPayError(
      "A secure Web Crypto implementation is required to create a payment session.",
      { code: "CRYPTO_UNAVAILABLE" },
    );
  }

  const bytes = new Uint8Array(32);
  cryptoApi.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function assertUniFiSessionId(value: string): void {
  if (!isUniFiSessionId(value)) {
    throw new UniFiPayError(
      "sessionId must be a 64-character hexadecimal value.",
      { code: "INVALID_SESSION_ID" },
    );
  }
}
