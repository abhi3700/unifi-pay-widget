import { useEffect, useId, useRef, useState } from "react";
import { refreshIcon, unifiIcon } from "./assets";

export type UniFiPaymentStatusSheetProps = {
  open: boolean;
  secondsLeft: number;
  statusText: string;
  payUrl?: string | null;
  checking?: boolean;
  statusPollIntervalMs?: number | null;
  autoCheckSecondsLeft?: number;
  autoCheckActive?: boolean;
  lastCheckedAt?: Date | null;
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

function formatCadence(intervalMs: number): string {
  const seconds = Math.max(1, Math.round(intervalMs / 1000));
  if (seconds < 60) return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  const minutes = seconds / 60;
  if (Number.isInteger(minutes)) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  return `${seconds} seconds`;
}

export function UniFiPaymentStatusSheet({
  open,
  secondsLeft,
  statusText,
  payUrl,
  checking,
  statusPollIntervalMs,
  autoCheckSecondsLeft = 0,
  autoCheckActive = false,
  lastCheckedAt,
  onCheckStatus,
  onClose,
}: UniFiPaymentStatusSheetProps) {
  const [copied, setCopied] = useState(false);
  const [internalChecking, setInternalChecking] = useState(false);
  const isChecking = checking ?? internalChecking;
  const automaticChecksEnabled =
    autoCheckActive &&
    typeof statusPollIntervalMs === "number" &&
    Number.isFinite(statusPollIntervalMs) &&
    statusPollIntervalMs > 0;
  const refreshRingGradientId = useId().replace(/:/g, "");
  const refreshRingRadius = 19;
  const refreshRingCircumference = 2 * Math.PI * refreshRingRadius;
  const pollIntervalSeconds = Math.max(
    1,
    Math.ceil((statusPollIntervalMs ?? 1000) / 1000),
  );
  const refreshProgress = automaticChecksEnabled
    ? Math.min(1, Math.max(0, autoCheckSecondsLeft / pollIntervalSeconds))
    : 0;
  const refreshRingOffset = refreshRingCircumference * (1 - refreshProgress);
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

        <div
          className={`unifi-widget__status-card ${automaticChecksEnabled ? "is-auto" : ""}`.trim()}
        >
          {automaticChecksEnabled ? (
            <button
              type="button"
              className="unifi-widget__status-auto-refresh"
              disabled={isChecking}
              onClick={() => void checkStatus()}
              aria-label="Check payment status now"
              title="Check payment status now"
            >
              <span
                className="unifi-widget__status-auto-refresh-surface"
                aria-hidden="true"
              />
              <img
                src={refreshIcon}
                className={isChecking ? "is-checking" : ""}
                alt=""
                aria-hidden="true"
              />
              <svg
                className="unifi-widget__status-auto-refresh-ring"
                viewBox="0 0 44 44"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id={refreshRingGradientId}
                    x1="0"
                    y1="0"
                    x2="44"
                    y2="44"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#2563eb" />
                    <stop offset="1" stopColor="#6d28d9" />
                  </linearGradient>
                </defs>
                <circle
                  cx="22"
                  cy="22"
                  r={refreshRingRadius}
                  fill="none"
                  stroke="#c7d2fe"
                  strokeWidth="3"
                />
                <circle
                  cx="22"
                  cy="22"
                  r={refreshRingRadius}
                  fill="none"
                  stroke={`url(#${refreshRingGradientId})`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={refreshRingCircumference}
                  strokeDashoffset={refreshRingOffset}
                  className="unifi-widget__status-auto-refresh-progress"
                />
              </svg>
            </button>
          ) : (
            <span className="unifi-widget__status-icon" aria-hidden="true">⌛</span>
          )}
          <div className="unifi-widget__status-card-copy">
            <strong role="status" aria-live="polite">{statusText}</strong>
            {automaticChecksEnabled ? (
              <>
                <p>
                  Status checks run automatically every {formatCadence(statusPollIntervalMs)}.
                  Use refresh for an immediate check.
                </p>
                <div className="unifi-widget__status-auto-meta">
                  <span className="unifi-widget__status-next-check">
                    Next check in {formatTime(autoCheckSecondsLeft)}
                  </span>
                  {lastCheckedAt ? (
                    <span className="unifi-widget__status-last-check">
                      Last checked at{" "}
                      {lastCheckedAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : null}
                </div>
              </>
            ) : (
              <p>Keep the UniFi payment tab open, then return here to check the status.</p>
            )}
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

        {!automaticChecksEnabled ? (
          <button
            type="button"
            className="unifi-widget__primary"
            disabled={isChecking}
            onClick={() => void checkStatus()}
          >
            {isChecking ? "Checking…" : "Check payment status"}
          </button>
        ) : null}
      </section>
    </div>
  );
}
