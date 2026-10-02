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

### `client.checkReceiptStatus(receiptId)`

Requests the allowlisted `/payment/onchain/receipt/:receiptId` route and resolves to one of:

```ts
{ state: "received", receipt: { id, status, ...details } }
{ state: "failed", message: string }
```

Receipt status is `Processing`, `Confirmed`, `Finalized`, `Failed`, or `Reorged`.
`checkUniFiReceiptStatus` is the one-shot equivalent. Treat the session-level `paid` state as
receipt detection and confirm an order only when the receipt reaches `Finalized`.

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

### `useUniFiPayment(options?)`

Provides the reusable session lifecycle for host-owned checkout UI: `startPayment`, `checkStatus`,
`closeStatus`, and `reset`, plus the session, countdown, status text, and loading state consumed by
`UniFiPaymentStatusSheet`. Options control checkout/proxy URLs, expiry behavior, new-tab launch, and
session/status/receipt/error callbacks.

### `useUniFiReceiptStatus(options)`

Requires `receiptId`. It performs the immediate receipt check, suppresses concurrent checks,
automatically refreshes non-terminal states at the shared 15-minute cadence, and exposes receipt,
status, loading, error, last-check, countdown, and manual `refresh` state. Optional callbacks report
validated receipt changes and errors.

### `UniFiReceiptStatusCard`

Runs `useUniFiReceiptStatus` and renders the reusable finality status, refresh countdown, last-check
time, errors, and manual refresh control. Automatic polling and the manual refresh control both stop
for terminal `Finalized`, `Failed`, and `Reorged` states. `receiptId` is required; proxy, refresh,
callback, and copy options match the hook.

### `UniFiReceiptLink`

Requires `receiptId`. Optional props are `checkoutBaseUrl`, `children`, and `className`.

## Server: `unifi-pay-widget/server`

### `handleUniFiProxyRequest(request, env, options?): Promise<Response>`

Reads the required `UNIFI_API_KEY` from `env` and allowlists the session lookup plus single-receipt
status routes. The optional `UNIFI_API_BASE_URL` overrides the library's production API endpoint
for local, staging, or self-hosted deployments. Options:

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
- `UNIFI_RECEIPT_REFRESH_INTERVAL_MS`: `900000`
- `getUniFiPaymentRemainingSeconds(startTimestampSeconds, nowTimestampMilliseconds?, expirySeconds?)`:
  derives the countdown from the timestamp embedded in the payment session URL. A custom expiry
  may shorten the hosted 15-minute lifetime but cannot extend it.
- `UNIFI_ASSETS`: supported asset names
- `UNIFI_NETWORKS`: supported network names
- `isUniFiReceiptStatusTerminal(status)`: identifies `Finalized`, `Failed`, and `Reorged`
- `canRefreshUniFiReceiptStatus(status)`: permits refresh only for non-terminal receipt states
- `getUniFiReceiptStatusLabel(status)`: returns the shared user-facing finality label
