import { z } from 'zod';

// Shape of ParaBank REST responses with Accept: application/json (docs/parabank-api.md, section 6)

// GET /accounts/{id}; GET /customers/{id}/accounts returns an array of them
export const AccountResponseSchema = z.object({
  id: z.int(),
  customerId: z.int(),
  type: z.enum(['CHECKING', 'SAVINGS', 'LOAN']),
  balance: z.number(),
});
