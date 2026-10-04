import daiIcon from "../assets/dai-icon.svg";
import selectedNetworkCheckIcon from "../assets/check-circle-fill-blue.svg";
import selectedAssetCheckIcon from "../assets/check-circle-fill-white.svg";
import chevronDownIcon from "../assets/chevron-down.svg";
import ethereumIcon from "../assets/ethereum-icon.svg";
import polygonIcon from "../assets/polygon-icon.svg";
import refreshIcon from "../assets/arrow-clockwise.svg";
import sepoliaIcon from "../assets/sepolia-icon.svg";
import unifiIcon from "../assets/unifi-icon.svg";
import usdcIcon from "../assets/usdc-icon.svg";
import usdtIcon from "../assets/usdt-icon.svg";
import xLgIcon from "../assets/x-lg.svg";
import type { UniFiAsset, UniFiNetwork } from "../types";

export {
  chevronDownIcon,
  refreshIcon,
  selectedAssetCheckIcon,
  selectedNetworkCheckIcon,
  unifiIcon,
  xLgIcon,
};

export const assetIcons: Record<UniFiAsset, string> = {
  USDT: usdtIcon,
  USDC: usdcIcon,
  DAI: daiIcon,
};

export const networkIcons: Record<UniFiNetwork, string> = {
  Ethereum: ethereumIcon,
  Polygon: polygonIcon,
  Sepolia: sepoliaIcon,
};
