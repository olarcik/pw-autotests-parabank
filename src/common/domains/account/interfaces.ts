import { z } from 'zod';
import { AccountResponseSchema } from './schemas';

// Parsed body of a REST response (not Playwright's APIResponse), inferred from its Zod schema
export type AccountResponse = z.infer<typeof AccountResponseSchema>;
