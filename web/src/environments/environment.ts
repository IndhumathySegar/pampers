import * as _package from "../../package.json";

export const environment = {
  production: false,
  isMockEnabled: false, // You have to switch this, when your real back-end is done
  authTokenKey: "authce9d77b308c149d5992a80073637e4d5",
  API_URL: "http://localhost:8080",
  BASE_URL: "http://localhost:8080",
  STORE_LOGGER: true, // logging store actions to console log
  version: _package.version,
  INACTIVITY_INTERVAL: 60,
  READ_SAS_TOKEN:
    "?sv=2019-02-02&sr=c&si=read-policy&sig=5m0gipRFe0ITz0wHMB7i%2FMd8U8Y9n1dQul8eRkQbO%2Bw%3D",
  env: "dev",
  TINY_EDITOR_API_KEY: 'fwxtan64cs7pmxpzbarvdpm2dyaprq8erz8w7agw44iiarwr',
  LOCALE_ENVIRONMENTS: ['dev-staging-content','dev-master-content','crm-sit'],
  GEN_AI_DATE : "2025-01-15"
};
  

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
