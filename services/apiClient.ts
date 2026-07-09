const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
const DEVICE_API_KEY = process.env.EXPO_PUBLIC_DEVICE_API_KEY ?? "";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * Small fetch wrapper for talking to the FastAPI backend (`EXPO_PUBLIC_API_BASE_URL`).
 * Device-authenticated requests (e.g. ingest push) include `X-Device-Key`.
 */
async function request<T>(
  path: string,
  { method = "GET", body, headers = {} }: RequestOptions = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured");
  }

  const url = `${API_BASE_URL.replace(/\/$/, "")}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApiError(
      response.status,
      text || `Request failed with status ${response.status}`,
    );
  }

  return (await response.json()) as T;
}

/**
 * POST with the device API key attached as `X-Device-Key`.
 * Used by `syncService` to authenticate the IoT node with the backend.
 */
export async function devicePost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body,
    headers: { "X-Device-Key": DEVICE_API_KEY },
  });
}

export const apiClient = {
  request,
  devicePost,
  baseUrl: API_BASE_URL,
};
