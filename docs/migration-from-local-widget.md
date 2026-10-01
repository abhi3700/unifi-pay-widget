# Migrating a local widget

1. Install `unifi-pay-widget` and import `unifi-pay-widget/styles.css` once.
2. Replace local asset/network types with `UniFiAsset`, `UniFiNetwork`, and `UniFiPaymentSelection` from the root entry point.
3. Replace local session and URL builders with `createUniFiPayment`.
4. Replace direct API requests with `checkUniFiPaymentStatus` through a same-origin proxy.
5. Replace a broad API passthrough with `handleUniFiProxyRequest` or `createCloudflarePagesFunction`.
6. Replace local UI with `UniFiPaymentOption`, `UniFiPaymentStatusSheet`, or the complete `UniFiPayWidget`.
7. Remove client-exposed API keys and obsolete runtime-config endpoints.
8. Validate checkout routing, pending/paid behavior, receipts, mobile layout, and a production build before deleting the old implementation.

For a temporary local sibling dependency use `"unifi-pay-widget": "file:../unifi-pay-widget"`. After pushing the standalone repository, change it to `"github:abhi3700/unifi-pay-widget#<tag-or-commit>"` and refresh the lockfile.
