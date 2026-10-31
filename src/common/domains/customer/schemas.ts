import { z } from 'zod';

// Shapes of ParaBank REST responses with Accept: application/json (docs/parabank-api.md, section 6)

export const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
});

// GET /login/{username}/{password} and GET /customers/{id}; never contains username or password
export const CustomerSchema = z.object({
  id: z.int(),
  firstName: z.string(),
  lastName: z.string(),
  address: AddressSchema,
  phoneNumber: z.string(),
  ssn: z.string(),
});
