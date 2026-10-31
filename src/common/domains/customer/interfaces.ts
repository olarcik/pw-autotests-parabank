import { z } from 'zod';
import { CustomerResponseSchema } from './schemas';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface User {
  firstName: string;
  lastName: string;
  address: Address;
  phoneNumber: string;
  ssn: string;
  username: string;
  password: string;
}

// Parsed body of a REST response (not Playwright's APIResponse), inferred from its Zod schema
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;
