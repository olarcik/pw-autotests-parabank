import { APIRequestContext } from '@playwright/test';
import { apiGet } from '../../api/base';
import { URLS } from '../../data/setup';
import { User } from './interfaces';

// Registration has no REST method: it goes through the register.htm form (docs/parabank-api.md, section 5).
// Helpers only send requests and return the responses; tests assert them. They never retry: the false
// "This username already exists." is absorbed by `retries` in playwright.config.ts (Known issues in CLAUDE.md).

// GET is required before the POST: it creates the session (JSESSIONID cookie kept by `request`)
export const openRegisterForm = (request: APIRequestContext) =>
  request.get(`${URLS.client}/register.htm`);

// Must run in the session of openRegisterForm, otherwise ParaBank answers 500
export const submitRegisterForm = (request: APIRequestContext, user: User) =>
  request.post(`${URLS.client}/register.htm`, {
    form: {
      'customer.firstName': user.firstName,
      'customer.lastName': user.lastName,
      'customer.address.street': user.address.street,
      'customer.address.city': user.address.city,
      'customer.address.state': user.address.state,
      'customer.address.zipCode': user.address.zipCode,
      'customer.phoneNumber': user.phoneNumber,
      'customer.ssn': user.ssn,
      'customer.username': user.username,
      'customer.password': user.password,
      repeatedPassword: user.password,
    },
  });

// Both requests in one call, for tests that only need a registered customer; returns the POST response
export const registerViaForm = async (request: APIRequestContext, user: User) => {
  await openRegisterForm(request);
  return submitRegisterForm(request, user);
};

export const login = (request: APIRequestContext, user: User) =>
  apiGet(
    request,
    `/login/${encodeURIComponent(user.username)}/${encodeURIComponent(user.password)}`,
  );

export const getAccounts = (request: APIRequestContext, customerId: number) =>
  apiGet(request, `/customers/${customerId}/accounts`);
