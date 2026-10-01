import { useCallback, useEffect, useRef, useState } from "react";
import { UNIFI_ASSETS, UNIFI_NETWORKS } from "../constants";
import type { UniFiPaymentSelection } from "../types";
import {
  assetIcons,
  chevronDownIcon,
  networkIcons,
  unifiIcon,
} from "./assets";

export type UniFiPaymentOptionProps = {
  value: UniFiPaymentSelection;
  onChange: (selection: UniFiPaymentSelection) => void;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  title?: string;
  caption?: string;
  radioName?: string;
  className?: string;
};

export function UniFiPaymentOption({
  value,
  onChange,
  selected = true,
  onSelect,
  disabled = false,
  title = "UniFi",
  caption = "Pay with Stablecoins",
  radioName = "unifi-payment",
  className = "",
}: UniFiPaymentOptionProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const closeSheet = useCallback(() => setOpen(false), []);

  function openSheet() {
    if (disabled) return;
    onSelect?.();
    setDraft(value);
    setOpen(true);
  }

  function commit() {
    onChange(draft);
    onSelect?.();
    setOpen(false);
  }

  return (
    <>
      <div
        className={`unifi-widget__option ${selected ? "is-selected" : ""} ${disabled ? "is-disabled" : ""} ${className}`.trim()}
        onClick={() => !disabled && onSelect?.()}
      >
        <input
          type="radio"
          name={radioName}
          aria-label="Pay with UniFi"
          checked={selected}
          disabled={disabled}
          onChange={() => onSelect?.()}
          className="unifi-widget__radio"
        />
        <div className="unifi-widget__option-body">
          <div className="unifi-widget__brand-copy">
            <div className="unifi-widget__brand-row">
              <img src={unifiIcon} alt="" className="unifi-widget__brand-icon" />
              <strong>{title}</strong>
            </div>
            <span>{caption}</span>
          </div>
          <button
            type="button"
            className="unifi-widget__pair-button"
            aria-label={`Change asset and network, ${value.asset} on ${value.network}`}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              openSheet();
            }}
          >
            <PairIcon selection={value} />
            <span className="unifi-widget__pair-copy">
              <strong>{value.asset}</strong>
              <span>{value.network}</span>
            </span>
            <img
              src={chevronDownIcon}
              alt=""
              aria-hidden="true"
              className="unifi-widget__chevron"
            />
          </button>
        </div>
      </div>
      {open ? (
        <PaymentPairSheet
          value={draft}
          onChange={setDraft}
          onClose={closeSheet}
          onDone={commit}
        />
      ) : null}
    </>
  );
}

function PairIcon({ selection }: { selection: UniFiPaymentSelection }) {
  return (
    <span className="unifi-widget__pair-icon">
      <img src={assetIcons[selection.asset]} alt="" />
      <span>
        <img src={networkIcons[selection.network]} alt="" />
      </span>
    </span>
  );
}

function PaymentPairSheet({
  value,
  onChange,
  onClose,
  onDone,
}: {
  value: UniFiPaymentSelection;
  onChange: (selection: UniFiPaymentSelection) => void;
  onClose: () => void;
  onDone: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="unifi-widget__sheet-layer">
      <button
        type="button"
        className="unifi-widget__backdrop"
        aria-label="Close asset and network picker"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="unifi-widget-pair-title"
        className="unifi-widget__sheet unifi-widget__pair-sheet"
      >
        <div className="unifi-widget__handle" aria-hidden="true" />
        <header className="unifi-widget__sheet-heading">
          <div>
            <h2 id="unifi-widget-pair-title">Select the asset &amp; network</h2>
            <p>Choose the stablecoin and network you want to use.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="unifi-widget__close-icon"
            aria-label="Close asset and network picker"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <OptionHeading title="Assets" hint="Stablecoins" />
        <div className="unifi-widget__asset-list">
          {UNIFI_ASSETS.map((asset) => (
            <button
              key={asset}
              type="button"
              aria-pressed={value.asset === asset}
              className={`unifi-widget__asset is-${asset.toLowerCase()} ${value.asset === asset ? "is-selected" : ""}`}
              onClick={() => onChange({ ...value, asset })}
            >
              <img src={assetIcons[asset]} alt="" />
              <strong>{asset}</strong>
              {value.asset === asset ? <span aria-hidden="true">✓</span> : null}
            </button>
          ))}
        </div>

        <div className="unifi-widget__divider" />
        <OptionHeading title="Networks" hint="Select network" />
        <div className="unifi-widget__network-list">
          {UNIFI_NETWORKS.map((network) => (
            <button
              key={network}
              type="button"
              aria-pressed={value.network === network}
              className={`unifi-widget__network ${value.network === network ? "is-selected" : ""}`}
              onClick={() => onChange({ ...value, network })}
            >
              <img src={networkIcons[network]} alt="" />
              <strong>{network}</strong>
              {value.network === network ? <span aria-hidden="true">✓</span> : null}
            </button>
          ))}
        </div>
        <button type="button" className="unifi-widget__done" onClick={onDone}>
          Done
        </button>
      </section>
    </div>
  );
}

function OptionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="unifi-widget__option-heading">
      <h3>{title}</h3>
      <span>{hint}</span>
    </div>
  );
}
