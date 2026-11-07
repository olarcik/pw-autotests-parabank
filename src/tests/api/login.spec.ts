import { test, expect, qase } from '@src/tests/baseTest';
import { generateCustomer } from '@src/common/domains/customer/data';
import { Customer } from '@src/common/domains/customer/interfaces';
import { LOGIN_ERRORS } from '@src/common/data/testData';

test.describe('Login', () => {
  // One test per kind of invalid credentials; each row changes the registered customer's data
  for (const { row, credentials } of [
    {
      row: 'wrong password',
      credentials: (customer: Customer) => ({
        ...customer,
        password: generateCustomer().password,
      }),
    },
    {
      row: 'unknown user',
      credentials: (customer: Customer) => ({
        ...customer,
        username: generateCustomer().username,
      }),
    },
    {
      row: 'username in another case',
      credentials: (customer: Customer) => ({
        ...customer,
        username: customer.username.toUpperCase(),
      }),
    },
  ]) {
    test(`Invalid login is rejected: ${row}`, async ({ customerService, registeredCustomer }) => {
      qase.id(14);
      qase.fields({ severity: 'major', priority: 'high', layer: 'api' });
      // The results of this case differ in Qase by this parameter
      qase.parameters({ Credentials: row });

      await test.step(`Log in with invalid credentials: ${row}`, async () => {
        const response = await customerService.login(credentials(registeredCustomer.data));
        expect(response.status()).toBe(400);
        expect(response.headers()['content-type']).toContain('text/plain');
        expect(await response.text()).toBe(LOGIN_ERRORS.api);
      });
    });
  }
});
