import { test as base } from '@playwright/test';
import { MainPage } from '../pages/client/mainPage';

type Fixtures = {
  mainPage: MainPage;
};

export const test = base.extend<Fixtures>({
  mainPage: async ({ page }, use) => {
    await use(new MainPage(page));
  },
});

export { expect } from '@playwright/test';
