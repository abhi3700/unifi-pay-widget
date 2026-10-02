import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UNIFI_PAYMENT_EXPIRY_SECONDS } from "../constants";
import { UniFiClient } from "../core/client";
import { getUniFiPaymentRemainingSeconds } from "../core/session";
import { createUniFiPayment } from "../core/urls";
import type {
  CreateUniFiPaymentInput,
  UniFiPaymentSession,
  UniFiPaymentStatus,
} from "../types";

const WAITING_STATUS_TEXT = "Waiting for payment…";

export type UseUniFiPaymentOptions = {
  proxyBaseUrl?: string;
  checkoutBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
  expirySeconds?: number;
  openInNewTab?: boolean;
  closeOnReceipt?: boolean;
  closeOnExpire?: boolean;
  onSession?: (session: UniFiPaymentSession) => void;
  onStatus?: (status: UniFiPaymentStatus) => void;
  onReceiptDetected?: (
    receiptId: string,
    session: UniFiPaymentSession,
  ) => void;
  onExpired?: (session: UniFiPaymentSession) => void;
  onError?: (error: Error) => void;
};

export type UniFiPaymentController = {
  session: UniFiPaymentSession | null;
  statusOpen: boolean;
  statusText: string;
  checking: boolean;
  secondsLeft: number;
  startPayment: (
    input: CreateUniFiPaymentInput,
  ) => UniFiPaymentSession | null;
  checkStatus: () => Promise<UniFiPaymentStatus | null>;
  closeStatus: () => void;
  reset: () => void;
};

export function useUniFiPayment(
  options: UseUniFiPaymentOptions = {},
): UniFiPaymentController {
  const {
    proxyBaseUrl,
    checkoutBaseUrl,
    fetch,
    expirySeconds = UNIFI_PAYMENT_EXPIRY_SECONDS,
    openInNewTab = true,
    closeOnReceipt = false,
    closeOnExpire = false,
  } = options;
  const callbacksRef = useRef(options);
  callbacksRef.current = options;
  const requestSequenceRef = useRef(0);
  const checkingRef = useRef(false);
  const [session, setSession] = useState<UniFiPaymentSession | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusText, setStatusText] = useState(WAITING_STATUS_TEXT);
  const [checking, setChecking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(expirySeconds);
  const client = useMemo(
    () => new UniFiClient({ proxyBaseUrl, fetch }),
    [fetch, proxyBaseUrl],
  );

  useEffect(() => {
    if (!statusOpen || !session) return;

    const syncRemaining = () => {
      const next = getUniFiPaymentRemainingSeconds(
        session.startTimestampSeconds,
        Date.now(),
        expirySeconds,
      );
      setSecondsLeft(next);
      if (next === 0) {
        setStatusText("Payment session expired.");
        if (closeOnExpire) setStatusOpen(false);
        callbacksRef.current.onExpired?.(session);
      }
      return next;
    };

    if (syncRemaining() === 0) return;

    const timer = window.setInterval(() => {
      if (syncRemaining() === 0) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [closeOnExpire, expirySeconds, session, statusOpen]);

  const startPayment = useCallback(
    (input: CreateUniFiPaymentInput): UniFiPaymentSession | null => {
      try {
        const next = createUniFiPayment({
          ...input,
          checkoutBaseUrl: input.checkoutBaseUrl ?? checkoutBaseUrl,
        });
        requestSequenceRef.current += 1;
        checkingRef.current = false;
        setChecking(false);
        setSession(next);
        setSecondsLeft(
          getUniFiPaymentRemainingSeconds(
            next.startTimestampSeconds,
            Date.now(),
            expirySeconds,
          ),
        );
        setStatusText(WAITING_STATUS_TEXT);
        setStatusOpen(true);
        callbacksRef.current.onSession?.(next);
        if (openInNewTab) {
          window.open(next.payUrl, "_blank", "noopener,noreferrer");
        }
        return next;
      } catch (error) {
        const normalized =
          error instanceof Error
            ? error
            : new Error("Unable to start payment.");
        callbacksRef.current.onError?.(normalized);
        return null;
      }
    },
    [checkoutBaseUrl, expirySeconds, openInNewTab],
  );

  const checkStatus = useCallback(async (): Promise<UniFiPaymentStatus | null> => {
    if (!session || checkingRef.current) return null;

    checkingRef.current = true;
    setChecking(true);
    setStatusText("Checking payment status…");
    const requestSequence = ++requestSequenceRef.current;

    try {
      const status = await client.checkPaymentStatus(session.sessionId);
      if (requestSequence !== requestSequenceRef.current) return status;

      callbacksRef.current.onStatus?.(status);
      if (status.state === "paid") {
        setStatusText("Payment submitted. Checking finality…");
        if (closeOnReceipt) setStatusOpen(false);
        callbacksRef.current.onReceiptDetected?.(status.receiptId, session);
      } else if (status.state === "failed") {
        setStatusText(status.message);
      } else {
        setStatusText("Payment is still pending.");
      }
      return status;
    } catch (error) {
      if (requestSequence !== requestSequenceRef.current) return null;
      const normalized =
        error instanceof Error
          ? error
          : new Error("Unable to check payment status.");
      setStatusText(normalized.message);
      callbacksRef.current.onError?.(normalized);
      return { state: "failed", message: normalized.message };
    } finally {
      if (requestSequence === requestSequenceRef.current) {
        checkingRef.current = false;
        setChecking(false);
      }
    }
  }, [client, closeOnReceipt, session]);

  const closeStatus = useCallback(() => setStatusOpen(false), []);

  const reset = useCallback(() => {
    requestSequenceRef.current += 1;
    checkingRef.current = false;
    setChecking(false);
    setSession(null);
    setStatusOpen(false);
    setStatusText(WAITING_STATUS_TEXT);
    setSecondsLeft(expirySeconds);
  }, [expirySeconds]);

  return {
    session,
    statusOpen,
    statusText,
    checking,
    secondsLeft,
    startPayment,
    checkStatus,
    closeStatus,
    reset,
  };
}
