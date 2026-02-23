// API calls go through Next.js proxy routes (app/api/urls/*) to avoid NEXT_PUBLIC build-time baking
export const urlApiBase = "/api/urls";

export async function apiFetch<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || `${init.method ?? "GET"} ${url} → ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}
