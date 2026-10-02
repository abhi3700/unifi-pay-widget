import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UNIFI_RECEIPT_REFRESH_INTERVAL_MS } from "../constants";
import { UniFiClient } from "../core/client";
import { isUniFiReceiptStatusTerminal } from "../core/receipt";
import type {
  UniFiPaymentReceipt,
  UniFiReceiptStatus,
} from "../types";

export type UseUniFiReceiptStatusOptions = {
  receiptId: string | null;
  proxyBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
  enabled?: boolean;
  refreshIntervalMs?: number;
  onStatusChange?: (
    status: UniFiReceiptStatus,
    receipt: UniFiPaymentReceipt,
  ) => void;
  onError?: (message: string) => void;
};

export type UniFiReceiptStatusTracker = {
  receipt: UniFiPaymentReceipt | null;
  status: UniFiReceiptStatus | null;
  checking: boolean;
  error: string | null;
  checkedAt: Date | null;
  autoRefreshSecondsLeft: number;
  autoRefreshActive: boolean;
  refresh: () => Promise<void>;
};

export function useUniFiReceiptStatus({
  receiptId,
  proxyBaseUrl,
  fetch,
  enabled = true,
  refreshIntervalMs = UNIFI_RECEIPT_REFRESH_INTERVAL_MS,
  onStatusChange,
  onError,
}: UseUniFiReceiptStatusOptions): UniFiReceiptStatusTracker {
  const callbacksRef = useRef({ onStatusChange, onError });
  callbacksRef.current = { onStatusChange, onError };
  const scopeRef = useRef(0);
  const activeRequestRef = useRef<{
    receiptId: string;
    token: object;
  } | null>(null);
  const [receipt, setReceipt] = useState<UniFiPaymentReceipt | null>(null);
  const [status, setStatus] = useState<UniFiReceiptStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [autoRefreshSecondsLeft, setAutoRefreshSecondsLeft] = useState(0);
  const client = useMemo(
    () => new UniFiClient({ proxyBaseUrl, fetch }),
    [fetch, proxyBaseUrl],
  );

  const runCheck = useCallback(
    async (targetReceiptId: string, scope: number): Promise<void> => {
      if (activeRequestRef.current?.receiptId === targetReceiptId) return;

      const token = {};
      activeRequestRef.current = { receiptId: targetReceiptId, token };
      setChecking(true);
      setError(null);

      try {
        const result = await client.checkReceiptStatus(targetReceiptId);
        if (scope !== scopeRef.current) return;

        if (result.state === "received") {
          setReceipt(result.receipt);
          setStatus(result.receipt.status);
          callbacksRef.current.onStatusChange?.(
            result.receipt.status,
            result.receipt,
          );
        } else {
          setError(result.message);
          callbacksRef.current.onError?.(result.message);
        }
      } catch (caught) {
        if (scope !== scopeRef.current) return;
        const message =
          caught instanceof Error
            ? caught.message
            : "Unable to refresh payment status.";
        setError(message);
        callbacksRef.current.onError?.(message);
      } finally {
        if (scope === scopeRef.current) {
          setCheckedAt(new Date());
          setChecking(false);
        }
        if (activeRequestRef.current?.token === token) {
          activeRequestRef.current = null;
        }
      }
    },
    [client],
  );

  const refresh = useCallback(async (): Promise<void> => {
    if (!enabled || !receiptId) return;
    await runCheck(receiptId, scopeRef.current);
  }, [enabled, receiptId, runCheck]);

  useEffect(() => {
    scopeRef.current += 1;
    const scope = scopeRef.current;
    activeRequestRef.current = null;
    setReceipt(null);
    setStatus(null);
    setError(null);
    setCheckedAt(null);
    setChecking(false);
    setAutoRefreshSecondsLeft(0);

    if (enabled && receiptId) void runCheck(receiptId, scope);

    return () => {
      if (scopeRef.current === scope) scopeRef.current += 1;
    };
  }, [enabled, receiptId, runCheck]);

  const autoRefreshActive =
    enabled &&
    Boolean(receiptId) &&
    checkedAt !== null &&
    !isUniFiReceiptStatusTerminal(status);

  useEffect(() => {
    if (!autoRefreshActive || !checkedAt) return;
    const delay = Math.max(
      0,
      checkedAt.getTime() + refreshIntervalMs - Date.now(),
    );
    const timeout = window.setTimeout(() => void refresh(), delay);
    return () => window.clearTimeout(timeout);
  }, [autoRefreshActive, checkedAt, refresh, refreshIntervalMs]);

  useEffect(() => {
    if (!autoRefreshActive || !checkedAt) {
      setAutoRefreshSecondsLeft(0);
      return;
    }

    const refreshDeadline = checkedAt.getTime() + refreshIntervalMs;
    const syncCountdown = () => {
      setAutoRefreshSecondsLeft(
        Math.max(0, Math.ceil((refreshDeadline - Date.now()) / 1000)),
      );
    };

    syncCountdown();
    const countdown = window.setInterval(syncCountdown, 1000);
    return () => window.clearInterval(countdown);
  }, [autoRefreshActive, checkedAt, refreshIntervalMs]);

  return {
    receipt,
    status,
    checking,
    error,
    checkedAt,
    autoRefreshSecondsLeft,
    autoRefreshActive,
    refresh,
  };
}
