import { test, expect as baseExpect, Page } from '@playwright/test';
import { z } from 'zod';
import { MainPage } from '../pages/client/mainPage';
import { RegisterPage } from '../pages/client/registerPage';

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
