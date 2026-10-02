import { useEffect, useRef, useState } from "react";
import { unifiIcon } from "./assets";

export type UniFiPaymentStatusSheetProps = {
  open: boolean;
  secondsLeft: number;
  statusText: string;
  payUrl?: string | null;
  checking?: boolean;
  onCheckStatus: () => void | Promise<unknown>;
  onClose: () => void;
};

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function previewUrl(value: string): string {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const session = parts.at(-2) ?? parts.at(-1) ?? "";
    return `${url.host} · UniFi Pay · ${session.slice(0, 8)}…`;
  } catch {
    return value.length > 30 ? `${value.slice(0, 27)}…` : value;
  }
}

export function UniFiPaymentStatusSheet({
  open,
  secondsLeft,
  statusText,
  payUrl,
  checking,
  onCheckStatus,
  onClose,
}: UniFiPaymentStatusSheetProps) {
  const [copied, setCopied] = useState(false);
  const [internalChecking, setInternalChecking] = useState(false);
  const isChecking = checking ?? internalChecking;
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  async function copy() {
    if (!payUrl) return;
    try {
      await navigator.clipboard.writeText(payUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      window.prompt("Copy the UniFi payment link", payUrl);
    }
  }

  async function checkStatus() {
    if (isChecking) return;
    if (checking === undefined) setInternalChecking(true);
    try {
      await onCheckStatus();
    } finally {
      if (checking === undefined) setInternalChecking(false);
    }
  }

  return (
    <div className="unifi-widget__sheet-layer">
      <button
        type="button"
        className="unifi-widget__backdrop"
        aria-label="Close payment status"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="unifi-widget-status-title"
        className="unifi-widget__sheet unifi-widget__status-sheet"
      >
        <div className="unifi-widget__status-header">
          <div className="unifi-widget__handle is-brand" aria-hidden="true" />
          <div className="unifi-widget__status-brand-row">
            <div className="unifi-widget__status-brand">
              <img src={unifiIcon} alt="" />
              <div>
                <strong>UniFi Pay</strong>
                <span>Stablecoin checkout</span>
              </div>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="unifi-widget__close"
              aria-label="Close payment status"
              onClick={onClose}
            >
              <span aria-hidden="true">×</span> Close
            </button>
          </div>
          <div className="unifi-widget__status-title-row">
            <div>
              <h2 id="unifi-widget-status-title">Complete your payment</h2>
              <p>Waiting for confirmation from UniFi</p>
            </div>
            <span className="unifi-widget__timer">◷ {formatTime(secondsLeft)}</span>
          </div>
        </div>

        <div className="unifi-widget__status-card">
          <span className="unifi-widget__status-icon" aria-hidden="true">⌛</span>
          <div>
            <strong>{statusText}</strong>
            <p>Keep the UniFi payment tab open, then return here to check the status.</p>
          </div>
        </div>

        {payUrl ? (
          <div className="unifi-widget__link-card">
            <div className="unifi-widget__link-actions">
              <strong>↗ Pay link</strong>
              <span>
                <a href={payUrl} target="_blank" rel="noreferrer">Open ↗</a>
                <button type="button" onClick={() => void copy()}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </span>
            </div>
            <div className="unifi-widget__url-preview">
              <span>{previewUrl(payUrl)}</span>
              <small>(hidden)</small>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="unifi-widget__primary"
          disabled={isChecking}
          onClick={() => void checkStatus()}
        >
          {isChecking ? "Checking…" : "Check payment status"}
        </button>
      </section>
    </div>
  );
}
