import assert from "node:assert/strict";
import test from "node:test";
import {
  UniFiClient,
  createUniFiPayment,
  createUniFiReceiptUrl,
  createUniFiSessionId,
  getUniFiPaymentRemainingSeconds,
  isUniFiSessionId,
  UNIFI_PAYMENT_EXPIRY_SECONDS,
} from "../dist/index.js";

test("creates unique 64-character hexadecimal session IDs", () => {
  const first = createUniFiSessionId();
  const second = createUniFiSessionId();
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.notEqual(first, second);
  assert.equal(isUniFiSessionId(first), true);
});

test("builds the canonical payment URL", () => {
  const sessionId = "a".repeat(64);
  const payment = createUniFiPayment({
    asset: "USDC",
    network: "Polygon",
    amount: "12.30",
    recipient: "0xabc",
    sessionId,
    startTimestampSeconds: 1_700_000_000,
    checkoutBaseUrl: "https://checkout.example",
  });

  assert.equal(payment.amount, "12.30");
  assert.equal(
    payment.payUrl,
    `https://checkout.example/app/fliqpay/Polygon/USDC/0xabc/12.30/${sessionId}/1700000000`,
  );
});

test("derives the countdown from the payment session timestamp", () => {
  const start = 1_700_000_000;
  const expiry = UNIFI_PAYMENT_EXPIRY_SECONDS;

  assert.equal(expiry, 15 * 60);
  assert.equal(
    getUniFiPaymentRemainingSeconds(start, start * 1000),
    expiry,
  );
  assert.equal(
    getUniFiPaymentRemainingSeconds(
      start,
      (start + expiry) * 1000 - 1,
    ),
    1,
  );
  assert.equal(
    getUniFiPaymentRemainingSeconds(start, (start + expiry) * 1000),
    0,
  );
  assert.equal(
    getUniFiPaymentRemainingSeconds(start, (start - 1) * 1000),
    expiry,
  );
  assert.equal(
    getUniFiPaymentRemainingSeconds(start, start * 1000, expiry * 2),
    expiry,
  );
});

test("rejects invalid payment inputs", () => {
  assert.throws(
    () =>
      createUniFiPayment({
        asset: "USDT",
        network: "Ethereum",
        amount: "0",
        recipient: "0xabc",
      }),
    /positive decimal/,
  );
  assert.throws(
    () =>
      createUniFiPayment({
        asset: "USDT",
        network: "Ethereum",
        amount: "1",
        recipient: "0xabc",
        sessionId: "bad",
      }),
    /64-character hexadecimal/,
  );
  assert.throws(
    () =>
      createUniFiPayment({
        asset: "USDT",
        network: "Ethereum",
        amount: "1",
        recipient: "0xabc",
        startTimestampSeconds: -1,
      }),
    /non-negative integer/,
  );
});

test("builds the canonical receipt URL", () => {
  assert.equal(
    createUniFiReceiptUrl("receipt/one", "https://checkout.example"),
    "https://checkout.example/app/payment/receipt/receipt%2Fone",
  );
});

test("maps empty and populated API data to pending and paid", async () => {
  const sessionId = "b".repeat(64);
  const responses = [
    new Response(JSON.stringify({ data: "" }), {
      headers: { "content-type": "application/json" },
    }),
    new Response(JSON.stringify({ data: "receipt-7" }), {
      headers: { "content-type": "application/json" },
    }),
  ];
  const client = new UniFiClient({
    proxyBaseUrl: "/api/unifi",
    fetch: async () => responses.shift(),
  });

  assert.deepEqual(await client.checkPaymentStatus(sessionId), {
    state: "pending",
  });
  assert.deepEqual(await client.checkPaymentStatus(sessionId), {
    state: "paid",
    receiptId: "receipt-7",
  });
});

test("binds the platform fetch implementation to globalThis", async () => {
  const originalFetch = globalThis.fetch;
  const sessionId = "e".repeat(64);

  globalThis.fetch = function () {
    assert.equal(this, globalThis);
    return Promise.resolve(
      new Response(JSON.stringify({ data: "" }), {
        headers: { "content-type": "application/json" },
      }),
    );
  };

  try {
    const client = new UniFiClient({ proxyBaseUrl: "/api" });
    assert.deepEqual(await client.checkPaymentStatus(sessionId), {
      state: "pending",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("returns a useful failed state for API errors", async () => {
  const client = new UniFiClient({
    fetch: async () =>
      new Response(JSON.stringify({ message: "Invalid API key" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
  });

  assert.deepEqual(await client.checkPaymentStatus("c".repeat(64)), {
    state: "failed",
    message: "Invalid API key",
  });
});
