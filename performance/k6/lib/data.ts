// Static fields of the customers registered by the performance scripts; only the username is
// unique per customer (built in customer.ts). Never the demo customer john.
export const CUSTOMER_FIELDS = {
  firstName: 'Perf',
  lastName: 'Customer',
  street: '1 Load St',
  city: 'Austin',
  state: 'TX',
  zipCode: '73301',
  phoneNumber: '5551234567',
  ssn: '123-45-6789',
  password: 'PerfPass123',
};

export const USERNAME_PREFIX = 'perf_';

// Text of the page that answers a successful registration (docs/parabank-api.md, section 5)
export const REGISTER_SUCCESS_TEXT = 'Customer Created';
