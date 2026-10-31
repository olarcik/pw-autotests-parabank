import { test, expect as baseExpect, Page } from '@playwright/test';
import { z } from 'zod';
import { exchangeAttachments } from '../common/api/exchangeLog';
import { RequestHandler } from '../common/api/requestHandler';
import { PAGE_TITLES } from '../common/data/test';
import { URLS } from '../common/data/setup';
import { generateCustomer } from '../common/domains/customer/data';
import { Customer, CustomerResponse } from '../common/domains/customer/interfaces';
import { CustomerResponseSchema } from '../common/domains/customer/schemas';
import { MainPage } from '../pages/client/mainPage';
import { RegisterPage } from '../pages/client/registerPage';
import { AccountService } from '../services/accountService';
import { CustomerService } from '../services/customerService';

const pagesMap = {
  mainPage: MainPage,
  registerPage: RegisterPage,
  // add more page mappings here as needed
};

// Dynamically derive fixture types from pagesMap
type PageFixtures = {
  [Key in keyof typeof pagesMap]: InstanceType<(typeof pagesMap)[Key]>;
};

// This will create a type that maps each key in pagesMap to its corresponding class instance
// For example, if pagesMap has a key 'mainPage' with class MainPage,
// PageFixtures['mainPage'] will be of type MainPage.
// This allows us to use the fixtures in tests with proper type checking.
const pageTest = test.extend<PageFixtures>({
  ...Object.entries(pagesMap).reduce(
    (fixtures, [key, pageClass]) => {
      fixtures[key] = async ({ page }, use) => {
        await use(new (pageClass as new (p: Page) => unknown)(page));
      };

      return fixtures;
    },
    {} as Record<
      string,
      (opts: { page: Page }, use: (instance: unknown) => Promise<void>) => Promise<void>
    >,
  ),
});

const servicesMap = {
  customerService: CustomerService,
  accountService: AccountService,
  // add more services here as needed
};

// Dynamically derive fixture types from servicesMap, the same way as PageFixtures from pagesMap
type ServiceFixtures = {
  [Key in keyof typeof servicesMap]: InstanceType<(typeof servicesMap)[Key]>;
};

type ApiFixtures = ServiceFixtures & {
  // HTTP client on the REST base; built on `request`, so one test keeps its session cookies and
  // tests never share them
  api: RequestHandler;
  // A new customer registered through the form and logged in via REST to get its id. Lazy: registers
  // one only in tests that ask for it. Registration tests don't use it, they check registration
  // themselves. The browser is not logged in. No retries inside: the false "username already exists"
  // is left to `retries`.
  registeredCustomer: { data: Customer; response: CustomerResponse };
};

export const baseTest = pageTest.extend<ApiFixtures>({
  api: async ({ request }, use, testInfo) => {
    const api = new RequestHandler(request, URLS.api);
    await use(api);

    // Request/response files only for a failed attempt; each retry has its own testInfo
    if (testInfo.status !== testInfo.expectedStatus) {
      const attachments = api.log.flatMap((exchange, index) =>
        exchangeAttachments(exchange, index + 1),
      );
      for (const { name, body, contentType } of attachments) {
        await testInfo.attach(name, { body, contentType });
      }
    }
  },

  // Object.entries loses the class types; ServiceFixtures restores them for tests
  ...Object.entries(servicesMap).reduce(
    (fixtures, [key, serviceClass]) => {
      fixtures[key] = async ({ api }, use) => {
        await use(new (serviceClass as new (a: RequestHandler) => unknown)(api));
      };

      return fixtures;
    },
    {} as Record<
      string,
      (opts: { api: RequestHandler }, use: (instance: unknown) => Promise<void>) => Promise<void>
    >,
  ),

  registeredCustomer: async ({ customerService }, use) => {
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
  },
});

export { baseTest as test };

// Custom matchers; their types are inferred by expect.extend, so specs get them from this `expect`
export const expect = baseExpect.extend({
  // Validates a value (e.g. a parsed JSON body) against a Zod schema and lists every issue on failure
  toMatchSchema(received: unknown, schema: z.ZodType) {
    const result = schema.safeParse(received);
    const hint = this.utils.matcherHint('toMatchSchema', undefined, undefined, {
      isNot: this.isNot,
    });

    return {
      name: 'toMatchSchema',
      pass: result.success,
      message: () =>
        result.success
          ? `${hint}\n\nExpected value not to match the schema, but it does`
          : `${hint}\n\nSchema issues:\n${z.prettifyError(result.error)}\n\n` +
            `Received: ${this.utils.printReceived(received)}`,
    };
  },
});

export { qase } from 'playwright-qase-reporter';
