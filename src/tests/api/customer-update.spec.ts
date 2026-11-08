import { test, expect } from '@src/tests/baseTest';
import {
  MISSING_UPDATE_PARAMS,
  generateCustomer,
  toCustomerResponse,
} from '@src/common/domains/customer/data';
import { CustomerResponseSchema } from '@src/common/domains/customer/schemas';
import { CUSTOMER_UPDATE_SUCCESS, PAGE_TITLES } from '@src/common/data/testData';

// Every update goes only to the test's own customer (registeredCustomer.response.id):
// the server does not check whose id it is (docs/parabank-api.md, section 7)
test.describe('Customer update', () => {
  test('Update customer contact info', async ({ customerService, registeredCustomer }) => {
    const { id } = registeredCustomer.response;
    const { username, password } = registeredCustomer.data;
    const newData = generateCustomer({ username, password });

    await test.step("Update the customer's contact info", async () => {
      const response = await customerService.updateCustomer(id, newData);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(await response.text()).toBe(CUSTOMER_UPDATE_SUCCESS);
    });

    await test.step("Check the customer's details show the new values", async () => {
      const response = await customerService.getCustomer(id);
      expect(response.status()).toBe(200);

      const body: unknown = await response.json();
      expect(body).toMatchSchema(CustomerResponseSchema);
      expect(body).toEqual(toCustomerResponse(newData, id));
    });
  });

  // One test per left-out param; every param is required, so nothing may change
  for (const missingParam of MISSING_UPDATE_PARAMS) {
    test(`Update without a required parameter is rejected: ${missingParam}`, async ({
      customerService,
      registeredCustomer,
    }) => {
      const { id } = registeredCustomer.response;
      const { username, password } = registeredCustomer.data;

      await test.step(`Update the customer without ${missingParam}`, async () => {
        const response = await customerService.updateCustomer(
          id,
          generateCustomer({ username, password }),
          missingParam,
        );
        expect(response.status()).toBe(500);
        expect(response.headers()['content-type']).toContain('text/html');
        expect(await response.text()).toContain(`<title>${PAGE_TITLES.error}</title>`);
      });

      await test.step('Check the customer is unchanged', async () => {
        const response = await customerService.getCustomer(id);
        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual(toCustomerResponse(registeredCustomer.data, id));
        expect((await customerService.login(registeredCustomer.data)).status()).toBe(200);
      });
    });
  }

  test("Update with another customer's username is rejected", async ({
    customerService,
    registeredCustomer,
  }) => {
    const { id } = registeredCustomer.response;
    const anotherCustomer = generateCustomer();

    await test.step('Register another customer', async () => {
      const response = await customerService.registerCustomer(anotherCustomer);
      expect(await response.text()).toContain(`<title>${PAGE_TITLES.customerCreated}</title>`);
    });

    await test.step("Update the customer with the other customer's username", async () => {
      const response = await customerService.updateCustomer(
        id,
        generateCustomer({
          username: anotherCustomer.username,
          password: registeredCustomer.data.password,
        }),
      );
      expect(response.status()).toBe(500);
      expect(response.headers()['content-type']).toContain('text/html');
      expect(await response.text()).toContain(`<title>${PAGE_TITLES.error}</title>`);
    });

    await test.step('Check the customer is unchanged', async () => {
      const response = await customerService.getCustomer(id);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual(toCustomerResponse(registeredCustomer.data, id));
      expect((await customerService.login(registeredCustomer.data)).status()).toBe(200);
    });
  });
});
