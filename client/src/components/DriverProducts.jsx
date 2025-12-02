import React, { useEffect, useState, useCallback } from "react";
import "./DriverProducts.css";
import DriverNavbar from "./DriverNavbar";

const CATEGORY_PLACEHOLDER =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Best_Buy_Logo.svg/640px-Best_Buy_Logo.svg.png";

const API_BASE = (() => {
  return "https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws";
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

/**
 * Get DriverID from UserID by querying DRIVER table
 */
async function getDriverIdForUser(userID) {
  try {
    const url = withApiBase(`/driverAPI/getSpecificDriver?UserID=${userID}`);
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    // getSpecificDriver returns array of drivers, get first one
    return data && data.length > 0 ? data[0].DriverID : null;
  } catch (error) {
    console.error("Error getting DriverID:", error);
    return null;
  }
}

/**
 * Get SponsorID from DriverID by querying DRIVER_SPONSOR_MAPPINGS table
 */
async function getSponsorIdForDriver(driverID) {
  try {
    const url = withApiBase(
      `/driverAPI/getSponsorForDriver?DriverID=${driverID}`
    );
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    return data?.SponsorID || null;
  } catch (error) {
    console.error("Error getting SponsorID:", error);
    return null;
  }
}

/**
 * Get saved sponsor selection from localStorage
 */
function getSavedSponsorSelection() {
  try {
    const saved = localStorage.getItem("selectedSponsorMapping");
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Error reading saved sponsor selection:", error);
    return null;
  }
}

/**
 * Get sponsor information by SponsorID
 */
async function getSponsorInfo(sponsorID) {
  try {
    const sponsorUrl = withApiBase(
      `/sponsorAPI/getSponsor?SponsorID=${encodeURIComponent(sponsorID)}`
    );
    console.log("Fetching sponsor info from:", sponsorUrl);
    const sponsorRes = await fetch(sponsorUrl);
    if (sponsorRes.ok) {
      const sponsorData = await sponsorRes.json();
      console.log("Sponsor data received:", sponsorData);
      return sponsorData;
    }
    return null;
  } catch (error) {
    console.log("Could not fetch sponsor details:", error);
    return null;
  }
}

/**
 * Get SponsorID from saved selection or fallback to driver lookup
 */
async function getSponsorIdForUser(userID) {
  // First, check for saved sponsor selection
  const savedSelection = getSavedSponsorSelection();
  if (savedSelection && savedSelection.sponsorID) {
    console.log("Using saved sponsor selection:", savedSelection);
    return {
      sponsorID: savedSelection.sponsorID,
      sponsorName: savedSelection.sponsorName,
    };
  }

  // Fallback to original logic
  console.log("No saved sponsor selection, using driver lookup");

  // Step 1: Get DriverID from UserID
  const driverID = await getDriverIdForUser(userID);
  if (!driverID) {
    throw new Error("No driver record found for this user.");
  }

  // Step 2: Get SponsorID from DriverID via DRIVER_SPONSOR_MAPPINGS
  const sponsorID = await getSponsorIdForDriver(driverID);
  if (!sponsorID) {
    throw new Error("No sponsor information found for this driver.");
  }

  return { sponsorID, sponsorName: null };
}

export default function DriverProducts() {
  const [user] = useState(readStoredUser);

  // Category state
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  // 4 columns by 4 rows per page
  const CATEGORIES_PER_PAGE = 16;

  // Sponsor state
  const [sponsorInfo, setSponsorInfo] = useState(null);
  const [currentPoints, setCurrentPoints] = useState(0);

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
    if (!user || !user.UserID) {
      setCategoriesError("User information not found. Please log in again.");
      return;
    }

    const loadCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError("");

      try {
        // Get SponsorID using saved selection or fallback
        const sponsorResult = await getSponsorIdForUser(user.UserID);
        const sponsorID = sponsorResult.sponsorID;

        // Get sponsor details
        let sponsorInfo = null;
        if (sponsorResult.sponsorName) {
          // Use name from saved selection
          sponsorInfo = {
            SponsorID: sponsorID,
            CompanyName: sponsorResult.sponsorName,
          };
        } else {
          // Fetch sponsor details from API
          sponsorInfo = await getSponsorInfo(sponsorID);
          if (!sponsorInfo) {
            sponsorInfo = {
              SponsorID: sponsorID,
              CompanyName: `Sponsor ${sponsorID}`,
            };
          }
        }
        setSponsorInfo(sponsorInfo);

        // Get current points from saved selection first
        const savedSelection = getSavedSponsorSelection();
        let points = 0;

        // First try: Use points from saved selection if available
        if (
          savedSelection &&
          savedSelection.sponsorID === sponsorID &&
          savedSelection.currentPoints !== undefined
        ) {
          points = savedSelection.currentPoints;
          console.log(
            "DriverProducts - Using saved points from localStorage:",
            points
          );
        } else {
          // Second try: Fetch from API if no saved points
          try {
            const mappingsUrl = `https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/driverAPI/getDriverSponsorMappings?UserID=${user.UserID}`;
            const mappingsRes = await fetch(mappingsUrl);
            if (mappingsRes.ok) {
              const mappingsData = await mappingsRes.json();
              console.log(
                "DriverProducts - Fetched mappings for points:",
                mappingsData
              );

              // Handle nested array response (same as DriverProfile)
              let mappings = mappingsData;
              if (
                Array.isArray(mappingsData) &&
                mappingsData.length > 0 &&
                Array.isArray(mappingsData[0])
              ) {
                mappings = mappingsData[0];
              }

              // Find matching sponsor mapping
              if (Array.isArray(mappings)) {
                const currentMapping = mappings.find(
                  (m) => m.SponsorID == sponsorID
                );
                if (currentMapping) {
                  points = currentMapping.Points || 0;
                  console.log(
                    "DriverProducts - Found current points for SponsorID",
                    sponsorID,
                    ":",
                    points
                  );

                  // Update saved selection with fetched points
                  if (savedSelection) {
                    const updatedSelection = {
                      ...savedSelection,
                      currentPoints: points,
                    };
                    localStorage.setItem(
                      "selectedSponsorMapping",
                      JSON.stringify(updatedSelection)
                    );
                  }
                } else {
                  console.log(
                    "DriverProducts - No mapping found for SponsorID:",
                    sponsorID
                  );
                }
              }
            } else {
              console.log(
                "DriverProducts - Failed to fetch mappings:",
                mappingsRes.status
              );
            }
          } catch (error) {
            console.log(
              "DriverProducts - Could not fetch current points from mappings:",
              error
            );
          }
        }

        setCurrentPoints(points);
        console.log("DriverProducts - Set current points to:", points);

        // Get categories for this sponsor via CATALOG table
        const url = withApiBase(
          `/catalogAPI/getAllCategories?SponsorID=${encodeURIComponent(
            sponsorID
          )}`
        );

        const res = await fetch(url);
        if (!res.ok) {
          const errorMsg = await parseError(res, "Unable to load categories.");
          throw new Error(errorMsg);
        }

        const data = await res.json();
        let items = Array.isArray(data?.categories) ? data.categories : [];

        // Filter to show only active categories, inactive categories are hidden except from sponsor users
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
  }, [user]);

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
    <div>
      <DriverNavbar />
      <div className="driver-products">
        <div className="driver-products__header">
          <h1>Product Catalog</h1>
          {user && (
            <p className="text-muted">
              Welcome, <strong>{user.FirstName}</strong>! Browse products from
              your sponsor.
            </p>
          )}
          {sponsorInfo && (
            <div className="alert alert-info mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="fas fa-building me-2"></i>
                  <strong>Current Sponsor Catalog:</strong>{" "}
                  {sponsorInfo.CompanyName ||
                    `Sponsor ID ${sponsorInfo.SponsorID}`}
                  {sponsorInfo.SponsorID && (
                    <small className="ms-2 text-muted">
                      (ID: {sponsorInfo.SponsorID})
                    </small>
                  )}
                </div>
                <div className="text-end">
                  <span className="badge bg-primary fs-6">
                    <i className="fas fa-coins me-1"></i>
                    {currentPoints} Points
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* Debug - remove later */}
          {console.log("Current points state:", currentPoints)}
        </div>

        {/* Categories Grid */}
        <section className="driver-products__categories">
          <div className="driver-products__section-title">
            <h2>Categories</h2>
            {categoriesLoading && (
              <span className="text-muted">Loading categories...</span>
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
                    onKeyDown={(e) => {
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
                        {/* 
                          HINT: category.name is currently showing as null
                          The category object comes from the API response in the loadCategories() function
                          Look at what getAllCategoriesForSponsor() returns in catalogAPI.js - 
                          it currently maps "name: null" in the normalized response!
                          
                          You need to:
                          1. Fetch the actual category name from Best Buy API based on categoryId (category.categoryId is the Best Buy category code like "abcat0101001")
                          2. Store that name either in the database CATALOG table or enhance the API response
                          
                          Alternative approach:
                          - Query Best Buy API with the categoryId to get the display name
                          - Cache the result to avoid repeated API calls
                          - Use that instead of null
                        */}
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
                  <div className="alert alert-info">Loading products ...</div>
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

                {!productsLoading &&
                  products.length === 0 &&
                  !productsError && (
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
    </div>
  );
}
