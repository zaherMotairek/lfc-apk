const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const REQUEST_TIMEOUT_MS = 15_000;

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

export async function apiUploadForm<T>(
  path: string,
  formData: FormData,
  token?: string | null,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message;
      throw new Error(message ?? 'Upload failed');
    }

    return data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Upload timed out. Check that the API is running.');
    }
    if (error instanceof TypeError) {
      throw new Error('Unable to reach the API. Is the server running on port 3000?');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function apiUploadFile<T>(
  path: string,
  file: File,
  token?: string | null,
  fieldName = 'file',
): Promise<T> {
  const body = new FormData();
  body.append(fieldName, file);
  return apiUploadForm<T>(path, body, token);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message;
      throw new Error(message ?? 'Request failed');
    }

    return data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Check that the API is running.');
    }
    if (error instanceof TypeError) {
      throw new Error('Unable to reach the API. Is the server running on port 3000?');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
