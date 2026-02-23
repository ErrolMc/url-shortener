"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { createUrlApi, type ShortUrl } from "@/lib/urlApi";
import { ApiError } from "@/lib/api";

export default function UrlsPage() {
  const { data: session, status } = useSession();
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [urlDomain, setUrlDomain] = useState<string>("");

  const api = session?.backendToken ? createUrlApi(session.backendToken) : null;

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setUrlDomain(d.urlDomain ?? ""))
      .catch(() => {});
  }, []);

  const fetchUrls = useCallback(async () => {
    if (!api) return;
    try {
      setUrls(await api.list());
      setError(null);
    } catch {
      setError("Failed to load URLs. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.backendToken]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUrls();
    }
  }, [status, fetchUrls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl.trim() || !api) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await api.create(originalUrl.trim(), customAlias.trim() || undefined);
      setUrls((prev) => [created, ...prev]);
      setOriginalUrl("");
      setCustomAlias("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to shorten URL. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!api) return;
    setDeletingId(id);
    setError(null);
    try {
      await api.delete(id);
      setUrls((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setError("Failed to delete URL. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const getShortUrl = (shortCode: string) =>
    `${urlDomain}/${shortCode}`;

  const handleCopy = async (shortCode: string, id: string) => {
    await navigator.clipboard.writeText(getShortUrl(shortCode));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Add URL */}
      <div>
        <h1 className="text-xl font-semibold text-black dark:text-white mb-5">
          Add New URL
        </h1>
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Original URL
              </label>
              <input
                type="url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="https://example.com/very/long/url"
                required
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Custom alias{" "}
                <span className="font-normal text-zinc-400 dark:text-zinc-600">
                  (optional)
                </span>
              </label>
              <input
                type="text"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                placeholder="my-custom-alias"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting || !originalUrl.trim()}
              className="px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Shortening..." : "Shorten URL"}
            </button>
          </form>
        </div>
      </div>

      {/* URL list */}
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white mb-5">
          Your URLs
          {urls.length > 0 && (
            <span className="ml-2 text-sm font-normal text-zinc-400 dark:text-zinc-600">
              {urls.length} {urls.length === 1 ? "link" : "links"}
            </span>
          )}
        </h2>

        {isLoading ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200" />
          </div>
        ) : urls.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-600">
              No URLs yet. Add one above to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {urls.map((url) => (
              <div
                key={url.id}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black dark:text-white truncate">
                    {getShortUrl(url.shortCode)}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-600 truncate mt-0.5">
                    {url.originalUrl}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(url.shortCode, url.id)}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    {copiedId === url.id ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={() => handleDelete(url.id)}
                    disabled={deletingId === url.id}
                    className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {deletingId === url.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
