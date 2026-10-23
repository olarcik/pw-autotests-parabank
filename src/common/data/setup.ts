export const ENV = process.env.ENV ?? 'dev';
export const TENANT = process.env.TENANT ?? 'parabank';
export const BASE_URL = process.env.BASE_URL ?? 'https://parabank.parasoft.com/parabank';

export const URLS = {
  client: BASE_URL,
  admin: `${BASE_URL}/admin.htm`,
};
