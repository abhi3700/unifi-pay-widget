# UniFi Pay Widget

`unifi-pay-widget` is a TypeScript integration kit for adding UniFi stablecoin payments to a web checkout. It includes:

- framework-agnostic payment URL and session helpers;
- a typed client for payment-status checks;
- accessible React payment, asset/network picker, status-sheet, and receipt components;
- a server-only proxy that keeps the UniFi API key out of browser bundles;
- examples for Cloudflare Pages and other Fetch API-compatible runtimes.

The package ships as ESM with TypeScript declarations. React is optional unless you import `unifi-pay-widget/react`.

## Security model

These variables belong in the merchant's **server environment**, never in client code or a `VITE_*`, `NEXT_PUBLIC_*`, or similar public variable:

```makefile
UNIFI_API_BASE_URL=
UNIFI_API_KEY=
```

The browser calls a same-origin proxy. The proxy allowlists the single status route needed by the widget and adds the API key server-side.

```text
Browser widget -> merchant /api/unifi -> UniFi API
                    adds API key          returns status

Browser widget -----------------------> UniFi hosted checkout
                    opens payment URL
```

## Install

Until the npm package is published, install directly from GitHub:

```sh
npm install github:abhi3700/unifi-pay-widget#main
```

For local development beside this repository:

```sh
npm install ../unifi-pay-widget
```

Git dependencies run the package's `prepare` script, so consumers receive the compiled `dist/` output.

## Quick start: complete React widget

Import the component and its stylesheet once in your application:

```tsx
import { UniFiPayWidget, UniFiReceiptLink } from "unifi-pay-widget/react";
import "unifi-pay-widget/styles.css";

export function Checkout() {
  return (
    <UniFiPayWidget
      amount="32.46"
      recipient="0x000000000000000000000000000000000000dEaD"
      onPaid={(receiptId) => {
        console.log("UniFi payment confirmed", receiptId);
      }}
      onError={(error) => console.error(error)}
    />
  );
}

export function Receipt({ receiptId }: { receiptId: string }) {
  return <UniFiReceiptLink receiptId={receiptId} />;
}
```

By default, status requests go to `/api/unifi/payment/merchant/session/:sessionId`. Set `proxyBaseUrl` only when your server route uses another prefix.

## Add the server proxy

### Cloudflare Pages

Create `functions/api/unifi/[[path]].ts`:

```ts
import { createCloudflarePagesFunction } from "unifi-pay-widget/server";

type Env = {
  UNIFI_API_BASE_URL?: string;
  UNIFI_API_KEY?: string;
};

export const onRequest = createCloudflarePagesFunction<Env>();
```

Configure both environment variables in the Cloudflare Pages dashboard. For local Pages development, put them in the local server environment and keep that file ignored by Git.

### Fetch API-compatible server route

The proxy is based on standard `Request` and `Response` objects:

```ts
import { handleUniFiProxyRequest } from "unifi-pay-widget/server";

export function GET(request: Request) {
  return handleUniFiProxyRequest(
    request,
    {
      UNIFI_API_BASE_URL: process.env.UNIFI_API_BASE_URL,
      UNIFI_API_KEY: process.env.UNIFI_API_KEY,
    },
    { apiPrefix: "/api/unifi" },
  );
}
```

If the frontend and proxy use different origins, explicitly set `allowedOrigins`. Same-origin requests work without CORS configuration.

## Integrate into an existing checkout

Use `UniFiPaymentOption` when the host application already owns its Pay button and success state:

```tsx
import { useState } from "react";
import {
  UniFiPaymentOption,
  UniFiPaymentStatusSheet,
} from "unifi-pay-widget/react";
import {
  checkUniFiPaymentStatus,
  createUniFiPayment,
  type UniFiPaymentSelection,
} from "unifi-pay-widget";
import "unifi-pay-widget/styles.css";

const [selection, setSelection] = useState<UniFiPaymentSelection>({
  asset: "USDT",
  network: "Ethereum",
});

<UniFiPaymentOption value={selection} onChange={setSelection} />;

const payment = createUniFiPayment({
  ...selection,
  amount: "32.46",
  recipient: "0x000000000000000000000000000000000000dEaD",
});

window.open(payment.payUrl, "_blank", "noopener,noreferrer");

const status = await checkUniFiPaymentStatus(payment.sessionId);
```

`UniFiPaymentStatusSheet` can display the generated link and call the host application's status handler. It manages its own loading state unless a `checking` prop is supplied.

## Headless TypeScript usage

No React dependency is needed for the root entry point:

```ts
import {
  UniFiClient,
  createUniFiPayment,
  createUniFiReceiptUrl,
} from "unifi-pay-widget";

const payment = createUniFiPayment({
  asset: "USDC",
  network: "Polygon",
  amount: 25,
  recipient: "0xabc...",
});

const client = new UniFiClient({ proxyBaseUrl: "/api/unifi" });
const result = await client.checkPaymentStatus(payment.sessionId);

if (result.state === "paid") {
  console.log(createUniFiReceiptUrl(result.receiptId));
}
```

## Supported payment pairs

- Assets: USDT, USDC, DAI
- Networks: Ethereum, Polygon, Sepolia

The package does not silently change a user's selected pair. The UniFi checkout remains the final authority on whether a given pair is currently available.

## React API overview

### `UniFiPayWidget`

Required props are `amount` and `recipient`. Useful optional props include:

- `value`, `defaultValue`, `onChange` for controlled or uncontrolled selection;
- `proxyBaseUrl` and `checkoutBaseUrl` for non-default deployments;
- `onSession`, `onStatus`, `onPaid`, and `onError` lifecycle callbacks;
- `expirySeconds`, `disabled`, `buttonLabel`, and `openInNewTab`.

### `UniFiPaymentOption`

A controlled payment-method row and bottom-sheet pair picker. Use `selected` and `onSelect` when it participates in a larger payment-method radio group.

### `UniFiPaymentStatusSheet`

A controlled bottom sheet. Supply `open`, `secondsLeft`, `statusText`, `payUrl`, `onCheckStatus`, and `onClose`.

### `UniFiReceiptLink`

Builds a canonical UniFi receipt URL from `receiptId` and renders an external link.

See [API reference](docs/api-reference.md), [architecture](docs/architecture.md), and the [merchant checklist](docs/integration-checklist.md) for more detail.

## Customize the theme

Override CSS variables near your application root:

```css
.my-checkout {
  --unifi-primary: #321967;
  --unifi-primary-hover: #281252;
  --unifi-accent: #6d28d9;
  --unifi-accent-soft: #f5f3ff;
}
```

Class names are prefixed with `unifi-widget` to minimize collisions. The UI follows the host application's font.

## Development

```sh
npm install
npm run check
npm test
npm pack --dry-run
```

Node.js 20 or newer is required for package development and tests.

## Publishing later

When the npm organization/package is ready, update the package name if needed, authenticate with npm, and publish from a clean tagged commit:

```sh
npm publish --access public
```

Consumers can then replace the GitHub dependency with a normal semver dependency without changing imports.

## License

MIT
