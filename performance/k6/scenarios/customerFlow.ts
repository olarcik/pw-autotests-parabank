import { check } from 'k6';
import http from 'k6/http';
import { API_URL, JSON_HEADERS } from '../lib/config.ts';
import type { PerfCustomer } from '../lib/customer.ts';

// Flow of one registered customer. For now only the REST login.
export function customerFlow(customer: PerfCustomer): void {
  const res = http.get(
    `${API_URL}/login/${encodeURIComponent(customer.username)}/${encodeURIComponent(customer.password)}`,
    // Tag names have no braces: they are part of the per-request threshold keys in smoke.ts
    { headers: JSON_HEADERS, tags: { name: 'GET /login/:user/:pass' } },
  );

  check(res, {
    'login: status 200': (r) => r.status === 200,
    'login: numeric id': (r) => r.status === 200 && typeof r.json('id') === 'number',
  });
}
