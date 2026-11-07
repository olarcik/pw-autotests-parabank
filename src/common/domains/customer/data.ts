import { faker } from '@faker-js/faker';
import { Customer, InvalidCredentialsRow } from './interfaces';

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
