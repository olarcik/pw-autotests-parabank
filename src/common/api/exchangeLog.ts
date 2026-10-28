// Log entries of RequestHandler: masking of secrets and report files for a failed test.
// Imports nothing from requestHandler.ts.

export type Params = Record<string, string | number | boolean>;
export type Headers = Record<string, string>;
export type Method = 'GET' | 'POST';

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

// Hides secrets: the password in a login path and the value of every field whose name contains
// "password" (password, repeatedPassword, customer.password), at any depth
export const mask = (value: unknown): unknown => {
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

// The Qase reporter saves attachments under their names, so the path must be a valid file name:
// "***" → "masked", forbidden characters → "_", repeated "_" collapsed, leading "_" dropped.
// "/login/qa_x/***" → "login_qa_x_masked"
const toFileName = (path: string) =>
  path
    .replaceAll('***', 'masked')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_/, '');

// Files for the report of a failed test: "<NN> <METHOD> <path> request.json" and
// "<NN> <METHOD> <path> response.<json|html|txt>" (the latter only if a response came); the request
// file also holds the response status and content type. NN is the 1-based position in the log, so
// repeated requests get their own files
export const exchangeAttachments = (
  { title, status, contentType, responseBody, ...request }: Exchange,
  position: number,
) => {
  const path = title.slice(request.method.length + 1);
  const fileName = `${String(position).padStart(2, '0')} ${request.method} ${toFileName(path)}`;
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
