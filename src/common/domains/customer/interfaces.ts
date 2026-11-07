import { z } from 'zod';
import { CustomerResponseSchema } from './schemas';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

// Test data of a customer: registration form fields and credentials (the REST body is CustomerResponse)
export interface Customer {
  firstName: string;
  lastName: string;
  address: Address;
  phoneNumber: string;
  ssn: string;
  username: string;
  password: string;
}

// Row of the API test "Invalid login is rejected": `name` is the title suffix and the Qase
// parameter "Credentials"; `credentials` turns a registered customer into credentials to reject
export interface InvalidCredentialsRow {
  name: string;
  credentials: (customer: Customer) => Customer;
}

// Row of the E2E test "Empty fields show error": `name` is the title suffix and the Qase
// parameter "Fields"; `customer` is called inside the test, not when tests are collected
export interface EmptyLoginFieldsRow {
  name: string;
  customer: () => Customer;
}

// Parsed body of a REST response (not Playwright's APIResponse), inferred from its Zod schema
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;
