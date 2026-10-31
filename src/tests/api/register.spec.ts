import { test, expect, qase } from '../baseTest';
import { generateCustomer } from '../../common/domains/customer/data';
import { AccountResponse } from '../../common/domains/account/interfaces';
import { AccountResponseSchema } from '../../common/domains/account/schemas';
import { CustomerResponse } from '../../common/domains/customer/interfaces';
import { CustomerResponseSchema } from '../../common/domains/customer/schemas';
import { NEW_CUSTOMER_ACCOUNT, PAGE_TITLES } from '../../common/data/test';

test.describe('Registration', () => {
  test('Successful registration via API', async ({ customerService, accountService }) => {
    qase.id(13);
    qase.fields({ severity: 'critical', priority: 'high', layer: 'api' });

    const customer = generateCustomer();

    await test.step('Register a new customer', async () => {
      await customerService.openRegisterForm();
      const response = await customerService.submitRegisterForm(customer);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');
      expect(await response.text()).toContain(`<title>${PAGE_TITLES.customerCreated}</title>`);
    });

    const customerResponse = await test.step('Log in as the new customer', async () => {
      const response = await customerService.login(customer);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');

      const body: unknown = await response.json();
      expect(body).toMatchSchema(CustomerResponseSchema);
      expect(body).toEqual({
        id: expect.any(Number),
        firstName: customer.firstName,
        lastName: customer.lastName,
        address: customer.address,
        phoneNumber: customer.phoneNumber,
        ssn: customer.ssn,
      });
      return body as CustomerResponse;
    });

    await test.step('Check the default account', async () => {
      const response = await accountService.getAccounts(customerResponse.id);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');

      const body: unknown = await response.json();
      expect(body).toMatchSchema(AccountResponseSchema.array().length(1));
      const [account] = body as AccountResponse[];
      expect(account).toEqual({
        id: expect.any(Number),
        customerId: customerResponse.id,
        ...NEW_CUSTOMER_ACCOUNT,
      });
    });
  });
});
