import { expect as baseExpect } from '@playwright/test';
import { z } from 'zod';
import { PAGE_TITLES } from '@src/common/data/testData';
import { generateCustomer } from '@src/common/domains/customer/data';
import { Customer, CustomerResponse } from '@src/common/domains/customer/interfaces';
import { CustomerResponseSchema } from '@src/common/domains/customer/schemas';
import { CustomerService } from '@src/services/customerService';

export type RegisteredCustomer = { data: Customer; response: CustomerResponse };

// A new customer registered through the form and logged in via REST to get its id. Lazy: registers
// one only in tests that ask for it. Registration tests don't use it, they check registration
// themselves. The browser is not logged in. No retries inside: the false "username already exists"
// is left to `retries`.
export async function registeredCustomerFixture(
  { customerService }: { customerService: CustomerService },
  use: (customer: RegisteredCustomer) => Promise<void>,
): Promise<void> {
  const customer = generateCustomer();

  const registerResponse = await customerService.registerCustomer(customer);
  baseExpect(
    await registerResponse.text(),
    `registeredCustomer fixture: registration of ${customer.username} did not open "${PAGE_TITLES.customerCreated}"`,
  ).toContain(`<title>${PAGE_TITLES.customerCreated}</title>`);

  const loginResponse = await customerService.login(customer);
  baseExpect(
    loginResponse.status(),
    `registeredCustomer fixture: REST login of ${customer.username} failed: ${await loginResponse.text()}`,
  ).toBe(200);
  const parsed = CustomerResponseSchema.safeParse(await loginResponse.json());
  if (!parsed.success) {
    throw new Error(
      `registeredCustomer fixture: login response does not match CustomerResponseSchema\n${z.prettifyError(parsed.error)}`,
    );
  }

  await use({ data: customer, response: parsed.data });
}
