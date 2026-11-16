import { check } from 'k6';
import http from 'k6/http';
import { BASE_URL } from './config.ts';
import { CUSTOMER_FIELDS, REGISTER_SUCCESS_TEXT, USERNAME_PREFIX } from './data.ts';

export interface PerfCustomer {
  username: string;
  password: string;
}

// Registers a new customer through the register.htm form (ParaBank has no REST method for it).
// The GET creates the session the POST needs; both run in one VU, so its cookie jar keeps
// JSESSIONID. No retries: a failed registration (also the known server flake) fails the run.
export function registerCustomer(): PerfCustomer {
  const username = `${USERNAME_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const { password } = CUSTOMER_FIELDS;
  const url = `${BASE_URL}/register.htm`;

  http.get(url, { tags: { name: 'GET /register.htm' } });
  const res = http.post(
    url,
    {
      'customer.firstName': CUSTOMER_FIELDS.firstName,
      'customer.lastName': CUSTOMER_FIELDS.lastName,
      'customer.address.street': CUSTOMER_FIELDS.street,
      'customer.address.city': CUSTOMER_FIELDS.city,
      'customer.address.state': CUSTOMER_FIELDS.state,
      'customer.address.zipCode': CUSTOMER_FIELDS.zipCode,
      'customer.phoneNumber': CUSTOMER_FIELDS.phoneNumber,
      'customer.ssn': CUSTOMER_FIELDS.ssn,
      'customer.username': username,
      'customer.password': password,
      repeatedPassword: password,
    },
    { tags: { name: 'POST /register.htm' } },
  );

  check(res, {
    'register: customer created': (r) =>
      typeof r.body === 'string' && r.body.includes(REGISTER_SUCCESS_TEXT),
  });

  return { username, password };
}
