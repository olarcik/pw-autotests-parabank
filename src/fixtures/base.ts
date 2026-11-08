import { test, Page } from '@playwright/test';
import { RequestHandler } from '@src/common/api/requestHandler';
import { AccountsOverviewPage } from '@src/pages/accountsOverviewPage';
import { MainPage } from '@src/pages/mainPage';
import { RegisterPage } from '@src/pages/registerPage';
import { UpdateProfilePage } from '@src/pages/updateProfilePage';
import { AccountService } from '@src/services/accountService';
import { CustomerService } from '@src/services/customerService';
import { apiFixture } from './apiFixture';
import { RegisteredCustomer, registeredCustomerFixture } from './customerFixtures';

const pagesMap = {
  mainPage: MainPage,
  registerPage: RegisterPage,
  accountsOverviewPage: AccountsOverviewPage,
  updateProfilePage: UpdateProfilePage,
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
  // See apiFixture.ts
  api: RequestHandler;
  // See customerFixtures.ts
  registeredCustomer: RegisteredCustomer;
};

export const baseTest = pageTest.extend<ApiFixtures>({
  api: apiFixture,

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

  registeredCustomer: registeredCustomerFixture,
});

export { baseTest as test };
