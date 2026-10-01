import { useState } from "react";
import type { UniFiPaymentSelection } from "unifi-pay-widget";
import { UniFiPayWidget } from "unifi-pay-widget/react";
import "unifi-pay-widget/styles.css";

export function Checkout() {
  const [selection, setSelection] = useState<UniFiPaymentSelection>({
    asset: "USDT",
    network: "Ethereum",
  });

  return (
    <UniFiPayWidget
      amount="32.46"
      recipient="0x000000000000000000000000000000000000dEaD"
      value={selection}
      onChange={setSelection}
      onPaid={(receiptId) => console.log("Paid", receiptId)}
      onError={(error) => console.error(error)}
    />
  );
}
