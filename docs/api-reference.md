# API reference

## Core: `unifi-pay-widget`

### `createUniFiSessionId(): string`

Creates a secure 32-byte random session ID encoded as 64 hexadecimal characters.

### `isUniFiSessionId(value): boolean`

Returns whether a value has the required session format.

### `createUniFiPayment(input): UniFiPaymentSession`

Requires `asset`, `network`, `amount`, and `recipient`. Optional values are `sessionId`, `startTimestampSeconds`, and `checkoutBaseUrl`. It returns the normalized input plus `payUrl`.

### `createUniFiReceiptUrl(receiptId, checkoutBaseUrl?): string`

Builds the hosted receipt URL.

### `new UniFiClient(options?)`

`proxyBaseUrl` defaults to `/api/unifi`. A custom `fetch` implementation may be supplied for non-browser runtimes and tests.

`checkPaymentStatus(sessionId)` resolves to one of:

```ts
{ state: "pending" }
{ state: "paid", receiptId: string }
{ state: "failed", message: string }
```

`checkUniFiPaymentStatus` is the one-shot equivalent.

## React: `unifi-pay-widget/react`

### `UniFiPayWidget`

Combines pair selection, session creation, checkout launch, countdown, and manual status checking. It is uncontrolled by default and supports controlled selection through `value` and `onChange`.

### `UniFiPaymentOption`

Required props:

- `value: { asset, network }`
- `onChange(nextSelection)`

Optional props: `selected`, `onSelect`, `disabled`, `title`, `caption`, `radioName`, and `className`. Set `radioName` to the host checkout's payment-method group name when embedding it alongside other radio options.

### `UniFiPaymentStatusSheet`

Required props: `open`, `secondsLeft`, `statusText`, `onCheckStatus`, and `onClose`. `payUrl` is optional. `checking` is optional; when omitted, the component manages button loading while awaiting `onCheckStatus`.

### `UniFiReceiptLink`

Requires `receiptId`. Optional props are `checkoutBaseUrl`, `children`, and `className`.

## Server: `unifi-pay-widget/server`

### `handleUniFiProxyRequest(request, env, options?): Promise<Response>`

Reads the required `UNIFI_API_KEY` from `env`. The optional `UNIFI_API_BASE_URL` overrides the library's production API endpoint for local, staging, or self-hosted deployments. Options:

- `apiPrefix` defaults to `/api/unifi`;
- `allowedOrigins` allows explicit cross-origin frontends;
- `fetch` replaces the upstream Fetch implementation for runtimes or tests.

### `createCloudflarePagesFunction(options?)`

Adapts the handler to the Cloudflare Pages Function `{ request, env }` shape.

## Constants

- `UNIFI_CHECKOUT_BASE_URL`: `https://payunifi.com`
- `UNIFI_API_BASE_URL`: `https://api.payunifi.com`
- `UNIFI_PROXY_BASE_URL`: `/api/unifi`
- `UNIFI_PAYMENT_EXPIRY_SECONDS`: `900`
- `getUniFiPaymentRemainingSeconds(startTimestampSeconds, nowTimestampMilliseconds?, expirySeconds?)`:
  derives the countdown from the timestamp embedded in the payment session URL. A custom expiry
  may shorten the hosted 15-minute lifetime but cannot extend it.
- `UNIFI_ASSETS`: supported asset names
- `UNIFI_NETWORKS`: supported network names
