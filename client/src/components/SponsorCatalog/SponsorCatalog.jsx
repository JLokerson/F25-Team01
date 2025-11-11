import React, { useCallback, useEffect, useMemo, useState } from "react";
import SponsorNavbar from "../SponsorNavbar";
import CatalogItemCard from "./CatalogItemCard";
import "./SponsorCatalog.css";

const CATEGORY_PLACEHOLDER =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Best_Buy_Logo.svg/640px-Best_Buy_Logo.svg.png";

const API_BASE = (() => {
  if (process.env.REACT_APP_SERVER_URL) {
    return process.env.REACT_APP_SERVER_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:4000`;
  }
  return "http://localhost:4000";
})();

const withApiBase = (path) => {
  if (!path) return API_BASE;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

const readStoredUser = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const cached = localStorage.getItem("user");
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

async function parseError(response, fallback = "Request failed.") {
  const text = await response.text();
  if (!text) {
    return fallback;
  }

  try {
    const payload = JSON.parse(text);
    return payload?.message || fallback;
  } catch {
    return text;
  }
}

export default function SponsorCatalog() {
  const [user] = useState(readStoredUser);
  const userId = user?.UserID ?? null;

  const [sponsor, setSponsor] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const cached = localStorage.getItem("sponsor");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [sponsorStatus, setSponsorStatus] = useState({
    loading: false,
    error: "",
  });
  const [sponsorReloadKey, setSponsorReloadKey] = useState(0);

  const [categories, setCategories] = useState([]);
  const [categoryStatus, setCategoryStatus] = useState({
    loading: false,
    error: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [activePattern, setActivePattern] = useState("");
  const [categoryReloadKey, setCategoryReloadKey] = useState(0);

  const categoryHeading = useMemo(() => {
    if (!activePattern) {
      return "All Categories";
    }
    return `Categories matching "${activePattern}"`;
  }, [activePattern]);

  useEffect(() => {
    if (!sponsor) {
      return;
    }
    try {
      localStorage.setItem("sponsor", JSON.stringify(sponsor));
    } catch {
      // ignore write errors (e.g., storage disabled)
    }
  }, [sponsor]);

  useEffect(() => {
    if (!userId) {
      setSponsorStatus({
        loading: false,
        error: "Missing user context. Log in again to resolve sponsor info.",
      });
      return;
    }

    const controller = new AbortController();
    setSponsorStatus({ loading: true, error: "" });

    const url = withApiBase(
      `/sponsorAPI/getSponsorForUser?UserID=${encodeURIComponent(userId)}`
    );

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(
            await parseError(res, "Unable to resolve sponsor mapping.")
          );
        }
        return res.json();
      })
      .then((payload) => {
        setSponsor(payload);
        setSponsorStatus({ loading: false, error: "" });
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        setSponsor(null);
        setSponsorStatus({
          loading: false,
          error: error.message || "Failed to resolve sponsor.",
        });
      });

    return () => controller.abort();
  }, [userId, sponsorReloadKey]);

  const loadCategories = useCallback((pattern, signal) => {
    setCategoryStatus({ loading: true, error: "" });

    // Call the correct server endpoint at /api/bestbuy/categories
    // Server expects: show, pageSize, page, cursor, or all=1
    // We request categories with id, name, url fields
    const url = withApiBase("/api/bestbuy/categories");
    const params = new URLSearchParams({
      all: "1", // Aggregate all categories from Best Buy (up to 300)
      show: "id,name,url,image", // Request images; server fetches preview images for some categories
    });

    console.log(
      "Fetching categories with pattern:",
      pattern && pattern.length ? pattern : "<none>"
    );

    fetch(`${url}?${params.toString()}`, { signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(
            await parseError(res, "Unable to fetch Best Buy categories.")
          );
        }
        return res.json();
      })
      .then((payload) => {
        let items = Array.isArray(payload?.items) ? payload.items : [];

        // Client-side filter: if user provided a search pattern, filter items
        if (pattern && pattern.length > 0) {
          const lowerPattern = pattern.toLowerCase();
          items = items.filter((cat) =>
            (cat.name || "").toLowerCase().includes(lowerPattern)
          );
        }

        setCategories(items);
        setCategoryStatus({ loading: false, error: "" });
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        setCategories([]);
        setCategoryStatus({
          loading: false,
          error: error.message || "Failed to fetch categories.",
        });
      });
  }, []);

  useEffect(() => {
    if (!sponsor) {
      return;
    }
    const controller = new AbortController();
    loadCategories(activePattern, controller.signal);
    return () => controller.abort();
  }, [sponsor, activePattern, categoryReloadKey, loadCategories]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextPattern = (searchInput || "").trim();
    setActivePattern(nextPattern);
    setCategoryReloadKey((count) => count + 1);
  };

  const retrySponsor = () => setSponsorReloadKey((count) => count + 1);
  const retryCategories = () => setCategoryReloadKey((count) => count + 1);

  return (
    <>
      <SponsorNavbar />
      <div className="sponsor-catalog">
        <div className="container">
          <header className="catalog-header">
            <div>
              <h2>Sponsor Catalog</h2>
              {sponsor ? (
                <p className="text-muted mb-0">
                  Serving catalog for <strong>{sponsor.Name}</strong>
                </p>
              ) : (
                <p className="text-muted mb-0">
                  Resolving sponsor information for your account.
                </p>
              )}
            </div>
            <form className="catalog-search" onSubmit={handleSearchSubmit}>
              <label htmlFor="category-search" className="visually-hidden">
                Category filter
              </label>
              <input
                id="category-search"
                className="form-control"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search categories"
              />
              <button className="btn btn-primary" type="submit">
                Search
              </button>
            </form>
          </header>

          {sponsorStatus.error && (
            <div className="alert alert-danger d-flex justify-content-between align-items-center">
              <span>{sponsorStatus.error}</span>
              <button
                className="btn btn-sm btn-outline-light"
                onClick={retrySponsor}
              >
                Retry
              </button>
            </div>
          )}

          <section className="category-panel">
            <div className="category-panel__header">
              <h3>{categoryHeading}</h3>
              {categoryStatus.loading && (
                <span className="text-muted">Loading categories…</span>
              )}
            </div>

            {categoryStatus.error && (
              <div className="alert alert-warning d-flex justify-content-between align-items-center">
                <span>{categoryStatus.error}</span>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={retryCategories}
                >
                  Try again
                </button>
              </div>
            )}

            {!categoryStatus.loading && !categoryStatus.error && (
              <div className="category-panel__content">
                {categories.length === 0 ? (
                  <div className="category-card empty-state">
                    No categories match this pattern.
                  </div>
                ) : (
                  <div className="catalog-grid">
                    {categories.map((category) => (
                      <CatalogItemCard
                        key={category.id}
                        product={{
                          name: category.name,
                          image: category.image || CATEGORY_PLACEHOLDER,
                        }}
                        meta={`ID: ${category.id}`}
                        actionLabel={category.url ? "View" : undefined}
                        onAction={
                          category.url
                            ? () =>
                                window.open(
                                  category.url,
                                  "_blank",
                                  "noopener,noreferrer"
                                )
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
