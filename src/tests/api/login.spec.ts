import { test, expect, qase } from '@src/tests/baseTest';
import { INVALID_CREDENTIALS } from '@src/common/domains/customer/data';
import { LOGIN_ERRORS } from '@src/common/data/testData';

test.describe('Login', () => {
  // One test per kind of invalid credentials; each row changes the registered customer's data
  for (const { name, credentials } of INVALID_CREDENTIALS) {
    test(`Invalid login is rejected: ${name}`, async ({ customerService, registeredCustomer }) => {
      qase.id(14);
      qase.fields({ severity: 'major', priority: 'high', layer: 'api' });
      // The results of this case differ in Qase by this parameter
      qase.parameters({ Credentials: name });

      await test.step(`Log in with invalid credentials: ${name}`, async () => {
        const response = await customerService.login(credentials(registeredCustomer.data));
        expect(response.status()).toBe(400);
        expect(response.headers()['content-type']).toContain('text/plain');
        expect(await response.text()).toBe(LOGIN_ERRORS.api);
      });
    });
  }
});
