import { faker } from '@faker-js/faker';
import { User } from './interfaces';

// ParaBank is a shared demo, so every generated username must be unique
export const generateUser = (overrides: Partial<User> = {}): User => ({
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
