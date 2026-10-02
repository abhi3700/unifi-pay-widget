# Merchant integration checklist

## Before development

- Obtain a UniFi API key. The library already contains the production API endpoint.
- Configure the required production `MERCHANT_WALLET_ADDRESS` that receives payment.
- Decide how UniFi sessions map to internal order IDs.
- Choose a deployment with server or edge-function support.

## Implementation

- Install the library and import the stylesheet once.
- Add `UNIFI_API_KEY` to the server secret store.
- Keep `MERCHANT_WALLET_ADDRESS` in public server/application configuration and pass it to the widget as `recipient`.
- Set `UNIFI_API_BASE_URL` only when testing against a local, staging, or self-hosted UniFi API.
- Mount the allowlisted server proxy.
- Pass the order amount and recipient to the widget or core helper.
- Record the session ID against the order before fulfillment.
- Handle session `pending`, receipt-detected `paid`, and request `failed` states explicitly.
- Persist the detected receipt ID with the order; UniFi's session-to-receipt status mapping expires after two hours.
- Check receipt status immediately, automatically every 15 minutes while `Processing` or
  `Confirmed`, and immediately when the customer uses the manual refresh control.
- Confirm and fulfil only after `Finalized`; keep `Failed` and `Reorged` unfulfilled.
- Link the receipt for customer support and auditability.

## Production readiness

- Confirm no API key appears in generated JavaScript, HTML, source maps, logs, or network requests from the browser.
- Test `Processing`, `Confirmed`, `Finalized`, `Failed`, and `Reorged`, plus an expired session,
  rejected API key, and upstream outage.
- Test narrow mobile screens, keyboard navigation, Escape-to-close, and return from the UniFi tab.
- Fulfill only from trusted, server-confirmed order logic.
- Add monitoring and rate limits appropriate to checkout traffic.
- Refresh `unifi-pay-widget#main` explicitly, test the resolved commit, commit `package-lock.json`, and deploy that lockfile with `npm ci`.
