import { test, expect, qase } from '@src/tests/baseTest';
import { INVALID_CREDENTIALS } from '@src/common/domains/customer/data';
import { CustomerResponseSchema } from '@src/common/domains/customer/schemas';
import { LOGIN_ERRORS } from '@src/common/data/testData';

test.describe('Login', () => {
  test('Successful login with valid credentials', async ({
    customerService,
    registeredCustomer,
  }) => {
    qase.id(21);
    qase.fields({ severity: 'critical', priority: 'high', layer: 'api' });

    await test.step('Log in as the registered customer', async () => {
      const response = await customerService.login(registeredCustomer.data);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');

      const body: unknown = await response.json();
      expect(body).toMatchSchema(CustomerResponseSchema);
      expect(body).toEqual({
        id: registeredCustomer.response.id,
        firstName: registeredCustomer.data.firstName,
        lastName: registeredCustomer.data.lastName,
        address: registeredCustomer.data.address,
        phoneNumber: registeredCustomer.data.phoneNumber,
        ssn: registeredCustomer.data.ssn,
      });
    });
  });

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
