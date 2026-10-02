import { UNIFI_PAYMENT_EXPIRY_SECONDS } from "../constants";
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

export function getUniFiPaymentRemainingSeconds(
  startTimestampSeconds: number,
  nowTimestampMilliseconds = Date.now(),
  expirySeconds = UNIFI_PAYMENT_EXPIRY_SECONDS,
): number {
  if (
    !Number.isSafeInteger(startTimestampSeconds) ||
    startTimestampSeconds < 0
  ) {
    throw new UniFiPayError(
      "startTimestampSeconds must be a non-negative integer.",
      { code: "INVALID_START_TIMESTAMP" },
    );
  }
  if (!Number.isFinite(nowTimestampMilliseconds)) {
    throw new UniFiPayError("nowTimestampMilliseconds must be finite.", {
      code: "INVALID_CURRENT_TIMESTAMP",
    });
  }
  if (!Number.isSafeInteger(expirySeconds) || expirySeconds < 0) {
    throw new UniFiPayError("expirySeconds must be a non-negative integer.", {
      code: "INVALID_EXPIRY",
    });
  }

  // Callers may shorten a checkout timer, but it must never outlive the hosted
  // FliqPay session represented by the URL timestamp.
  const effectiveExpirySeconds = Math.min(
    expirySeconds,
    UNIFI_PAYMENT_EXPIRY_SECONDS,
  );
  const expiresAtMilliseconds =
    (startTimestampSeconds + effectiveExpirySeconds) * 1000;
  const remaining = Math.ceil(
    (expiresAtMilliseconds - nowTimestampMilliseconds) / 1000,
  );

  // A slightly future start timestamp can occur when two devices' clocks differ.
  return Math.min(effectiveExpirySeconds, Math.max(0, remaining));
}
