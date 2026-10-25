import { test, expect, qase } from '../baseTest';
import { generateUser } from '../../common/domains/user/data';
import {
  getAccounts,
  login,
  openRegisterForm,
  submitRegisterForm,
} from '../../common/domains/user/api';
import { Account, Customer } from '../../common/domains/user/interfaces';
import { AccountSchema, CustomerSchema } from '../../common/domains/user/schemas';
import { NEW_CUSTOMER_ACCOUNT, PAGE_TITLES } from '../../common/data/test';

test.describe('Registration', () => {
  test('Successful registration via API', async ({ request }) => {
    qase.id(13);
    qase.fields({ severity: 'critical', priority: 'high', layer: 'api' });

    const user = generateUser();
    let sessionId: string | undefined;
    let customer: Customer;

    await test.step('Open the registration form: GET /register.htm', async () => {
      const response = await openRegisterForm(request);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');

      sessionId = (await request.storageState()).cookies.find(
        (cookie) => cookie.name === 'JSESSIONID',
      )?.value;
      expect(sessionId).toBeTruthy();
      expect(response.headers()['set-cookie']).toContain(`JSESSIONID=${sessionId}`);
    });

    const submitResponse =
      await test.step('Submit the form with valid data: POST /register.htm in the same session', async () => {
        const response = await submitRegisterForm(request, user);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('text/html');

        // The server accepted the session cookie from the GET: it started no new session
        expect(response.headers()['set-cookie'] ?? '').not.toContain('JSESSIONID=');
        const cookies = (await request.storageState()).cookies;
        expect(cookies.find((cookie) => cookie.name === 'JSESSIONID')?.value).toBe(sessionId);
        return response;
      });

    await test.step('Check the registration result', async () => {
      expect(await submitResponse.text()).toContain(
        `<title>${PAGE_TITLES.customerCreated}</title>`,
      );
    });

    await test.step('Log in via REST: GET /login/{username}/{password}', async () => {
      const response = await login(request, user);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');

      const body: unknown = await response.json();
      expect(body).toMatchSchema(CustomerSchema);
      customer = body as Customer;
      expect(customer).toEqual({
        id: expect.any(Number),
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        phoneNumber: user.phoneNumber,
        ssn: user.ssn,
      });
    });

    await test.step("Get the customer's accounts: GET /customers/{id}/accounts", async () => {
      const response = await getAccounts(request, customer.id);
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
