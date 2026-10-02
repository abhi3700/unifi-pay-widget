# Architecture

The library separates public browser behavior from secret-bearing server behavior.

The server proxy uses the library's production UniFi API endpoint by default. A production merchant integration configures `UNIFI_API_KEY` as a server secret and `MERCHANT_WALLET_ADDRESS` as the public payment recipient. The proxy reads only the API key; the host application passes the wallet address to the widget. UniFi administrators may supply `UNIFI_API_BASE_URL` as a server-side override for local or staging infrastructure.

| Layer | Import | Responsibility | May read API key? |
| --- | --- | --- | --- |
| Core | `unifi-pay-widget` | Sessions, checkout URLs, receipts, status client, shared types | No |
| React | `unifi-pay-widget/react` | Payment/session controllers, finality tracking, components | No |
| Server | `unifi-pay-widget/server` | Validated, allowlisted UniFi API proxy | Yes |
| Styles | `unifi-pay-widget/styles.css` | Namespaced responsive presentation | No |

## Payment sequence

1. The merchant provides amount, recipient, asset, and network.
2. `createUniFiPayment` generates a cryptographically random 64-character hexadecimal session ID.
3. The browser opens the hosted UniFi checkout URL.
4. The merchant page checks its same-origin proxy with the session ID.
5. The proxy validates the request, adds the server-held bearer token, and requests the UniFi API.
6. An empty `data` value remains pending; a non-empty value is the receipt ID.
7. The merchant immediately checks `/payment/onchain/receipt/:receiptId`, then refreshes
   `Processing` or `Confirmed` no more than every 15 minutes unless the customer requests a manual
   refresh. `useUniFiReceiptStatus` and `UniFiReceiptStatusCard` implement this policy for React
   integrations.
8. Only `Finalized` confirms settlement. `Failed` and `Reorged` are unsuccessful terminal states.
9. UniFi retains the session-to-receipt status mapping in Redis for two hours.
10. The merchant durably stores the order, session ID, receipt ID, and finality state, then fulfils
    idempotently only after `Finalized`.

The package intentionally proxies only the session lookup and single-receipt status paths. Expanding
the allowlist should be an explicit server-side change with tests.

Host applications should keep order, cart, and fulfilment state in their own code. Session launch,
hosted-checkout countdown, validated receipt polling, finality semantics, and the standard finality
card belong to this package so integrations do not reimplement the protocol lifecycle.

## Session model

The client session ID is an unpredictable 32-byte random value rendered as 64 hexadecimal characters. Callers may supply an existing compatible session ID for order correlation. Do not put private customer data into the session ID.

## Runtime compatibility

Core code needs Web Crypto, Fetch, URL, Request, and Response APIs. Modern browsers, Node.js 20+, Cloudflare Workers/Pages, Deno, and Bun provide these primitives. React UI supports React 18 and 19.
