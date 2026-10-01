import { UNIFI_PROXY_BASE_URL } from "../constants";
import type {
  UniFiApiStatusResponse,
  UniFiClientOptions,
  UniFiPaymentStatus,
} from "../types";
import { UniFiPayError } from "./errors";
import { assertUniFiSessionId } from "./session";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

async function readError(response: Response): Promise<string> {
  const fallback = `UniFi request failed (${response.status}).`;
  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await response.json()) as UniFiApiStatusResponse;
      return body.message || body.error || body.detail || fallback;
    }
    return (await response.text()).trim() || fallback;
  } catch {
    return fallback;
  }
}

export class UniFiClient {
  readonly proxyBaseUrl: string;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(options: UniFiClientOptions = {}) {
    this.proxyBaseUrl = stripTrailingSlash(
      options.proxyBaseUrl ?? UNIFI_PROXY_BASE_URL,
    );
    const fetchImpl =
      options.fetch ?? globalThis.fetch?.bind(globalThis);
    if (!fetchImpl) {
      throw new UniFiPayError("A Fetch API implementation is required.", {
        code: "FETCH_UNAVAILABLE",
      });
    }
    this.fetchImpl = fetchImpl;
  }

  async checkPaymentStatus(sessionId: string): Promise<UniFiPaymentStatus> {
    assertUniFiSessionId(sessionId);
    const path = `/payment/merchant/session/${encodeURIComponent(sessionId)}`;

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.proxyBaseUrl}${path}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
    } catch (error) {
      return {
        state: "failed",
        message:
          error instanceof Error
            ? error.message
            : "Network error while checking payment status.",
      };
    }

    if (!response.ok) {
      return { state: "failed", message: await readError(response) };
    }

    try {
      const body = (await response.json()) as UniFiApiStatusResponse;
      const receiptId = (body.data ?? "").trim();
      return receiptId
        ? { state: "paid", receiptId }
        : { state: "pending" };
    } catch {
      return {
        state: "failed",
        message: "UniFi returned an invalid status response.",
      };
    }
  }
}

export async function checkUniFiPaymentStatus(
  sessionId: string,
  options?: UniFiClientOptions,
): Promise<UniFiPaymentStatus> {
  return new UniFiClient(options).checkPaymentStatus(sessionId);
}
