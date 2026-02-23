import { apiFetch } from "./api";

export interface AnalyticEvent {
  id: string;
  shortCode: string;
  timestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
  referrer: string | null;
}

export function createAnalyticsApi(token: string) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  return {
    getEvents(shortCode: string): Promise<AnalyticEvent[]> {
      return apiFetch(`/api/analytics/${shortCode}`, { headers });
    },
  };
}
