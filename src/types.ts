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

export type UniFiReceiptStatus =
  | "Processing"
  | "Failed"
  | "Confirmed"
  | "Finalized"
  | "Reorged";

export type UniFiPaymentReceipt = {
  id: string;
  entity: string;
  user_id: string;
  is_fee_incl: boolean;
  chain: string;
  coin: string;
  to_address: string;
  amount: string;
  memo: unknown;
  est_fee: string;
  act_fee: string;
  tx_hash: string;
  block_num: number;
  status: UniFiReceiptStatus;
  start_ts_us: number;
  end_ts_us: number;
};

export type UniFiReceiptStatusResult =
  | { state: "received"; receipt: UniFiPaymentReceipt }
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

export type UniFiApiReceiptResponse = {
  status?: string;
  data?: UniFiPaymentReceipt;
  message?: string;
  error?: string;
  detail?: string;
};
