import { APIRequestContext, test } from '@playwright/test';

type Params = Record<string, string | number | boolean>;
type Headers = Record<string, string>;
type Method = 'GET' | 'POST';

// One request and its response as kept in the log; secrets are already masked
export interface Exchange {
  method: Method;
  // "METHOD /path", also the step title
  title: string;
  url: string;
  headers: Headers;
  params: Params;
  form?: Params;
  body?: unknown;
  status?: number;
  contentType?: string;
  responseBody?: string;
}

// Longest response body kept in the log
const MAX_BODY_LENGTH = 5000;

// Entry point of the HTTP layer (docs/parabank-api.md). It keeps no request state: every path() or
// url() call returns a new builder, so headers, params and bodies never leak between requests or tests.
// path() targets the REST base and sends Accept: application/json (without it ParaBank answers XML);
// url() takes a full address (e.g. the register.htm form) and sends only the headers set on it.
// `log` records every exchange for diagnostics only; the api fixture attaches it when a test fails.
export class RequestHandler {
  readonly log: Exchange[] = [];
  private readonly request: APIRequestContext;
  private readonly baseUrl: string;

  constructor(request: APIRequestContext, baseUrl: string) {
    this.request = request;
    this.baseUrl = baseUrl;
  }

  path(path: string) {
    return new RequestBuilder(this.request, this.log, `${this.baseUrl}${path}`, path, {
      Accept: 'application/json',
    });
  }

  url(url: string) {
    return new RequestBuilder(this.request, this.log, url, new URL(url).pathname, {});
  }
}

// One request. Terminal methods return the raw APIResponse: no status checks, no parsing, no retries —
// tests assert the response. Each request is a report step "METHOD /path".
class RequestBuilder {
  private readonly request: APIRequestContext;
  private readonly log: Exchange[];
  private readonly url: string;
  // Path shown in the step title: relative to the REST base for path(), the URL pathname for url()
  private readonly path: string;
  private requestHeaders: Headers;
  private requestParams: Params = {};
  private formData?: Params;
  private jsonBody?: unknown;

  constructor(
    request: APIRequestContext,
    log: Exchange[],
    url: string,
    path: string,
    headers: Headers,
  ) {
    this.request = request;
    this.log = log;
    this.url = url;
    this.path = path;
    this.requestHeaders = headers;
  }

  params(params: Params) {
    this.requestParams = { ...this.requestParams, ...params };
    return this;
  }

  headers(headers: Headers) {
    this.requestHeaders = { ...this.requestHeaders, ...headers };
    return this;
  }

  // application/x-www-form-urlencoded body
  form(form: Params) {
    this.formData = form;
    return this;
  }

  // JSON body
  body(body: unknown) {
    this.jsonBody = body;
    return this;
  }

  get() {
    return this.send('GET');
  }

  post() {
    return this.send('POST');
  }

  private send(method: Method) {
    const options = {
      headers: this.requestHeaders,
      params: this.requestParams,
      form: this.formData,
      data: this.jsonBody,
    };
    // Logged before sending, so a request that throws is still in the log
    const exchange: Exchange = mask({
      method,
      title: `${method} ${this.path}`,
      url: this.url,
      headers: this.requestHeaders,
      params: this.requestParams,
      form: this.formData,
      body: this.jsonBody,
    }) as Exchange;
    this.log.push(exchange);

    return test.step(exchange.title, async () => {
      const response =
        method === 'GET'
          ? await this.request.get(this.url, options)
          : await this.request.post(this.url, options);

      const text = await response.text();
      exchange.status = response.status();
      exchange.contentType = response.headers()['content-type'];
      exchange.responseBody =
        text.length > MAX_BODY_LENGTH
          ? `${text.slice(0, MAX_BODY_LENGTH)}… (${text.length} chars)`
          : text;
      return response;
    });
  }
}

// Hides secrets: the password in a login path and the value of every field whose name contains
// "password" (password, repeatedPassword, customer.password), at any depth
const mask = (value: unknown): unknown => {
  if (typeof value === 'string') return value.replace(/(\/login\/[^/]+\/)[^/?#]+/, '$1***');
  if (Array.isArray(value)) return value.map(mask);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, field]) => [
        key,
        /password/i.test(key) ? '***' : mask(field),
      ]),
    );
  }
  return value;
};

// Files for the report of a failed test: "<NN> <METHOD> <path> request.json" and
// "<NN> <METHOD> <path> response.<json|html|txt>" (the latter only if a response came); the request
// file also holds the response status and content type. NN is the 1-based position in the log, so
// repeated requests get their own files
export const exchangeAttachments = (
  { title, status, contentType, responseBody, ...request }: Exchange,
  position: number,
) => {
  // The Qase reporter saves attachments under their names, so characters not allowed in file names
  // become "_": "GET /login/qa_x/***" → "01 GET _login_qa_x____"
  const fileName = `${String(position).padStart(2, '0')} ${title.replace(/[\\/:*?"<>|]/g, '_')}`;
  const attachments = [
    {
      name: `${fileName} request.json`,
      contentType: 'application/json',
      body: JSON.stringify({ ...request, response: { status, contentType } }, null, 2),
    },
  ];
  if (responseBody !== undefined) {
    const extension = contentType?.includes('json')
      ? 'json'
      : contentType?.includes('html')
        ? 'html'
        : 'txt';
    attachments.push({
      name: `${fileName} response.${extension}`,
      contentType: contentType ?? 'text/plain',
      body: responseBody,
    });
  }
  return attachments;
};
