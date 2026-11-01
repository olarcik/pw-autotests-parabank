import { ExpectMatcherState } from '@playwright/test';
import { z } from 'zod';

// Custom matchers for expect.extend in baseTest.ts
export const schemaMatchers = {
  // Validates a value (e.g. a parsed JSON body) against a Zod schema and lists every issue on failure
  toMatchSchema(this: ExpectMatcherState, received: unknown, schema: z.ZodType) {
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
};
