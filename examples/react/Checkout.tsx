import { useState } from "react";
import type { UniFiPaymentSelection } from "unifi-pay-widget";
import {
  UniFiPayWidget,
  UniFiReceiptStatusCard,
} from "unifi-pay-widget/react";
import "unifi-pay-widget/styles.css";

export function Checkout() {
  const [selection, setSelection] = useState<UniFiPaymentSelection>({
    asset: "USDT",
    network: "Ethereum",
  });
  const [receiptId, setReceiptId] = useState<string | null>(null);

  return (
    <>
      <UniFiPayWidget
        amount="32.46"
        recipient="0x000000000000000000000000000000000000dEaD"
        value={selection}
        onChange={setSelection}
        onPaid={setReceiptId}
        onError={(error) => console.error(error)}
      />
      {receiptId ? (
        <UniFiReceiptStatusCard
          receiptId={receiptId}
          onStatusChange={(status) => console.log("Receipt status", status)}
        />
      ) : null}
    </>
  );
}
