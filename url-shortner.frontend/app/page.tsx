interface WeatherForecast {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string | null;
}

async function getForecasts(): Promise<WeatherForecast[]> {
  const backendUrl =
    process.env["services__url-shortener-backend__http__0"] ??
    "http://localhost:5112";
  try {
    const res = await fetch(`${backendUrl}/WeatherForecast`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error("Failed to fetch forecasts:", e);
    return [];
  }
}

export default async function Home() {
  const forecasts = await getForecasts();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <main className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8 text-black dark:text-zinc-50">
          Weather Forecast
        </h1>
        <div className="flex flex-col gap-4">
          {forecasts.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">
              No forecasts available. Is the backend running?
            </p>
          ) : (
            forecasts.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-black dark:text-zinc-50">
                    {f.date}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {f.summary}
                  </span>
                </div>
                <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                  {f.temperatureC}°C / {f.temperatureF}°F
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
