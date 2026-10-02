import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UniFiPaymentPair, UniFiReceiptStatusCard } from "../dist/react.js";

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
