import daiIcon from "../assets/dai-icon.svg";
import ethereumIcon from "../assets/ethereum-icon.svg";
import polygonIcon from "../assets/polygon-icon.svg";
import sepoliaIcon from "../assets/sepolia-icon.svg";
import unifiIcon from "../assets/unifi-icon.svg";
import usdcIcon from "../assets/usdc-icon.svg";
import usdtIcon from "../assets/usdt-icon.svg";
import type { UniFiAsset, UniFiNetwork } from "../types";

export { unifiIcon };

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
