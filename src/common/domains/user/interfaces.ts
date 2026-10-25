import { z } from 'zod';
import { AccountSchema, CustomerSchema } from './schemas';

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

// REST response types are inferred from the Zod schemas, so they never drift from them
export type Customer = z.infer<typeof CustomerSchema>;
export type Account = z.infer<typeof AccountSchema>;
