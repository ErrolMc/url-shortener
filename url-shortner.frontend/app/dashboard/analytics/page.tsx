"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { createUrlApi, type ShortUrl } from "@/lib/urlApi";
import { createAnalyticsApi, type AnalyticEvent } from "@/lib/analyticsApi";

// ---- helpers ----

function getLast14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function groupByDay(events: AnalyticEvent[]): Record<string, number> {
  return events.reduce(
    (acc, e) => {
      const day = new Date(e.timestamp).toISOString().slice(0, 10);
      acc[day] = (acc[day] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

function topReferrers(events: AnalyticEvent[], limit = 5) {
  const counts: Record<string, number> = {};
  for (const e of events) {
    const ref = e.referrer?.trim() || "Direct";
    counts[ref] = (counts[ref] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---- bar chart ----

function ClicksChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const n = data.length;
  const chartH = 72;
  const barW = 18;
  const gap = 5;
  const vw = n * (barW + gap) - gap;
  const vh = chartH + 18;

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      className="w-full"
      style={{ height: 96 }}
      preserveAspectRatio="none"
    >
      {data.map((d, i) => {
        const barH = d.count > 0 ? Math.max((d.count / max) * chartH, 3) : 0;
        const x = i * (barW + gap);
        const y = chartH - barH;
        const isToday = i === n - 1;
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={0}
              width={barW}
              height={chartH}
              rx={2}
              className="fill-zinc-100 dark:fill-zinc-800"
            />
            {barH > 0 && (
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={2}
                className={
                  isToday
                    ? "fill-black dark:fill-white"
                    : "fill-zinc-500 dark:fill-zinc-400"
                }
              />
            )}
            {i % 2 === 0 && (
              <text
                x={x + barW / 2}
                y={chartH + 14}
                textAnchor="middle"
                fontSize={6}
                className="fill-zinc-400 dark:fill-zinc-600"
              >
                {d.date.slice(5).replace("-", "/")}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ---- spinner ----

function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  const cls =
    size === "sm"
      ? "h-4 w-4 border-2"
      : "h-6 w-6 border-2";
  return (
    <div
      className={`${cls} animate-spin rounded-full border-zinc-300 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200`}
    />
  );
}

// ---- page ----

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [events, setEvents] = useState<AnalyticEvent[]>([]);
  const [loadingUrls, setLoadingUrls] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlApi = session?.backendToken ? createUrlApi(session.backendToken) : null;
  const analyticsApi = session?.backendToken
    ? createAnalyticsApi(session.backendToken)
    : null;

  const fetchUrls = useCallback(async () => {
    if (!urlApi) return;
    try {
      const data = await urlApi.list();
      setUrls(data);
      if (data.length > 0) setSelectedCode(data[0].shortCode);
    } catch {
      setError("Failed to load URLs.");
    } finally {
      setLoadingUrls(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.backendToken]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUrls();
    }
  }, [status, fetchUrls]);

  const fetchEvents = useCallback(async () => {
    if (!analyticsApi || !selectedCode) return;
    setLoadingEvents(true);
    setError(null);
    try {
      setEvents(await analyticsApi.getEvents(selectedCode));
    } catch {
      setError("Failed to load analytics.");
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCode, session?.backendToken]);

  useEffect(() => {
    if (selectedCode) fetchEvents();
  }, [selectedCode, fetchEvents]);

  // derived data
  const days = getLast14Days();
  const byDay = groupByDay(events);
  const chartData = days.map((d) => ({ date: d, count: byDay[d] ?? 0 }));
  const totalClicks = events.length;
  const last7 = days.slice(-7).reduce((s, d) => s + (byDay[d] ?? 0), 0);
  const thisMonth = Object.entries(byDay)
    .filter(([d]) => d.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((s, [, v]) => s + v, 0);
  const referrers = topReferrers(events);
  const selectedUrl = urls.find((u) => u.shortCode === selectedCode);

  // loading skeleton
  if (status === "loading" || loadingUrls) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold text-black dark:text-white mb-5">
          Analytics
        </h1>
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 flex justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  // no urls
  if (urls.length === 0) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold text-black dark:text-white mb-5">
          Analytics
        </h1>
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            No URLs yet. Create a shortened URL to start tracking analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* header row */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-black dark:text-white">
          Analytics
        </h1>
        <select
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
          className="text-sm px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
        >
          {urls.map((u) => (
            <option key={u.id} value={u.shortCode}>
              /{u.shortCode}
            </option>
          ))}
        </select>
      </div>

      {/* target url label */}
      {selectedUrl && (
        <p className="text-xs text-zinc-400 dark:text-zinc-600 truncate -mt-3">
          {selectedUrl.originalUrl}
        </p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Clicks", value: totalClicks },
          { label: "This Month", value: thisMonth },
          { label: "Last 7 Days", value: last7 },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-4"
          >
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mb-1">
              {label}
            </p>
            <p className="text-2xl font-semibold text-black dark:text-white">
              {loadingEvents ? "—" : value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* chart */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <p className="text-sm font-medium text-black dark:text-white mb-4">
          Clicks — last 14 days
        </p>
        {loadingEvents ? (
          <div className="h-24 flex items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : (
          <ClicksChart data={chartData} />
        )}
      </div>

      {/* referrers + recent events */}
      <div className="grid grid-cols-2 gap-3">
        {/* top referrers */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <p className="text-sm font-medium text-black dark:text-white mb-4">
            Top Referrers
          </p>
          {loadingEvents ? (
            <div className="h-20 flex items-center justify-center">
              <Spinner size="sm" />
            </div>
          ) : referrers.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              No data yet.
            </p>
          ) : (
            <div className="space-y-3">
              {referrers.map(([ref, count]) => {
                const pct = totalClicks > 0 ? (count / totalClicks) * 100 : 0;
                return (
                  <div key={ref}>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[130px]">
                        {ref}
                      </span>
                      <span className="text-xs font-medium text-black dark:text-white ml-2 shrink-0">
                        {count}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-1 rounded-full bg-zinc-800 dark:bg-zinc-200 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* recent clicks */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <p className="text-sm font-medium text-black dark:text-white mb-4">
            Recent Clicks
          </p>
          {loadingEvents ? (
            <div className="h-20 flex items-center justify-center">
              <Spinner size="sm" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              No clicks yet.
            </p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-start gap-2">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-700 dark:text-zinc-300">
                      {formatDateTime(e.timestamp)}
                    </p>
                    {e.referrer ? (
                      <p className="text-xs text-zinc-400 dark:text-zinc-600 truncate">
                        from {e.referrer}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400 dark:text-zinc-600">
                        Direct
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
