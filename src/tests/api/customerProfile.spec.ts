import { test, expect, qase } from '@src/tests/baseTest';
import {
  INVALID_CUSTOMER_IDS,
  MISSING_UPDATE_PARAMS,
  UNKNOWN_CUSTOMER_IDS,
  generateCustomer,
  toCustomerResponse,
} from '@src/common/domains/customer/data';
import { CustomerResponseSchema } from '@src/common/domains/customer/schemas';
import { CUSTOMER_ERRORS, CUSTOMER_UPDATE_SUCCESS, PAGE_TITLES } from '@src/common/data/testData';

test.describe('Customer profile', () => {
  test('Get customer details by id', async ({ customerService, registeredCustomer }) => {
    qase.id(22);
    qase.fields({ severity: 'critical', priority: 'high', layer: 'api' });

    await test.step("Get the customer's details", async () => {
      const response = await customerService.getCustomer(registeredCustomer.response.id);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');

      const body: unknown = await response.json();
      expect(body).toMatchSchema(CustomerResponseSchema);
      expect(body).toEqual(
        toCustomerResponse(registeredCustomer.data, registeredCustomer.response.id),
      );
    });
  });

  // One test per kind of id that belongs to no customer
  for (const { name, id } of UNKNOWN_CUSTOMER_IDS) {
    test(`Unknown customer id is rejected: ${name}`, async ({ customerService }) => {
      qase.id(23);
      qase.fields({ severity: 'major', priority: 'medium', layer: 'api' });
      // The results of this case differ in Qase by this parameter
      qase.parameters({ Id: name });

      await test.step(`Get the details of an unknown customer id: ${name}`, async () => {
        const response = await customerService.getCustomer(id);
        expect(response.status()).toBe(400);
        expect(response.headers()['content-type']).toContain('text/plain');
        expect(await response.text()).toBe(CUSTOMER_ERRORS.notFound(id));
      });
    });
  }

  // One test per kind of id that is not an int32
  for (const { name, id } of INVALID_CUSTOMER_IDS) {
    test(`Invalid customer id format returns 404: ${name}`, async ({ customerService }) => {
      qase.id(24);
      qase.fields({ severity: 'minor', priority: 'low', layer: 'api' });
      // The results of this case differ in Qase by this parameter
      qase.parameters({ Id: name });

      await test.step(`Get the details of an invalid customer id: ${name}`, async () => {
        const response = await customerService.getCustomer(id);
        expect(response.status()).toBe(404);
        expect(await response.text()).toBe('');
      });
    });
  }

  // Every update goes only to the test's own customer (registeredCustomer.response.id):
  // the server does not check whose id it is (docs/parabank-api.md, section 7)
  test('Update customer contact info', async ({ customerService, registeredCustomer }) => {
    qase.id(25);
    qase.fields({ severity: 'critical', priority: 'high', layer: 'api' });

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
      qase.id(26);
      qase.fields({ severity: 'major', priority: 'medium', layer: 'api' });
      // The results of this case differ in Qase by this parameter
      qase.parameters({ Parameter: missingParam });

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
    qase.id(27);
    qase.fields({ severity: 'major', priority: 'medium', layer: 'api' });

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
