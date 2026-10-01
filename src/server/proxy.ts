import { UNIFI_API_BASE_URL } from "../constants";
import { isUniFiSessionId } from "../core/session";

export type UniFiServerEnv = {
  UNIFI_API_KEY: string;
  UNIFI_API_BASE_URL?: string;
};

export type UniFiProxyOptions = {
  apiPrefix?: string;
  allowedOrigins?: readonly string[];
  fetch?: typeof globalThis.fetch;
};

export type CloudflarePagesContext<Env extends UniFiServerEnv> = {
  request: Request;
  env: Env;
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers?: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function normalizePrefix(value: string): string {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

function corsHeaders(
  request: Request,
  allowedOrigins: readonly string[] | undefined,
): Record<string, string> {
  const origin = request.headers.get("Origin");
  if (!origin) return {};

  const requestOrigin = new URL(request.url).origin;
  const allowed = origin === requestOrigin || allowedOrigins?.includes(origin);
  if (!allowed) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function readStatusSessionId(pathname: string): string | null {
  const prefix = "/payment/merchant/session/";
  if (!pathname.startsWith(prefix)) return null;
  try {
    const value = decodeURIComponent(pathname.slice(prefix.length));
    return !value.includes("/") && isUniFiSessionId(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Securely proxies the one API route needed by the browser widget.
 *
 * The API key is read only from the server environment and is never returned
 * to the browser. The default allowlist accepts only:
 * GET /payment/merchant/session/:sessionId
 */
export async function handleUniFiProxyRequest(
  request: Request,
  env: Partial<UniFiServerEnv>,
  options: UniFiProxyOptions = {},
): Promise<Response> {
  const apiPrefix = normalizePrefix(options.apiPrefix ?? "/api/unifi");
  const responseCorsHeaders = corsHeaders(request, options.allowedOrigins);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: responseCorsHeaders,
    });
  }

  if (request.method !== "GET") {
    return jsonResponse(
      { error: "Method not allowed." },
      405,
      responseCorsHeaders,
    );
  }

  const apiKey = env.UNIFI_API_KEY?.trim();
  if (!apiKey) {
    return jsonResponse(
      { error: "Server configuration is missing UNIFI_API_KEY." },
      500,
      responseCorsHeaders,
    );
  }
  const apiBaseUrl = env.UNIFI_API_BASE_URL?.trim() || UNIFI_API_BASE_URL;

  const requestUrl = new URL(request.url);
  if (
    requestUrl.pathname !== apiPrefix &&
    !requestUrl.pathname.startsWith(`${apiPrefix}/`)
  ) {
    return jsonResponse({ error: "Not found." }, 404, responseCorsHeaders);
  }

  const upstreamPath = requestUrl.pathname.slice(apiPrefix.length) || "/";
  const sessionId = readStatusSessionId(upstreamPath);
  if (!sessionId) {
    return jsonResponse(
      { error: "This UniFi API route is not allowed." },
      404,
      responseCorsHeaders,
    );
  }

  let upstreamUrl: URL;
  try {
    const upstreamBase = apiBaseUrl.endsWith("/")
      ? apiBaseUrl
      : `${apiBaseUrl}/`;
    upstreamUrl = new URL(
      `payment/merchant/session/${encodeURIComponent(sessionId)}`,
      upstreamBase,
    );
  } catch {
    return jsonResponse(
      { error: "UNIFI_API_BASE_URL is not a valid absolute URL." },
      500,
      responseCorsHeaders,
    );
  }
  const fetchImpl = options.fetch ?? globalThis.fetch?.bind(globalThis);

  try {
    const upstreamResponse = await fetchImpl(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      redirect: "follow",
    });

    const headers = new Headers(upstreamResponse.headers);
    headers.set("Cache-Control", "no-store");
    for (const [key, value] of Object.entries(responseCorsHeaders)) {
      if (value !== undefined) headers.set(key, String(value));
    }
    headers.delete("set-cookie");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers,
    });
  } catch {
    return jsonResponse(
      { error: "Unable to reach the UniFi API." },
      502,
      responseCorsHeaders,
    );
  }
}

export function createCloudflarePagesFunction<Env extends UniFiServerEnv>(
  options: UniFiProxyOptions = {},
): (context: CloudflarePagesContext<Env>) => Promise<Response> {
  return ({ request, env }) => handleUniFiProxyRequest(request, env, options);
}
