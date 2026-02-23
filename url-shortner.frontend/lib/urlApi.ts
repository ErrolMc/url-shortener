import { apiFetch, urlApiBase } from "./api";

export interface ShortUrl {
  id: string;
  userId: string;
  originalUrl: string;
  shortCode: string;
  createdAt: string;
  clickCount: number;
}

export function createUrlApi(token: string) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  return {
    list(): Promise<ShortUrl[]> {
      return apiFetch(urlApiBase, { headers });
    },

    create(originalUrl: string, customAlias?: string): Promise<ShortUrl> {
      return apiFetch(urlApiBase, {
        method: "POST",
        headers,
        body: JSON.stringify({ originalUrl, customAlias: customAlias || null }),
      });
    },

    delete(id: string): Promise<void> {
      return apiFetch(`${urlApiBase}/${id}`, {
        method: "DELETE",
        headers,
      });
    },
  };
}
