import { UNIFI_CHECKOUT_BASE_URL } from "../constants";
import type {
  CreateUniFiPaymentInput,
  UniFiPaymentSession,
} from "../types";
import { UniFiPayError } from "./errors";
import { assertUniFiSessionId, createUniFiSessionId } from "./session";

function normalizeAmount(value: string | number): string {
  const amount = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(amount) || Number(amount) <= 0) {
    throw new UniFiPayError("amount must be a positive decimal value.", {
      code: "INVALID_AMOUNT",
    });
  }
  return amount;
}

function requireRecipient(value: string): string {
  const recipient = value.trim();
  if (!recipient) {
    throw new UniFiPayError("recipient is required.", {
      code: "INVALID_RECIPIENT",
    });
  }
  return recipient;
}

export function createUniFiPayment(
  input: CreateUniFiPaymentInput,
): UniFiPaymentSession {
  const amount = normalizeAmount(input.amount);
  const recipient = requireRecipient(input.recipient);
  const sessionId = input.sessionId ?? createUniFiSessionId();
  assertUniFiSessionId(sessionId);

  const startTimestampSeconds =
    input.startTimestampSeconds ?? Math.floor(Date.now() / 1000);
  if (
    !Number.isSafeInteger(startTimestampSeconds) ||
    startTimestampSeconds < 0
  ) {
    throw new UniFiPayError(
      "startTimestampSeconds must be a non-negative integer.",
      { code: "INVALID_START_TIMESTAMP" },
    );
  }
  const baseUrl = input.checkoutBaseUrl ?? UNIFI_CHECKOUT_BASE_URL;
  const parts = [
    "app",
    "fliqpay",
    input.network,
    input.asset,
    recipient,
    amount,
    sessionId,
    String(startTimestampSeconds),
  ].map(encodeURIComponent);
  const payUrl = new URL(`/${parts.join("/")}`, baseUrl).toString();

  return {
    asset: input.asset,
    network: input.network,
    amount,
    recipient,
    sessionId,
    startTimestampSeconds,
    payUrl,
  };
}

export function createUniFiReceiptUrl(
  receiptId: string,
  checkoutBaseUrl = UNIFI_CHECKOUT_BASE_URL,
): string {
  const normalized = receiptId.trim();
  if (!normalized) {
    throw new UniFiPayError("receiptId is required.", {
      code: "INVALID_RECEIPT_ID",
    });
  }

  return new URL(
    `/app/payment/receipt/${encodeURIComponent(normalized)}`,
    checkoutBaseUrl,
  ).toString();
}
