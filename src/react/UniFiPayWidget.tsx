import { useState } from "react";
import { UNIFI_PAYMENT_EXPIRY_SECONDS } from "../constants";
import type {
  UniFiPaymentSelection,
  UniFiPaymentSession,
  UniFiPaymentStatus,
} from "../types";
import { UniFiPaymentOption } from "./UniFiPaymentOption";
import { UniFiPaymentStatusSheet } from "./UniFiPaymentStatusSheet";
import { useUniFiPayment } from "./useUniFiPayment";

export type UniFiPayWidgetProps = {
  amount: string | number;
  recipient: string;
  proxyBaseUrl?: string;
  checkoutBaseUrl?: string;
  value?: UniFiPaymentSelection;
  defaultValue?: UniFiPaymentSelection;
  onChange?: (selection: UniFiPaymentSelection) => void;
  onSession?: (session: UniFiPaymentSession) => void;
  onStatus?: (status: UniFiPaymentStatus) => void;
  onPaid?: (receiptId: string, session: UniFiPaymentSession) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  openInNewTab?: boolean;
  expirySeconds?: number;
  buttonLabel?: string;
  className?: string;
};

const DEFAULT_SELECTION: UniFiPaymentSelection = {
  asset: "USDT",
  network: "Ethereum",
};

export function UniFiPayWidget({
  amount,
  recipient,
  proxyBaseUrl,
  checkoutBaseUrl,
  value,
  defaultValue = DEFAULT_SELECTION,
  onChange,
  onSession,
  onStatus,
  onPaid,
  onError,
  disabled = false,
  openInNewTab = true,
  expirySeconds = UNIFI_PAYMENT_EXPIRY_SECONDS,
  buttonLabel = "Pay with UniFi",
  className = "",
}: UniFiPayWidgetProps) {
  const [internalSelection, setInternalSelection] = useState(defaultValue);
  const selection = value ?? internalSelection;
  const payment = useUniFiPayment({
    proxyBaseUrl,
    checkoutBaseUrl,
    expirySeconds,
    openInNewTab,
    onSession,
    onStatus,
    onReceiptDetected: onPaid,
    onError,
  });

  function updateSelection(next: UniFiPaymentSelection) {
    if (value === undefined) setInternalSelection(next);
    onChange?.(next);
  }

  function beginPayment() {
    payment.startPayment({
      ...selection,
      amount,
      recipient,
    });
  }

  return (
    <div className={`unifi-widget ${className}`.trim()}>
      <UniFiPaymentOption
        value={selection}
        onChange={updateSelection}
        disabled={disabled}
      />
      <button
        type="button"
        className="unifi-widget__pay"
        disabled={disabled}
        onClick={beginPayment}
      >
        {buttonLabel}
      </button>
      <UniFiPaymentStatusSheet
        open={payment.statusOpen}
        secondsLeft={payment.secondsLeft}
        statusText={payment.statusText}
        payUrl={payment.session?.payUrl}
        checking={payment.checking}
        onCheckStatus={payment.checkStatus}
        onClose={payment.closeStatus}
      />
    </div>
  );
}
