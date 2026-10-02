import assert from "node:assert/strict";
import test from "node:test";
import { UNIFI_API_BASE_URL } from "../dist/index.js";
import { handleUniFiProxyRequest } from "../dist/server.js";

const sessionId = "d".repeat(64);
const requestUrl = `https://merchant.example/api/unifi/payment/merchant/session/${sessionId}`;
const receiptId = `1r${"a".repeat(24)}`;
const receiptRequestUrl = `https://merchant.example/api/unifi/payment/onchain/receipt/${receiptId}`;

test("requires the server-side API key", async () => {
  const response = await handleUniFiProxyRequest(new Request(requestUrl), {
    UNIFI_API_BASE_URL: "https://api.example",
  });
  assert.equal(response.status, 500);
  assert.match(await response.text(), /UNIFI_API_KEY/);
});

test("uses the library API base URL when no override is provided", async () => {
  let observedUrl = "";
  const response = await handleUniFiProxyRequest(
    new Request(requestUrl),
    { UNIFI_API_KEY: "server-secret" },
    {
      fetch: async (input) => {
        observedUrl = input.toString();
        return new Response(JSON.stringify({ data: "" }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  );

  assert.equal(response.status, 200);
  assert.equal(
    observedUrl,
    `${UNIFI_API_BASE_URL}/payment/merchant/session/${sessionId}`,
  );
});

test("binds the platform fetch implementation to globalThis", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = function () {
    assert.equal(this, globalThis);
    return Promise.resolve(
      new Response(JSON.stringify({ data: "" }), {
        headers: { "content-type": "application/json" },
      }),
    );
  };

  try {
    const response = await handleUniFiProxyRequest(new Request(requestUrl), {
      UNIFI_API_KEY: "server-secret",
    });
    assert.equal(response.status, 200);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects methods and paths outside the allowlist", async () => {
  const env = {
    UNIFI_API_BASE_URL: "https://api.example",
    UNIFI_API_KEY: "secret",
  };
  const post = await handleUniFiProxyRequest(
    new Request(requestUrl, { method: "POST" }),
    env,
  );
  assert.equal(post.status, 405);

  const arbitrary = await handleUniFiProxyRequest(
    new Request("https://merchant.example/api/unifi/admin/users"),
    env,
  );
  assert.equal(arbitrary.status, 404);

  const malformed = await handleUniFiProxyRequest(
    new Request("https://merchant.example/api/unifi/payment/merchant/session/%E0%A4%A"),
    env,
  );
  assert.equal(malformed.status, 404);

  const invalidReceipt = await handleUniFiProxyRequest(
    new Request(
      "https://merchant.example/api/unifi/payment/onchain/receipt/not-a-receipt",
    ),
    env,
  );
  assert.equal(invalidReceipt.status, 404);
});

test("rejects an invalid upstream base URL", async () => {
  const response = await handleUniFiProxyRequest(new Request(requestUrl), {
    UNIFI_API_BASE_URL: "not a URL",
    UNIFI_API_KEY: "secret",
  });
  assert.equal(response.status, 500);
  assert.match(await response.text(), /valid absolute URL/);
});

test("injects the key upstream without exposing it downstream", async () => {
  let observedUrl = "";
  let observedAuthorization = "";
  const response = await handleUniFiProxyRequest(
    new Request(requestUrl),
    {
      UNIFI_API_BASE_URL: "https://api.example/v1/",
      UNIFI_API_KEY: "server-secret",
    },
    {
      fetch: async (input, init) => {
        observedUrl = input.toString();
        observedAuthorization = new Headers(init.headers).get("authorization");
        return new Response(JSON.stringify({ data: "receipt-1" }), {
          headers: {
            "content-type": "application/json",
            "set-cookie": "private=value",
          },
        });
      },
    },
  );

  assert.equal(
    observedUrl,
    `https://api.example/v1/payment/merchant/session/${sessionId}`,
  );
  assert.equal(observedAuthorization, "Bearer server-secret");
  assert.equal(response.status, 200);
  assert.equal(response.headers.has("set-cookie"), false);
  assert.equal((await response.text()).includes("server-secret"), false);
});

test("allows the receipt-status route", async () => {
  let observedUrl = "";
  const response = await handleUniFiProxyRequest(
    new Request(receiptRequestUrl),
    {
      UNIFI_API_BASE_URL: "https://api.example/v1/",
      UNIFI_API_KEY: "server-secret",
    },
    {
      fetch: async (input) => {
        observedUrl = input.toString();
        return new Response(
          JSON.stringify({ data: { id: receiptId, status: "Processing" } }),
          { headers: { "content-type": "application/json" } },
        );
      },
    },
  );

  assert.equal(
    observedUrl,
    `https://api.example/v1/payment/onchain/receipt/${receiptId}`,
  );
  assert.equal(response.status, 200);
});

test("allows same-origin CORS and omits unapproved origins", async () => {
  const env = {
    UNIFI_API_BASE_URL: "https://api.example",
    UNIFI_API_KEY: "secret",
  };
  const sameOrigin = await handleUniFiProxyRequest(
    new Request(requestUrl, {
      method: "OPTIONS",
      headers: { Origin: "https://merchant.example" },
    }),
    env,
  );
  assert.equal(
    sameOrigin.headers.get("access-control-allow-origin"),
    "https://merchant.example",
  );

  const otherOrigin = await handleUniFiProxyRequest(
    new Request(requestUrl, {
      method: "OPTIONS",
      headers: { Origin: "https://attacker.example" },
    }),
    env,
  );
  assert.equal(otherOrigin.headers.has("access-control-allow-origin"), false);
});
