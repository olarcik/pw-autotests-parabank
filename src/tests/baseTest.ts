import { test, Page } from '@playwright/test';
import { MainPage } from '../pages/client/mainPage';

const pagesMap = {
  mainPage: MainPage,
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
export const baseTest = test.extend<PageFixtures>({
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

export { baseTest as test };
export { expect } from '@playwright/test';
export { qase } from 'playwright-qase-reporter';
