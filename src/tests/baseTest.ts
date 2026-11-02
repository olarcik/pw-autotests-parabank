import { expect as baseExpect } from '@playwright/test';
import { schemaMatchers } from '@src/common/utils/matchers';

// The only entry point for specs: `test` with all fixtures, `expect` with custom matchers, `qase`
export { test } from '@src/fixtures/base';

// Custom matchers; their types are inferred by expect.extend, so specs get them from this `expect`
export const expect = baseExpect.extend(schemaMatchers);

export { qase } from 'playwright-qase-reporter';
