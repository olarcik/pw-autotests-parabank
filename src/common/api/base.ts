import { APIRequestContext } from '@playwright/test';
import { URLS } from '../data/setup';

// Thin transport for the ParaBank REST API (docs/parabank-api.md). Accept is required: without it
// every endpoint answers XML. Returns the response as is: no retries, no checks — tests assert it.
export const apiGet = (request: APIRequestContext, path: string) =>
  request.get(`${URLS.api}${path}`, { headers: { Accept: 'application/json' } });
