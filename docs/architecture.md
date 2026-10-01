# Architecture

The library separates public browser behavior from secret-bearing server behavior.

The server proxy uses the library's production UniFi API endpoint by default. Merchants provide only `UNIFI_API_KEY`; UniFi administrators may supply `UNIFI_API_BASE_URL` as a server-side override for local or staging infrastructure.

| Layer | Import | Responsibility | May read API key? |
| --- | --- | --- | --- |
| Core | `unifi-pay-widget` | Sessions, checkout URLs, receipts, status client, shared types | No |
| React | `unifi-pay-widget/react` | Payment option, bottom sheets, complete widget | No |
| Server | `unifi-pay-widget/server` | Validated, allowlisted UniFi API proxy | Yes |
| Styles | `unifi-pay-widget/styles.css` | Namespaced responsive presentation | No |

## Payment sequence

1. The merchant provides amount, recipient, asset, and network.
2. `createUniFiPayment` generates a cryptographically random 64-character hexadecimal session ID.
3. The browser opens the hosted UniFi checkout URL.
4. The merchant page checks its same-origin proxy with the session ID.
5. The proxy validates the request, adds the server-held bearer token, and requests the UniFi API.
6. An empty `data` value remains pending; a non-empty value is the receipt ID.
7. The merchant fulfills only after its trusted order flow accepts the confirmed receipt.

The package intentionally does not proxy arbitrary upstream paths. Expanding the allowlist should be an explicit server-side change with tests.

## Session model

The client session ID is an unpredictable 32-byte random value rendered as 64 hexadecimal characters. Callers may supply an existing compatible session ID for order correlation. Do not put private customer data into the session ID.

## Runtime compatibility

Core code needs Web Crypto, Fetch, URL, Request, and Response APIs. Modern browsers, Node.js 20+, Cloudflare Workers/Pages, Deno, and Bun provide these primitives. React UI supports React 18 and 19.
