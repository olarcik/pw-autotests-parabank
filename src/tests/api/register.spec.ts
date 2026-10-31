import { test, expect, qase } from '../baseTest';
import { generateUser } from '../../common/domains/customer/data';
import {
  getAccounts,
  login,
  openRegisterForm,
  submitRegisterForm,
} from '../../common/domains/customer/api';
import { Account, Customer } from '../../common/domains/customer/interfaces';
import { AccountSchema, CustomerSchema } from '../../common/domains/customer/schemas';
import { NEW_CUSTOMER_ACCOUNT, PAGE_TITLES } from '../../common/data/test';

test.describe('Registration', () => {
  test('Successful registration via API', async ({ api }) => {
    qase.id(13);
    qase.fields({ severity: 'critical', priority: 'high', layer: 'api' });

    const user = generateUser();

    await test.step('Register a new customer', async () => {
      await openRegisterForm(api);
      const response = await submitRegisterForm(api, user);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');
      expect(await response.text()).toContain(`<title>${PAGE_TITLES.customerCreated}</title>`);
    });

    const customer = await test.step('Log in as the new customer', async () => {
      const response = await login(api, user);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');

      const body: unknown = await response.json();
      expect(body).toMatchSchema(CustomerSchema);
      expect(body).toEqual({
        id: expect.any(Number),
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        phoneNumber: user.phoneNumber,
        ssn: user.ssn,
      });
      return body as Customer;
    });

    await test.step('Check the default account', async () => {
      const response = await getAccounts(api, customer.id);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');

      const body: unknown = await response.json();
      expect(body).toMatchSchema(AccountSchema.array().length(1));
      const [account] = body as Account[];
      expect(account).toEqual({
        id: expect.any(Number),
        customerId: customer.id,
        ...NEW_CUSTOMER_ACCOUNT,
      });
    });
  });
});
