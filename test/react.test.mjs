import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  UniFiPaymentPair,
  UniFiPaymentStatusSheet,
  UniFiReceiptStatusCard,
} from "../dist/react.js";

test("renders the canonical asset and network pair", () => {
  const html = renderToStaticMarkup(
    createElement(UniFiPaymentPair, {
      selection: { asset: "USDT", network: "Sepolia" },
    }),
  );

  assert.match(html, /unifi-widget__payment-pair/);
  assert.match(html, /unifi-widget__payment-pair-icons/);
  assert.match(html, /unifi-widget__payment-pair-copy/);
  assert.match(html, /USDT/);
  assert.match(html, /Sepolia/);
  assert.match(html, /data:image\/svg\+xml/);
});

test("renders the reusable receipt-finality card", () => {
  const html = renderToStaticMarkup(
    createElement(UniFiReceiptStatusCard, {
      receiptId: `1r${"a".repeat(24)}`,
    }),
  );

  assert.match(html, /unifi-widget__receipt-status-card/);
  assert.match(html, /Checking payment finality/);
  assert.match(html, /Refresh payment finality now/);
  assert.match(html, /automatically every 15 minutes/);
});

test("keeps the payment-status sheet manual when polling is not configured", () => {
  const html = renderToStaticMarkup(
    createElement(UniFiPaymentStatusSheet, {
      open: true,
      secondsLeft: 897,
      statusText: "Waiting for payment…",
      onCheckStatus() {},
      onClose() {},
    }),
  );

  assert.match(html, />Check payment status</);
  assert.doesNotMatch(html, /Next check in/);
  assert.doesNotMatch(html, /unifi-widget__status-auto-refresh/);
});

test("renders compact automatic payment-status controls when polling is configured", () => {
  const html = renderToStaticMarkup(
    createElement(UniFiPaymentStatusSheet, {
      open: true,
      secondsLeft: 897,
      statusText: "Waiting for payment…",
      statusPollIntervalMs: 30_000,
      autoCheckSecondsLeft: 24,
      autoCheckActive: true,
      lastCheckedAt: new Date("2026-10-04T01:34:00Z"),
      onCheckStatus() {},
      onClose() {},
    }),
  );

  assert.match(html, /unifi-widget__status-auto-refresh/);
  assert.match(html, /unifi-widget__status-auto-refresh-progress/);
  assert.match(html, /stroke-dashoffset=/);
  assert.match(html, /Status checks run automatically every 30 seconds/);
  assert.match(html, /Next check in 0:24/);
  assert.match(html, /Last checked at/);
  assert.match(html, /aria-label="Check payment status now"/);
  assert.doesNotMatch(html, />Check payment status</);
});

test("reduces the automatic payment-status ring with the countdown", () => {
  function renderAt(secondsLeft) {
    return renderToStaticMarkup(
      createElement(UniFiPaymentStatusSheet, {
        open: true,
        secondsLeft: 897,
        statusText: "Waiting for payment…",
        statusPollIntervalMs: 30_000,
        autoCheckSecondsLeft: secondsLeft,
        autoCheckActive: true,
        onCheckStatus() {},
        onClose() {},
      }),
    );
  }

  function readOffset(html) {
    const match = html.match(/stroke-dashoffset="([^"]+)"/);
    assert.ok(match, "expected the progress ring to expose a dash offset");
    return Number(match[1]);
  }

  const offsetAt24Seconds = readOffset(renderAt(24));
  const offsetAt12Seconds = readOffset(renderAt(12));

  assert.ok(offsetAt12Seconds > offsetAt24Seconds);
});
