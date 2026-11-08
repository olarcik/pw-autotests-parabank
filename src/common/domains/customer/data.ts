import { faker } from '@faker-js/faker';
import {
  Customer,
  CustomerIdRow,
  CustomerResponse,
  EmptyLoginFieldsRow,
  InvalidCredentialsRow,
} from './interfaces';

// ParaBank is a shared demo, so every generated username must be unique
export const generateCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode('#####'),
  },
  phoneNumber: faker.string.numeric(10),
  ssn: faker.helpers.replaceSymbols('###-##-####'),
  username: `qa_${faker.string.alphanumeric(8).toLowerCase()}${Date.now().toString(36)}`,
  password: faker.internet.password({ length: 12 }),
  ...overrides,
});

// Invalid credentials built from a registered customer (docs/parabank-api.md: login is case-sensitive)
export const INVALID_CREDENTIALS: InvalidCredentialsRow[] = [
  {
    name: 'wrong password',
    credentials: (customer) => ({ ...customer, password: generateCustomer().password }),
  },
  {
    name: 'unknown user',
    credentials: (customer) => ({ ...customer, username: generateCustomer().username }),
  },
  {
    name: 'username in another case',
    credentials: (customer) => ({ ...customer, username: customer.username.toUpperCase() }),
  },
];

// Login form inputs with one or both fields empty
export const EMPTY_LOGIN_FIELDS: EmptyLoginFieldsRow[] = [
  { name: 'both empty', customer: () => generateCustomer({ username: '', password: '' }) },
  { name: 'only username filled', customer: () => generateCustomer({ password: '' }) },
  { name: 'only password filled', customer: () => generateCustomer({ username: '' }) },
];

// Expected REST body (GET /login/..., GET /customers/{id}) of a customer with this test data and id
export const toCustomerResponse = (customer: Customer, id: number): CustomerResponse => ({
  id,
  firstName: customer.firstName,
  lastName: customer.lastName,
  address: customer.address,
  phoneNumber: customer.phoneNumber,
  ssn: customer.ssn,
});

// Ids of no customer: GET /customers/{id} answers 400 "Could not find customer #<id>"
// (docs/parabank-api.md, section 8)
export const UNKNOWN_CUSTOMER_IDS: CustomerIdRow[] = [
  { name: 'not existing', id: 999999999 },
  { name: 'zero', id: 0 },
  { name: 'negative', id: -1 },
];

// Ids that are not an int32: GET /customers/{id} answers 404 with an empty body
export const INVALID_CUSTOMER_IDS: CustomerIdRow[] = [
  { name: 'not a number', id: 'abc' },
  { name: 'above int32', id: 9999999999 },
];
