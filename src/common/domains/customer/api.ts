import { endpoints } from '../../api/endpoints';
import { RequestHandler } from '../../api/requestHandler';
import { Customer } from './interfaces';

// Registration has no REST method: it goes through the register.htm form (docs/parabank-api.md, section 5).
// Helpers only send requests and return the responses; tests assert them. They never retry: the false
// "This username already exists." is absorbed by `retries` in playwright.config.ts (Known issues in CLAUDE.md).

// GET is required before the POST: it creates the session (JSESSIONID cookie kept by `request`)
export const openRegisterForm = (api: RequestHandler) => api.url(endpoints.register).get();

// Must run in the session of openRegisterForm, otherwise ParaBank answers 500
export const submitRegisterForm = (api: RequestHandler, customer: Customer) =>
  api
    .url(endpoints.register)
    .form({
      'customer.firstName': customer.firstName,
      'customer.lastName': customer.lastName,
      'customer.address.street': customer.address.street,
      'customer.address.city': customer.address.city,
      'customer.address.state': customer.address.state,
      'customer.address.zipCode': customer.address.zipCode,
      'customer.phoneNumber': customer.phoneNumber,
      'customer.ssn': customer.ssn,
      'customer.username': customer.username,
      'customer.password': customer.password,
      repeatedPassword: customer.password,
    })
    .post();

// Both requests in one call, for tests that only need a registered customer; returns the POST response
export const registerViaForm = async (api: RequestHandler, customer: Customer) => {
  await openRegisterForm(api);
  return submitRegisterForm(api, customer);
};

export const login = (api: RequestHandler, customer: Customer) =>
  api.path(endpoints.login(customer.username, customer.password)).get();

export const getAccounts = (api: RequestHandler, customerId: number) =>
  api.path(endpoints.customerAccounts(customerId)).get();
