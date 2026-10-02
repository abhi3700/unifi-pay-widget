import type { UniFiAsset, UniFiNetwork } from "./types";

export const UNIFI_CHECKOUT_BASE_URL = "https://payunifi.com";
export const UNIFI_API_BASE_URL = "https://api.payunifi.com";
export const UNIFI_PROXY_BASE_URL = "/api/unifi";
export const UNIFI_PAYMENT_EXPIRY_SECONDS = 15 * 60;

export const UNIFI_ASSETS = [
    "USDT",
    "USDC",
    "DAI",
] as const satisfies readonly UniFiAsset[];
export const UNIFI_NETWORKS = [
    "Ethereum",
    "Polygon",
    "Sepolia",
] as const satisfies readonly UniFiNetwork[];
