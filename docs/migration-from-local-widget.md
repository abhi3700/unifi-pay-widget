# Migrating a local widget

1. Install `unifi-pay-widget` and import `unifi-pay-widget/styles.css` once.
2. Replace local asset/network types with `UniFiAsset`, `UniFiNetwork`, and `UniFiPaymentSelection` from the root entry point.
3. Replace local session and URL builders with `createUniFiPayment`.
4. Replace direct API requests with `checkUniFiPaymentStatus` through a same-origin proxy.
5. Replace a broad API passthrough with `handleUniFiProxyRequest` or `createCloudflarePagesFunction`.
6. Replace local session/countdown state with `useUniFiPayment` when the host owns the Pay button.
7. Replace local receipt guards, polling, countdowns, and status UI with `useUniFiReceiptStatus` or
   `UniFiReceiptStatusCard`.
8. Replace remaining local UI with `UniFiPaymentOption`, `UniFiPaymentStatusSheet`, or the complete
   `UniFiPayWidget`.
9. Remove client-exposed API keys and obsolete runtime-config endpoints.
10. Validate checkout routing, pending/receipt-detected behavior, all finality states, mobile layout,
    and a production build before deleting the old implementation.

For a temporary local sibling dependency use `"unifi-pay-widget": "file:../unifi-pay-widget"`. After pushing the standalone repository, change it to `"github:abhi3700/unifi-pay-widget#<tag-or-commit>"` and refresh the lockfile.
