import { test as base } from '@playwright/test';
import { MainPage } from '../pages/client/mainPage';
import { LoginPage } from '../pages/client/loginPage';

type Fixtures = {
  mainPage: MainPage;
  loginPage: LoginPage;
};

export const test = base.extend<Fixtures>({
  mainPage: async ({ page }, use) => {
    await use(new MainPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from '@playwright/test';
