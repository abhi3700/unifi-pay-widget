import { createCloudflarePagesFunction } from "unifi-pay-widget/server";

type Env = {
  UNIFI_API_KEY: string;
};

export const onRequest = createCloudflarePagesFunction<Env>();
