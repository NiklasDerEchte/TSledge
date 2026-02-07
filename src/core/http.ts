import { HTTPRequestConfig } from './types';

/**
 * Converts an object to a URL-encoded string for form submission.
 * With content type application/x-www-form-urlencoded, the body should be a string in the format of key=value&key2=value2.
 * @param obj
 * @returns
 */
export function formDataParser(obj: Record<string, any>): string {
  return new URLSearchParams(obj).toString();
}

/**
 * Executes the HTTP request using axios or fetch as fallback
 * @param config RequestConfig
 * @returns Promise<T> The response data
 */
export async function httpRequest<T = any>(config: HTTPRequestConfig): Promise<T> {
  const url = new URL(config.url);

  if (config.urlSearchParams) {
    Object.keys(config.urlSearchParams).forEach((key) => {
      url.searchParams.set(key, String((config.urlSearchParams as any)[key]));
    });
  }

  let body: string | undefined;
  let defaultContentType: string = 'application/x-www-form-urlencoded';

  if (config.body) {
    if (typeof config.body === 'object') {
      body = JSON.stringify(config.body);
      defaultContentType = 'application/json';
    } else {
      body = String(config.body);
    }
  }

  const fetchImpl = globalThis.fetch;
  if (!fetchImpl) {
    throw new Error('fetch() is not available. Please use Node.js 18+ or add a fetch polyfill.');
  }

  const defaultHeaders: Record<string, string> = {};
  if (
    !config.headers ||
    !Object.keys(config.headers).find((key) => key.toLowerCase() === 'content-type')
  ) {
    defaultHeaders['Content-Type'] = defaultContentType;
  }

  const response = await fetchImpl(url.toString(), {
    method: config.method?.toUpperCase() || 'GET',
    body,
    headers: {
      ...defaultHeaders,
      ...config.headers,
    },
  });
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const isBlob = contentType.includes('application/octet-stream');
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`);
  }
  let result;
  if (isJson) {
    result = await response.json().catch(async (error: any) => {
      throw new Error(`Failed to parse JSON response: ${error.message}`);
    });
  } else if (isBlob) {
    result = await response.blob().catch(async (error: any) => {
      throw new Error(`Failed to get blob response: ${error.message}`);
    });
  } else {
    result = await response.text().catch(async (error: any) => {
      throw new Error(`Failed to get text response: ${error.message}`);
    });
  }
  return result as T;
}