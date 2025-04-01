import * as _package from "../../package.json";

export const environment = {
  production: true,
  isMockEnabled: false, // You have to switch this, when your real back-end is done
  authTokenKey: "authce9d77b308c149d5992a80073637e4d5",
  API_URL: "https://contenthub-api.pampers.com",
  BASE_URL: 'https://contenthub.pampers.com/',
  STORE_LOGGER: false, // logging store actions to console log
  version: _package.version,
  INACTIVITY_INTERVAL: 60,
  env: "us-prod",
  TINY_EDITOR_API_KEY: 'fwxtan64cs7pmxpzbarvdpm2dyaprq8erz8w7agw44iiarwr',
  LOCALE_ENVIRONMENTS: ['staging','master','crm-uat','crm-prod'],
   GEN_AI_DATE : "2025-01-15"
};
