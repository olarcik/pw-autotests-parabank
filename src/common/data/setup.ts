export const ENV = process.env.ENV ?? 'dev';
export const TENANT = process.env.TENANT ?? 'parabank';
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080/parabank';

export const URLS = {
  app: BASE_URL,
  // REST API base (docs/parabank-api.md)
  api: `${BASE_URL}/services/bank`,
};
