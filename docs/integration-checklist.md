# Merchant integration checklist

## Before development

- Obtain the UniFi API base URL and API key.
- Decide which wallet address receives payment.
- Decide how UniFi sessions map to internal order IDs.
- Choose a deployment with server or edge-function support.

## Implementation

- Install the library and import the stylesheet once.
- Add `UNIFI_API_BASE_URL` and `UNIFI_API_KEY` to the server secret store.
- Mount the allowlisted server proxy.
- Pass the order amount and recipient to the widget or core helper.
- Record the session ID against the order before fulfillment.
- Handle `pending`, `paid`, and `failed` states explicitly.
- Link the confirmed receipt for customer support and auditability.

## Production readiness

- Confirm no API key appears in generated JavaScript, HTML, source maps, logs, or network requests from the browser.
- Test a successful payment, pending payment, expired session, rejected API key, and upstream outage.
- Test narrow mobile screens, keyboard navigation, Escape-to-close, and return from the UniFi tab.
- Fulfill only from trusted, server-confirmed order logic.
- Add monitoring and rate limits appropriate to checkout traffic.
- Pin Git dependencies to a release tag or commit SHA; avoid a moving branch for production deployments.
