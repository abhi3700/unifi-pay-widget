import { useEffect, useMemo, useState } from "react";
import { UNIFI_PAYMENT_EXPIRY_SECONDS } from "../constants";
import { UniFiClient } from "../core/client";
import { createUniFiPayment } from "../core/urls";
import type {
  UniFiPaymentSelection,
  UniFiPaymentSession,
  UniFiPaymentStatus,
} from "../types";
import { UniFiPaymentOption } from "./UniFiPaymentOption";
import { UniFiPaymentStatusSheet } from "./UniFiPaymentStatusSheet";

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
  const [session, setSession] = useState<UniFiPaymentSession | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusText, setStatusText] = useState("Waiting for payment…");
  const [checking, setChecking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(expirySeconds);
  const client = useMemo(() => new UniFiClient({ proxyBaseUrl }), [proxyBaseUrl]);

  useEffect(() => {
    if (!statusOpen) return;
    const expiresAt = Date.now() + expirySeconds * 1000;
    const timer = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(next);
      if (next === 0) {
        window.clearInterval(timer);
        setStatusText("Payment session expired.");
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [expirySeconds, statusOpen]);

  function updateSelection(next: UniFiPaymentSelection) {
    if (value === undefined) setInternalSelection(next);
    onChange?.(next);
  }

  function beginPayment() {
    try {
      const next = createUniFiPayment({
        ...selection,
        amount,
        recipient,
        checkoutBaseUrl,
      });
      setSession(next);
      setSecondsLeft(expirySeconds);
      setStatusText("Waiting for payment…");
      setStatusOpen(true);
      onSession?.(next);
      if (openInNewTab) window.open(next.payUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Unable to start payment."));
    }
  }

  async function checkStatus() {
    if (!session || checking) return;
    setChecking(true);
    setStatusText("Checking payment status…");
    try {
      const status = await client.checkPaymentStatus(session.sessionId);
      onStatus?.(status);
      if (status.state === "paid") {
        setStatusText("Payment confirmed.");
        onPaid?.(status.receiptId, session);
      } else if (status.state === "failed") {
        setStatusText(status.message);
      } else {
        setStatusText("Payment is still pending.");
      }
    } catch (error) {
      const normalized =
        error instanceof Error
          ? error
          : new Error("Unable to check payment status.");
      setStatusText(normalized.message);
      onError?.(normalized);
    } finally {
      setChecking(false);
    }
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
        open={statusOpen}
        secondsLeft={secondsLeft}
        statusText={statusText}
        payUrl={session?.payUrl}
        checking={checking}
        onCheckStatus={checkStatus}
        onClose={() => setStatusOpen(false)}
      />
    </div>
  );
}
