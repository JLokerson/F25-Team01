import React, { useCallback, useMemo, useState } from "react";

// Simple, no-dependency client for browsing Best Buy categories via the server proxy
// Server route expected: GET /api/bestbuy/categories
// Modes supported here: page, cursor, and all

const SERVER_BASE = process.env.REACT_APP_SERVER_URL || "http://localhost:4000";
const API_BASE = `${SERVER_BASE}/api/bestbuy`;

export default function CategoryExplorer() {
  const [mode, setMode] = useState("page"); // 'page' | 'cursor' | 'all'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [cursor, setCursor] = useState("*");
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [downloading, setDownloading] = useState(false);

  const disabled = loading;

  const queryUrl = useMemo(() => {
    const u = new URL(`${API_BASE}/categories`);
    if (mode === "all") {
      u.searchParams.set("all", "1");
      u.searchParams.set("pageSize", String(pageSize || 100));
    } else if (mode === "cursor") {
      u.searchParams.set("cursor", cursor || "*");
      u.searchParams.set("pageSize", String(pageSize || 100));
    } else {
      u.searchParams.set("page", String(page || 1));
      u.searchParams.set("pageSize", String(pageSize || 100));
    }
    u.searchParams.set("show", "id,name,url");
    return u.toString();
  }, [mode, page, pageSize, cursor]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(queryUrl);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      const arr = Array.isArray(data?.items) ? data.items : [];
      setItems(arr);
      setNextCursor(data?.nextCursorMark || "");
    } catch (e) {
      setErr(e.message || "Request failed");
      setItems([]);
      setNextCursor("");
    } finally {
      setLoading(false);
    }
  }, [queryUrl]);

  const downloadAllNames = useCallback(async () => {
    setDownloading(true);
    setErr("");
    try {
      // Ask server to aggregate everything with minimal payload
      const url = new URL(`${API_BASE}/categories`);
      url.searchParams.set("all", "1");
      url.searchParams.set("pageSize", String(pageSize || 100));
      url.searchParams.set("show", "name");

      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      const arr = Array.isArray(data?.items) ? data.items : [];
      // Map to names only, unique and sorted
      const names = Array.from(
        new Set(
          arr
            .map((c) => (c && typeof c.name === "string" ? c.name.trim() : ""))
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));

      const blob = new Blob([JSON.stringify(names, null, 2)], {
        type: "application/json",
      });
      const dl = document.createElement("a");
      dl.href = URL.createObjectURL(blob);
      dl.download = "bestbuy-categories-names.json";
      document.body.appendChild(dl);
      dl.click();
      dl.remove();
    } catch (e) {
      setErr(e.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  }, [pageSize]);

  const onPrev = () => setPage((p) => Math.max(1, p - 1));
  const onNext = () => setPage((p) => p + 1);
  const onNextCursor = () => {
    if (nextCursor) setCursor(nextCursor);
  };
  const onResetCursor = () => setCursor("*");

  return (
    <div style={{ fontFamily: "Heebo, Arial", color: "#fff" }}>
      <h2 style={{ marginBottom: 12 }}>Best Buy Categories</h2>
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Mode:
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            disabled={disabled}
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              background: "#111",
              color: "#fff",
            }}
          >
            <option value="page">page</option>
            <option value="cursor">cursor</option>
            <option value="all">all</option>
          </select>
        </label>
        {mode === "page" && (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Page:
              <input
                type="number"
                min={1}
                value={page}
                onChange={(e) => setPage(Number(e.target.value) || 1)}
                disabled={disabled}
                style={{
                  width: 80,
                  padding: "6px 8px",
                  borderRadius: 8,
                  background: "#111",
                  color: "#fff",
                }}
              />
            </label>
          </>
        )}
        {mode !== "all" && (
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Page size:
            <input
              type="number"
              min={1}
              max={100}
              value={pageSize}
              onChange={(e) =>
                setPageSize(
                  Math.max(1, Math.min(100, Number(e.target.value) || 1))
                )
              }
              disabled={disabled}
              style={{
                width: 100,
                padding: "6px 8px",
                borderRadius: 8,
                background: "#111",
                color: "#fff",
              }}
            />
          </label>
        )}
        {mode === "cursor" && (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Cursor:
              <input
                value={cursor}
                onChange={(e) => setCursor(e.target.value)}
                disabled={disabled}
                style={{
                  width: 360,
                  padding: "6px 8px",
                  borderRadius: 8,
                  background: "#111",
                  color: "#fff",
                }}
              />
            </label>
            <button
              onClick={onResetCursor}
              disabled={disabled}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                background: "#374151",
                color: "#fff",
                border: "1px solid #4b5563",
              }}
            >
              Reset to *
            </button>
            <button
              onClick={onNextCursor}
              disabled={disabled || !nextCursor}
              title={nextCursor || ""}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                background: "#1d4ed8",
                color: "#fff",
                border: "1px solid #3b82f6",
              }}
            >
              Use nextCursor
            </button>
          </>
        )}
        <button
          onClick={fetchCategories}
          disabled={disabled}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            background: "#16a34a",
            color: "#fff",
            border: "1px solid #22c55e",
          }}
        >
          {loading ? "Loading…" : "Fetch"}
        </button>
        {mode === "page" && (
          <>
            <button
              onClick={onPrev}
              disabled={disabled || page <= 1}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                background: "#374151",
                color: "#fff",
                border: "1px solid #4b5563",
              }}
            >
              Prev page
            </button>
            <button
              onClick={onNext}
              disabled={disabled}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                background: "#374151",
                color: "#fff",
                border: "1px solid #4b5563",
              }}
            >
              Next page
            </button>
          </>
        )}
        <button
          onClick={downloadAllNames}
          disabled={loading || downloading}
          title="Download JSON array of category names only"
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            background: "#0ea5e9",
            color: "#fff",
            border: "1px solid #38bdf8",
          }}
        >
          {downloading ? "Preparing…" : "Download names.json"}
        </button>
      </div>

      {err && (
        <div style={{ color: "#f87171", marginBottom: 12 }}>Error: {err}</div>
      )}

      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
        GET: <code style={{ wordBreak: "break-all" }}>{queryUrl}</code>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8 }}
      >
        {items.map(
          (c) =>
            console.log(c) || (
              <React.Fragment key={c.id}>
                <div style={{ opacity: 0.9 }}>{c.id}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  {c.url && (
                    <div>
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#93c5fd" }}
                      >
                        {c.url}
                      </a>
                    </div>
                  )}
                </div>
              </React.Fragment>
            )
        )}
      </div>

      {!loading && !err && items.length === 0 && (
        <div style={{ opacity: 0.8 }}>No categories found.</div>
      )}
    </div>
  );
}
