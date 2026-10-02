import type { UniFiPaymentSelection } from "../types";
import { assetIcons, networkIcons } from "./assets";

export type UniFiPaymentPairProps = {
  selection: UniFiPaymentSelection;
  className?: string;
};

/**
 * Displays a UniFi payment asset and network with the canonical widget icons.
 */
export function UniFiPaymentPair({
  selection,
  className = "",
}: UniFiPaymentPairProps) {
  return (
    <span
      className={`unifi-widget__payment-pair ${className}`.trim()}
      aria-label={`${selection.asset} on ${selection.network}`}
    >
      <span className="unifi-widget__payment-pair-icons" aria-hidden="true">
        <img
          src={assetIcons[selection.asset]}
          alt=""
          className="unifi-widget__payment-pair-asset-icon"
        />
        <span className="unifi-widget__payment-pair-network-icon">
          <img src={networkIcons[selection.network]} alt="" />
        </span>
      </span>
      <span className="unifi-widget__payment-pair-copy">
        <strong>{selection.asset}</strong>
        <span>{selection.network}</span>
      </span>
    </span>
  );
}
