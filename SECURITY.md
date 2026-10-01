# Security

## Protect the API key

`UNIFI_API_KEY` is a server credential. Never:

- prefix it with `VITE_`, `NEXT_PUBLIC_`, or another client-exposed prefix;
- pass it as a React prop;
- put it in browser storage or a payment URL;
- commit it to Git or include it in screenshots and logs.

Use the server proxy exported by `unifi-pay-widget/server`. It accepts only `GET /payment/merchant/session/:sessionId`, validates the 64-character hexadecimal session ID, strips upstream cookies, and sends `Cache-Control: no-store`.

## Merchant responsibilities

- Use HTTPS in production.
- Keep API credentials in the hosting provider's encrypted secret store.
- Treat the server-confirmed receipt ID—not a browser redirect—as proof of payment.
- Verify price, currency, recipient, and order ownership in trusted server-side order logic before fulfillment.
- Rate-limit the public status endpoint at the hosting edge if traffic warrants it.
- Restrict cross-origin access with `allowedOrigins` when the frontend is not same-origin.

## Reporting a vulnerability

Do not open a public issue containing secrets or exploit details. Contact the repository owner privately with reproduction steps, affected versions, and the expected impact.
