import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UniFiReceiptStatusCard } from "../dist/react.js";

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
