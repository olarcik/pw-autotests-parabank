import { sleep } from 'k6';
import { registerCustomer, type PerfCustomer } from '../lib/customer.ts';
import { THINK_TIME_S } from '../lib/data.ts';
import { customerFlow } from './customerFlow.ts';

// The scenario shared by every profile (smoke, load, stress, spike): the profile files hold only
// their options and re-export setup and default from here.

// Runs once before the iterations; the one customer is passed to every VU
export function setup(): PerfCustomer {
  return registerCustomer();
}

export default function (customer: PerfCustomer): void {
  customerFlow(customer);
  sleep(THINK_TIME_S);
}
