import type { UniFiReceiptStatus } from "../types";
import { UniFiPayError } from "./errors";

const RECEIPT_STATUSES: readonly UniFiReceiptStatus[] = [
  "Processing",
  "Failed",
  "Confirmed",
  "Finalized",
  "Reorged",
];

export function isUniFiReceiptId(value: string): boolean {
  return (
    value.length >= 26 &&
    value.length <= 128 &&
    value.includes("r") &&
    /^[0-9a-fA-Fr]+$/.test(value)
  );
}

export function assertUniFiReceiptId(value: string): void {
  if (!isUniFiReceiptId(value)) {
    throw new UniFiPayError("Receipt ID is not a valid UniFi receipt ID.", {
      code: "INVALID_RECEIPT_ID",
    });
  }
}

export function isUniFiReceiptStatus(
  value: unknown,
): value is UniFiReceiptStatus {
  return RECEIPT_STATUSES.includes(value as UniFiReceiptStatus);
}
