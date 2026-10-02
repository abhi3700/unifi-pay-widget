import { useId } from "react";
import { UNIFI_RECEIPT_REFRESH_INTERVAL_MS } from "../constants";
import {
  canRefreshUniFiReceiptStatus,
  getUniFiReceiptStatusLabel,
} from "../core/receipt";
import {
  useUniFiReceiptStatus,
  type UseUniFiReceiptStatusOptions,
} from "./useUniFiReceiptStatus";

export type UniFiReceiptStatusCardProps = UseUniFiReceiptStatusOptions & {
  className?: string;
  errorHelpText?: string;
};

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatRefreshCadence(refreshIntervalMs: number): string {
  const minutes = refreshIntervalMs / 60_000;
  if (Number.isInteger(minutes) && minutes >= 1) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  const seconds = Math.max(1, Math.round(refreshIntervalMs / 1000));
  return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
}

export function UniFiReceiptStatusCard({
  className = "",
  errorHelpText = "Finality has not been confirmed yet.",
  refreshIntervalMs = UNIFI_RECEIPT_REFRESH_INTERVAL_MS,
  ...options
}: UniFiReceiptStatusCardProps) {
  const tracker = useUniFiReceiptStatus({
    ...options,
    refreshIntervalMs,
  });
  const gradientId = useId().replace(/:/g, "");
  const refreshRingRadius = 21;
  const refreshRingCircumference = 2 * Math.PI * refreshRingRadius;
  const refreshIntervalSeconds = Math.max(
    1,
    Math.ceil(refreshIntervalMs / 1000),
  );
  const refreshProgress = tracker.autoRefreshActive
    ? Math.min(
        1,
        Math.max(
          0,
          tracker.autoRefreshSecondsLeft / refreshIntervalSeconds,
        ),
      )
    : 0;
  const refreshRingOffset = refreshRingCircumference * (1 - refreshProgress);
  const statusLabel = tracker.checking
    ? "Refreshing payment status…"
    : getUniFiReceiptStatusLabel(tracker.status);
  const refreshAllowed = canRefreshUniFiReceiptStatus(tracker.status);
  const terminal = !refreshAllowed;
  const finalized = tracker.status === "Finalized";
  const title = tracker.autoRefreshActive
    ? `Refresh now · next automatic check in ${formatCountdown(tracker.autoRefreshSecondsLeft)}`
    : "Refresh payment finality now";

  if (!options.receiptId) return null;

  return (
    <div
      className={`unifi-widget__receipt-status-card ${className}`.trim()}
    >
      {terminal ? (
        <span
          className={`unifi-widget__receipt-terminal ${finalized ? "is-finalized" : "is-unsuccessful"}`}
          aria-hidden="true"
        >
          {finalized ? "✓" : "!"}
        </span>
      ) : (
        <button
          type="button"
          className="unifi-widget__receipt-refresh"
          onClick={() => void tracker.refresh()}
          disabled={tracker.checking}
          aria-label="Refresh payment finality now"
          title={title}
        >
          <span
            className="unifi-widget__receipt-refresh-surface"
            aria-hidden="true"
          />
          <span
            className={`unifi-widget__receipt-refresh-icon ${tracker.checking ? "is-checking" : ""}`}
            aria-hidden="true"
          >
            ↻
          </span>
          <svg
            className="unifi-widget__receipt-refresh-ring"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0"
                y1="0"
                x2="48"
                y2="48"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#2563eb" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <circle
              cx="24"
              cy="24"
              r={refreshRingRadius}
              fill="none"
              stroke="#bfdbfe"
              strokeWidth="3"
            />
            {tracker.autoRefreshActive ? (
              <circle
                cx="24"
                cy="24"
                r={refreshRingRadius}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={refreshRingCircumference}
                strokeDashoffset={refreshRingOffset}
                className="unifi-widget__receipt-refresh-progress"
              />
            ) : null}
          </svg>
        </button>
      )}
      <div className="unifi-widget__receipt-status-copy">
        <strong role="status" aria-live="polite">
          {statusLabel}
        </strong>
        <p>
          {terminal
            ? finalized
              ? "This payment has reached on-chain finality. No further status checks are needed."
              : "This payment reached a terminal status. No further status checks are scheduled."
            : `Status checks run automatically every ${formatRefreshCadence(refreshIntervalMs)}. Use the refresh button for an immediate check.`}
        </p>
        {tracker.autoRefreshActive ? (
          <span className="unifi-widget__receipt-next-check" aria-hidden="true">
            Next automatic check in {formatCountdown(tracker.autoRefreshSecondsLeft)}
          </span>
        ) : null}
        {tracker.checkedAt ? (
          <span className="unifi-widget__receipt-checked-at">
            Last checked at{" "}
            {tracker.checkedAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ) : null}
        {tracker.error ? (
          <span className="unifi-widget__receipt-status-error" role="alert">
            {tracker.error} {errorHelpText}
          </span>
        ) : null}
      </div>
    </div>
  );
}
