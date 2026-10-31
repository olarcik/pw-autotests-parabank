import { endpoints } from '../../api/endpoints';
import { RequestHandler } from '../../api/requestHandler';
import { User } from './interfaces';

// Registration has no REST method: it goes through the register.htm form (docs/parabank-api.md, section 5).
// Helpers only send requests and return the responses; tests assert them. They never retry: the false
// "This username already exists." is absorbed by `retries` in playwright.config.ts (Known issues in CLAUDE.md).

// GET is required before the POST: it creates the session (JSESSIONID cookie kept by `request`)
export const openRegisterForm = (api: RequestHandler) => api.url(endpoints.register).get();

// Must run in the session of openRegisterForm, otherwise ParaBank answers 500
export const submitRegisterForm = (api: RequestHandler, user: User) =>
  api
    .url(endpoints.register)
    .form({
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
    })
    .post();

// Both requests in one call, for tests that only need a registered customer; returns the POST response
export const registerViaForm = async (api: RequestHandler, user: User) => {
  await openRegisterForm(api);
  return submitRegisterForm(api, user);
};

export const login = (api: RequestHandler, user: User) =>
  api.path(endpoints.login(user.username, user.password)).get();

export const getAccounts = (api: RequestHandler, customerId: number) =>
  api.path(endpoints.customerAccounts(customerId)).get();
