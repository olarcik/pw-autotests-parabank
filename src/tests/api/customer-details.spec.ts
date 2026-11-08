import { test, expect } from '@src/tests/baseTest';
import {
  INVALID_CUSTOMER_IDS,
  UNKNOWN_CUSTOMER_IDS,
  toCustomerResponse,
} from '@src/common/domains/customer/data';
import { CustomerResponseSchema } from '@src/common/domains/customer/schemas';
import { CUSTOMER_ERRORS } from '@src/common/data/testData';

test.describe('Customer details', () => {
  test('Get customer details by id', async ({ customerService, registeredCustomer }) => {
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
      await test.step(`Get the details of an invalid customer id: ${name}`, async () => {
        const response = await customerService.getCustomer(id);
        expect(response.status()).toBe(404);
        expect(await response.text()).toBe('');
      });
    });
  }
});
