import React, { useEffect, useState, useCallback } from "react";
import "./DriverProducts.css";

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

const readStoredDriver = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const cached = localStorage.getItem("driver");
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

export default function DriverProducts() {
  const [user] = useState(readStoredUser);
  const [driver, setDriver] = useState(readStoredDriver);

  // Category state
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const CATEGORIES_PER_PAGE = 16; // 4 columns × 4 rows

  // Product modal state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const PRODUCTS_PER_PAGE = 16;

  // Cache for products by categoryId
  const [productCache, setProductCache] = useState({});

  // Load categories on mount
  useEffect(() => {
    if (!driver) {
      setCategoriesError("Driver information not found. Please log in again.");
      return;
    }

    const loadCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError("");

      try {
        const url = withApiBase(
          `/catalogAPI/getAllCategories?SponsorID=${encodeURIComponent(
            driver.SponsorID
          )}`
        );

        const res = await fetch(url);
        if (!res.ok) {
          const errorMsg = await parseError(res, "Unable to load categories.");
          throw new Error(errorMsg);
        }

        const data = await res.json();
        let items = Array.isArray(data?.categories) ? data.categories : [];

        // Filter to only active categories
        items = items.filter((cat) => cat.active === true);

        setCategories(items);
        setCategoriesLoading(false);
      } catch (error) {
        console.error("loadCategories error:", error);
        setCategoriesError(error.message || "Failed to load categories.");
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [driver]);

  // Load products for a category
  const loadProducts = useCallback(
    async (categoryId) => {
      // Check cache first
      if (productCache[categoryId]) {
        setProducts(productCache[categoryId]);
        setProductsError("");
        return;
      }

      setProductsLoading(true);
      setProductsError("");
      setCurrentProductPage(1);

      try {
        const filter = `categoryPath.id=${categoryId}`;
        const params = new URLSearchParams({
          show: "name,salePrice,image",
          pageSize: PRODUCTS_PER_PAGE,
          page: 1,
          sort: "name.asc",
          format: "json",
          apiKey:
            process.env.REACT_APP_BESTBUY_API_KEY || "3AsycyCu2CRRwvvnLtHYuBMV",
        });

        const url = `https://api.bestbuy.com/v1/products(${filter})?${params.toString()}`;
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`Best Buy API error: ${res.status}`);
        }

        const data = await res.json();
        const items = data?.products || [];

        // Cache the results
        setProductCache((prev) => ({
          ...prev,
          [categoryId]: items,
        }));

        setProducts(items);
        setProductsLoading(false);
      } catch (error) {
        console.error("loadProducts error:", error);
        setProductsError(
          error.message || "Failed to load products for this category."
        );
        setProducts([]);
        setProductsLoading(false);
      }
    },
    [productCache]
  );

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    loadProducts(category.categoryId);
  };

  const closeModal = () => {
    setSelectedCategory(null);
    setProducts([]);
    setProductsError("");
  };

  // Pagination calculations for categories
  const totalCategoryPages = Math.ceil(categories.length / CATEGORIES_PER_PAGE);
  const categoryStartIdx = (currentCategoryPage - 1) * CATEGORIES_PER_PAGE;
  const categoryEndIdx = categoryStartIdx + CATEGORIES_PER_PAGE;
  const paginatedCategories = categories.slice(
    categoryStartIdx,
    categoryEndIdx
  );

  // Pagination calculations for products
  const totalProductPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const productStartIdx = (currentProductPage - 1) * PRODUCTS_PER_PAGE;
  const productEndIdx = productStartIdx + PRODUCTS_PER_PAGE;
  const paginatedProducts = products.slice(productStartIdx, productEndIdx);

  return (
    <div className="driver-products">
      <div className="driver-products__header">
        <h1>Product Catalog</h1>
        {driver && (
          <p className="text-muted">
            Browsing products from{" "}
            <strong>{driver.SponsorName || "your sponsor"}</strong>
          </p>
        )}
      </div>

      {/* Categories Grid */}
      <section className="driver-products__categories">
        <div className="driver-products__section-title">
          <h2>Categories</h2>
          {categoriesLoading && (
            <span className="text-muted">Loading categories…</span>
          )}
        </div>

        {categoriesError && (
          <div className="alert alert-danger">
            <strong>Error:</strong> {categoriesError}
          </div>
        )}

        {!categoriesLoading && categories.length === 0 && (
          <div className="alert alert-info">
            No categories available. Your sponsor hasn't added any yet.
          </div>
        )}

        {!categoriesLoading && categories.length > 0 && (
          <>
            <div className="driver-products__grid driver-products__grid--4col">
              {paginatedCategories.map((category) => (
                <div
                  key={category.categoryId}
                  className="driver-products__category-card"
                  onClick={() => handleCategoryClick(category)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleCategoryClick(category);
                  }}
                >
                  <div className="driver-products__card-image">
                    <img
                      src={category.image || CATEGORY_PLACEHOLDER}
                      alt={category.name || category.categoryId}
                      onError={(e) => {
                        e.target.src = CATEGORY_PLACEHOLDER;
                      }}
                    />
                  </div>
                  <div className="driver-products__card-content">
                    <h3>
                      {category.name || `Category ${category.categoryId}`}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Category Pagination */}
            {totalCategoryPages > 1 && (
              <nav className="driver-products__pagination">
                <button
                  onClick={() =>
                    setCurrentCategoryPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentCategoryPage === 1}
                  className="btn btn-sm btn-outline-secondary"
                >
                  ← Previous
                </button>
                <span className="driver-products__pagination-info">
                  Page {currentCategoryPage} of {totalCategoryPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentCategoryPage((p) =>
                      Math.min(totalCategoryPages, p + 1)
                    )
                  }
                  disabled={currentCategoryPage === totalCategoryPages}
                  className="btn btn-sm btn-outline-secondary"
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      {/* Product Modal */}
      {selectedCategory && (
        <div className="driver-products__modal-overlay" onClick={closeModal}>
          <div
            className="driver-products__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="driver-products__modal-header">
              <h2>{selectedCategory.name || selectedCategory.categoryId}</h2>
              <button
                className="driver-products__modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="driver-products__modal-content">
              {productsLoading && (
                <div className="alert alert-info">Loading products…</div>
              )}

              {productsError && (
                <div className="alert alert-warning">
                  <strong>Warning:</strong> {productsError}
                  <div className="driver-products__error-card">
                    <div className="driver-products__error-icon">⚠️</div>
                    <p>No products available for this category</p>
                  </div>
                </div>
              )}

              {!productsLoading && products.length === 0 && !productsError && (
                <div className="driver-products__error-card">
                  <div className="driver-products__error-icon">⚠️</div>
                  <p>No products available for this category</p>
                </div>
              )}

              {!productsLoading && paginatedProducts.length > 0 && (
                <>
                  <div className="driver-products__grid driver-products__grid--4col">
                    {paginatedProducts.map((product) => (
                      <div
                        key={product.sku}
                        className="driver-products__product-card"
                      >
                        <div className="driver-products__product-image">
                          <img
                            src={product.image || CATEGORY_PLACEHOLDER}
                            alt={product.name}
                            onError={(e) => {
                              e.target.src = CATEGORY_PLACEHOLDER;
                            }}
                          />
                        </div>
                        <div className="driver-products__product-content">
                          <h4>{product.name}</h4>
                          <div className="driver-products__product-price">
                            ${(product.salePrice || 0).toFixed(2)}
                          </div>
                          <button className="btn btn-sm btn-primary driver-products__cart-btn">
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Product Pagination */}
                  {totalProductPages > 1 && (
                    <nav className="driver-products__pagination">
                      <button
                        onClick={() =>
                          setCurrentProductPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentProductPage === 1}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        ← Previous
                      </button>
                      <span className="driver-products__pagination-info">
                        Page {currentProductPage} of {totalProductPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentProductPage((p) =>
                            Math.min(totalProductPages, p + 1)
                          )
                        }
                        disabled={currentProductPage === totalProductPages}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        Next →
                      </button>
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
