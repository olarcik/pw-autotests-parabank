import { URLS } from '../data/setup';

// All paths the tests call (docs/parabank-api.md). REST paths are relative to URLS.api and go through
// RequestHandler.path(); the register.htm form is not REST, so it is a full URL for RequestHandler.url().
export const endpoints = {
  // Credentials go in the path, so both parts are URL-encoded
  login: (username: string, password: string) =>
    `/login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`,
  customer: (customerId: number) => `/customers/${customerId}`,
  customerAccounts: (customerId: number) => `/customers/${customerId}/accounts`,
  account: (accountId: number) => `/accounts/${accountId}`,
  accountTransactions: (accountId: number) => `/accounts/${accountId}/transactions`,
  transaction: (transactionId: number) => `/transactions/${transactionId}`,
  register: `${URLS.client}/register.htm`,
};
