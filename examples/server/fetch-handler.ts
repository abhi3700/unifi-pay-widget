import { handleUniFiProxyRequest } from "unifi-pay-widget/server";

export function handleRequest(request: Request): Promise<Response> {
  return handleUniFiProxyRequest(request, {
    UNIFI_API_BASE_URL: process.env.UNIFI_API_BASE_URL,
    UNIFI_API_KEY: process.env.UNIFI_API_KEY,
  });
}
