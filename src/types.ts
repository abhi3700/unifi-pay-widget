export type UniFiAsset = "USDT" | "USDC" | "DAI";
export type UniFiNetwork = "Ethereum" | "Polygon" | "Sepolia";

export type UniFiPaymentSelection = {
  asset: UniFiAsset;
  network: UniFiNetwork;
};

export type CreateUniFiPaymentInput = UniFiPaymentSelection & {
  amount: string | number;
  recipient: string;
  sessionId?: string;
  startTimestampSeconds?: number;
  checkoutBaseUrl?: string;
};

export type UniFiPaymentSession = UniFiPaymentSelection & {
  amount: string;
  recipient: string;
  sessionId: string;
  startTimestampSeconds: number;
  payUrl: string;
};

export type UniFiPaymentStatus =
  | { state: "pending" }
  | { state: "paid"; receiptId: string }
  | { state: "failed"; message: string };

export type UniFiClientOptions = {
  proxyBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
};

export type UniFiApiStatusResponse = {
  status?: string;
  data?: string;
  message?: string;
  error?: string;
  detail?: string;
};
