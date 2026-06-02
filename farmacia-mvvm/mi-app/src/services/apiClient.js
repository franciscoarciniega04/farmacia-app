import { API_BASE_URL, REQUEST_TIMEOUT } from '../constants/config';

const buildUrl = (endpoint, params = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return query ? `${url}${url.includes('?') ? '&' : '?'}${query}` : url;
};

const parseResponseBody = async (response, responseType) => {
  if (responseType === 'blob') return response.blob();
  if (responseType === 'text') return response.text();

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const apiClient = {
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      params,
      body,
      headers = {},
      timeout = REQUEST_TIMEOUT || 10000,
      responseType = 'json',
    } = options;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller
      ? setTimeout(() => controller.abort(), timeout)
      : null;

    const requestHeaders = {
      Accept: responseType === 'blob' ? '*/*' : 'application/json',
      ...headers,
    };

    const config = {
      method,
      headers: requestHeaders,
      signal: controller?.signal,
    };

    if (body !== undefined && method !== 'GET') {
      if (body instanceof FormData) {
        config.body = body;
      } else if (typeof body === 'string') {
        config.body = body;
        config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
      } else {
        config.body = JSON.stringify(body);
        config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
      }
    }

    try {
      const response = await fetch(buildUrl(endpoint, params), config);
      const data = await parseResponseBody(response, responseType);

      if (!response.ok) {
        const message = data?.detail || data?.message || `Error ${response.status}: ${response.statusText}`;
        throw new ApiError(message, response.status, data);
      }

      return data;
    } finally {
      if (timer) clearTimeout(timer);
    }
  },

  get(endpoint, params, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET', params });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  },

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
};

export default apiClient;
