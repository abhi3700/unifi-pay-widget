import type { ReactNode } from "react";
import { createUniFiReceiptUrl } from "../core/urls";

export type UniFiReceiptLinkProps = {
  receiptId: string;
  checkoutBaseUrl?: string;
  children?: ReactNode;
  className?: string;
};

export function UniFiReceiptLink({
  receiptId,
  checkoutBaseUrl,
  children = "View UniFi receipt",
  className = "",
}: UniFiReceiptLinkProps) {
  const receiptUrl = createUniFiReceiptUrl(receiptId, checkoutBaseUrl);

  return (
    <a
      className={`unifi-widget__receipt-link ${className}`.trim()}
      href={receiptUrl}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
