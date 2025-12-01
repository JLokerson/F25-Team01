import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link, useNavigate } from "react-router-dom";
import DriverNavbar from "./DriverNavbar";
import driversSeed from "../content/json-assets/driver_sample.json";
import { CookiesProvider, useCookies } from "react-cookie";

export default function DriverCart() {
  let navigate = useNavigate();
  // read user from localStorage to determine availability
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    user = null;
  }
  const userType = user?.UserType ?? user?.accountType ?? null;
  const [cookies, setCookie] = useCookies(["MyDriverID"]);

  // Bugfix
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Sponsor and points state
  const [sponsorInfo, setSponsorInfo] = useState(null);
  const [currentPoints, setCurrentPoints] = useState(0);

  // Check if admin is in impostor mode as driver
  const impostorMode = localStorage.getItem("impostorMode");
  const impostorType = localStorage.getItem("impostorType");
  const isAdminImpostorAsDriver = impostorMode && impostorType === "driver";

  // Cart is stored as an array of ITEM_IDs
  const [cart, setCart] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  // ***
  const [cartLoading, setCartLoading] = useState(false);
  const [driverId, setDriverId] = useState(null);

  // Load sponsor information and cart
  useEffect(() => {
    if (user?.UserID) {
      loadSponsorInfo();
    }
  }, [user?.UserID]);

  const loadSponsorInfo = async () => {
    try {
      setCartLoading(true);
      console.log("Cart - Loading sponsor info and cart from database...");
      if (!user?.UserID) {
        console.log("Cart - No UserID available");
        return;
      }

      const driverUrl = `https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/driverAPI/getSpecificDriver?UserID=${user.UserID}`;
      const driverRes = await fetch(driverUrl);

      if (!driverRes.ok) {
        console.error("Cart - Failed to fetch driver info:", driverRes.status);
        return;
      }

      const driverData = await driverRes.json();
      console.log("Cart - Driver data from DB:", driverData);

      // Extract DriverID and SponsorID from response
      const driver =
        Array.isArray(driverData) && driverData.length > 0
          ? driverData[0]
          : driverData;
      const fetchedDriverId = driver?.DriverID;
      const sponsorId = driver?.SponsorID;

      if (!fetchedDriverId || !sponsorId) {
        console.log("Cart - Missing DriverID or SponsorID from driver data");
        return;
      }

      // Store DriverID for later use
      setDriverId(fetchedDriverId);

      // Use SponsorID to fetch sponsor mappings via getDriverSponsorMappings
      const mappingsUrl = `https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/driverAPI/getDriverSponsorMappings/${user.UserID}`;
      const mappingsRes = await fetch(mappingsUrl);

      if (!mappingsRes.ok) {
        console.error(
          "Cart - Failed to fetch sponsor mappings:",
          mappingsRes.status
        );
        return;
      }

      const mappingsData = await mappingsRes.json();
      console.log("Cart - Sponsor mappings from DB:", mappingsData);

      // Handle nested array response
      let mappings = mappingsData;
      if (
        Array.isArray(mappingsData) &&
        mappingsData.length > 0 &&
        Array.isArray(mappingsData[0])
      ) {
        mappings = mappingsData[0];
      }

      // Find the mapping for this driver's sponsor
      if (Array.isArray(mappings)) {
        const currentMapping = mappings.find((m) => m.SponsorID === sponsorId);

        if (currentMapping) {
          const points = currentMapping.Points || 0;
          console.log("Cart - Found sponsor mapping with points:", points);

          // Set sponsorInfo and currentPoints from database results
          setSponsorInfo({
            SponsorID: sponsorId,
            CompanyName: currentMapping.SponsorName || `Sponsor ${sponsorId}`,
          });
          setCurrentPoints(points);
        } else {
          console.log("Cart - No mapping found for SponsorID:", sponsorId);
          setCurrentPoints(0);
        }
      }

      // Fetch cart items from database
      await loadCartFromDatabase(fetchedDriverId);
    } catch (error) {
      console.error("Cart - Error loading sponsor info:", error);
    } finally {
      setCartLoading(false);
    }
  };

  // Load cart items from database
  const loadCartFromDatabase = async (driverId) => {
    try {
      console.log("Cart - Fetching cart items for DriverID:", driverId);

      const cartUrl = `https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/cartAPI/getCartItems?DriverID=${driverId}`;
      const cartRes = await fetch(cartUrl);

      if (!cartRes.ok) {
        console.error("Cart - Failed to fetch cart items:", cartRes.status);
        return;
      }

      const cartData = await cartRes.json();
      console.log("Cart - Raw cart data from DB:", cartData);

      // Extract ProductID from cart data (database returns ProductID, not ITEM_ID)
      const itemIds = Array.isArray(cartData)
        ? cartData.map((item) => item.ProductID)
        : [];
      console.log("Cart - Extracted item IDs:", itemIds);

      if (itemIds.length === 0) {
        setCart([]);
        setProductsMap({});
        console.log("Cart - No items in cart");
        return;
      }

      // Enrich items with Best Buy API data
      await enrichCartItems(itemIds);
    } catch (error) {
      console.error("Cart - Error loading cart from database:", error);
      setCart([]);
      setProductsMap({});
    }
  };

  const enrichCartItems = async (itemIds) => {
    try {
      console.log("Cart - Enriching items with Best Buy API data...");
      const enrichedProducts = {};

      // Fetch product data from Best Buy API for each item
      for (const itemId of itemIds) {
        try {
          const bbUrl = `https://api.bestbuy.com/v1/products(sku=${itemId})?apiKey=3AsycyCu2CRRwvvnLtHYuBMV&sort=name.asc&show=name,salePrice,image&format=json`;
          const bbRes = await fetch(bbUrl);

          if (bbRes.ok) {
            const bbData = await bbRes.json();
            if (bbData.products && bbData.products.length > 0) {
              const product = bbData.products[0];
              enrichedProducts[itemId] = {
                ITEM_ID: itemId,
                ITEM_NAME: product.name || `Item ${itemId}`,
                ITEM_PRICE: product.salePrice || 0,
                ITEM_IMAGE: product.image || "",
                ITEM_STOCK: 1, // Default stock count
              };
              console.log(
                `Cart - Enriched item ${itemId}:`,
                enrichedProducts[itemId]
              );
            }
          } else {
            console.warn(
              `Cart - Failed to fetch Best Buy data for SKU ${itemId}`
            );
            // Fallback: create minimal product entry
            enrichedProducts[itemId] = {
              ITEM_ID: itemId,
              ITEM_NAME: `Item ${itemId}`,
              ITEM_PRICE: 0,
              ITEM_IMAGE: "",
              ITEM_STOCK: 1,
            };
          }
        } catch (error) {
          console.error(`Cart - Error enriching item ${itemId}:`, error);
          // Fallback: create minimal product entry
          enrichedProducts[itemId] = {
            ITEM_ID: itemId,
            ITEM_NAME: `Item ${itemId}`,
            ITEM_PRICE: 0,
            ITEM_IMAGE: "",
            ITEM_STOCK: 1,
          };
        }
      }

      setProductsMap(enrichedProducts);
      setCart(itemIds);
      console.log("Cart - Enrichment complete. Product map:", enrichedProducts);
    } catch (error) {
      console.error("Cart - Error enriching cart items:", error);
    }
  };

  // Not sure how to tie this into the existing setup, try this for now though:
  async function GetCartFromDB() {
    try {
      const response = await fetch(
        `https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/userAPI/updatePassword?DriverID=${cookies.MyDriverID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "Request URL:",
        `https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/userAPI/updatePassword?DriverID=${cookies.MyDriverID}`
      );

      // Debug: Log the response status and text
      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response text:", responseText);

      // Try to parse as JSON only if we got a response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        console.error("Raw response:", responseText);
        setMessage("Server error. Check console for details.");
        setMessageType("error");
        return;
      }

      if (!response.ok) {
        setMessage(
          data.message || "Cart fetch failed. Please check your credentials."
        );
        setMessageType("error");
        return;
      }

      // Store user info TODO: MAKE THIS USE COOKIES
      console.log("Cart fetch successful.");
      setMessage("Cart fetched successfully!");
      setMessageType("success");
    } catch (error) {
      console.error("Unknown error:", error);
      setMessage("Network error. Please try again.");
      setMessageType("error");
    }
  }

  useEffect(() => {
    // Cart is loaded from database in loadSponsorInfo()
  }, []);

  const remove = (itemId) => {
    // call the global helper created in Products.jsx
    if (window.__app_removeFromCart) {
      window.__app_removeFromCart(itemId);
    }
    // update local cart view
    setCart((prev) => {
      const next = [...prev];
      const idx = next.indexOf(itemId);
      if (idx !== -1) next.splice(idx, 1);
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });
    // update local products map for UI
    setProductsMap((prev) => {
      const p = prev[itemId];
      if (!p) return prev;
      const updated = {
        ...prev,
        [itemId]: { ...p, ITEM_STOCK: (p.ITEM_STOCK ?? 0) + 1 },
      };
      return updated;
    });
  };

  async function RemoveAllCartItems() {
    try {
      const response = await fetch(
        `https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/userAPI/updatePassword?UserID=${user?.UserID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "Request URL:",
        `https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/userAPI/updatePassword?UserID=${user?.UserID}`
      );

      // Debug: Log the response status and text
      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response text:", responseText);

      // Try to parse as JSON only if we got a response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        console.error("Raw response:", responseText);
        return;
      }

      if (!response.ok) {
        console.error("Cart item removal failed");
        return;
      }

      // Store user info TODO: MAKE THIS USE COOKIES
      console.log("Password change successful.");
    } catch (error) {
      console.error("Unknown error:", error);
    }
  }

  async function OrderConfirm() {
    // Use local cart to determine items to order
    let CartItems = cart;

    // REQUEST HANDLING START
    try {
      const response = await fetch(
        "https://63iutwxr2owp72oyfbetwyluaq0wakdm.lambda-url.us-east-1.on.aws/CartAPI/getCartItems",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userID: user?.UserID || user?.ID,
          }),
        }
      );

      // Debug: Log the response status and text
      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response text:", responseText);

      // Try to parse as JSON only if we got a response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        console.error("Raw response:", responseText);
        alert("Server error. Check console for details.");
        return;
      }

      if (!response.ok) {
        alert(data.message || "Failed to fetch cart items.");
        return;
      }

      CartItems = data;

      // Check if cart has items.
      if (!CartItems || CartItems.length === 0) {
        alert("No items in cart to order");
        return;
      } else {
        // TODO: Place an order (call server API) - currently just navigate
        // Build an order object and persist to localStorage (simple client-side orders)
        const prodRaw = localStorage.getItem("products") || "[]";
        let prods = [];
        try {
          prods = JSON.parse(prodRaw);
        } catch (e) {
          prods = [];
        }

        // Create snapshot of ordered items (including price at time of order)
        const items = cart.map((id) => {
          const p = prods.find((x) => x.ITEM_ID === id);
          return p
            ? {
                ITEM_ID: p.ITEM_ID,
                ITEM_NAME: p.ITEM_NAME,
                ITEM_PRICE: p.ITEM_PRICE,
              }
            : { ITEM_ID: id };
        });

        const order = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          user: user ?? null,
          items,
        };

        const ordersRaw = localStorage.getItem("orders") || "[]";
        let orders = [];
        try {
          orders = JSON.parse(ordersRaw);
        } catch (e) {
          orders = [];
        }
        orders.push(order);
        localStorage.setItem("orders", JSON.stringify(orders));

        // Clear cart
        localStorage.setItem("cart", JSON.stringify([]));
        setCart([]);

        // Persist products array (products were already mutated on addToCart in Products.jsx via localStorage)
        // But ensure any local productsMap changes are written back too
        try {
          const prodMap = productsMap;
          const prodsArray = Object.keys(prodMap).map((k) => prodMap[k]);
          localStorage.setItem("products", JSON.stringify(prodsArray));
        } catch (e) {
          // Ignore here
        }
        // --- Update driver points: deduct points for userid=1 by total cost of ordered items ---
        try {
          const driversRaw = localStorage.getItem("drivers");
          let driversList = [];
          if (driversRaw) {
            try {
              driversList = JSON.parse(driversRaw);
            } catch (e) {
              driversList = [];
            }
          }

          // If still no drivers persisted, fall back to the bundled seed JSON
          if (!Array.isArray(driversList) || driversList.length === 0) {
            driversList = Array.isArray(driversSeed)
              ? driversSeed.map((d) => ({ ...d }))
              : [];
          }

          // Calculate total cost of ordered items (sum of ITEM_PRICE)
          const totalCost = items.reduce(
            (sum, it) => sum + (Number(it.ITEM_PRICE) || 0),
            0
          );

          // Find driver with userid === 1 (numeric or string)
          const target = driversList.find(
            (d) => Number(d.userid) === 1 || d.userid === 1
          );
          if (target) {
            const current = Number(target.points) || 0;
            target.points = Math.max(0, current - totalCost);
          } else {
            // If no driver exists, create a minimal one for userid=1 with negative-adjusted points (clamped to 0)
            const pts = Math.max(0, 0 - totalCost);
            driversList.push({
              userid: 1,
              accountType: 1,
              firstName: "Driver",
              lastName: "One",
              birthday: "",
              email: "",
              points: pts,
            });
          }

          localStorage.setItem("drivers", JSON.stringify(driversList));
          // notify any open pages of drivers change
          try {
            window.dispatchEvent(new Event("driversUpdated"));
          } catch (e) {
            /* ignore */
          }
        } catch (e) {
          console.error("Failed to update driver points:", e);
        }

        // Remove items from cart. I can't test this because I can't actually reach this version of the page rn so here's hoping.
        RemoveAllCartItems();

        navigate("/DriverOrderConfirmation");
      }

      // Store user info (consider using localStorage or context)
      console.log("Cart retrieval successful.");
    } catch (error) {
      console.error("Unknown error:", error);
      alert("Error. Please try again.");
    }
    // REQUEST HANDLING STOP
  }

  return (
    <div>
      {DriverNavbar()}
      <div className="container my-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Your Cart</h3>
          {sponsorInfo && (
            <div className="text-end">
              <div className="alert alert-info mb-0 py-2 px-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="me-3">
                    <i className="fas fa-building me-2"></i>
                    <strong>Sponsor:</strong> {sponsorInfo.CompanyName}
                  </div>
                  <div>
                    <span className="badge bg-primary fs-6">
                      <i className="fas fa-coins me-1"></i>
                      {currentPoints} Points
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {userType !== 1 && !isAdminImpostorAsDriver ? (
          <p>
            The cart is only available to drivers. If you believe this is an
            error, please contact an administrator.
          </p>
        ) : (
          <>
            {cart.length === 0 ? (
              <div className="alert alert-info">
                <i className="fas fa-shopping-cart me-2"></i>
                Your cart is empty.
                <Link to="/DriverProducts" className="ms-2">
                  Browse products
                </Link>{" "}
                to get started.
              </div>
            ) : (
              <div className="list-group mb-3">
                {cart.map((id, index) => {
                  const item = productsMap[id];
                  return item ? (
                    <div
                      key={`${id}-${index}`}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div>
                          <strong>{item.ITEM_NAME}</strong>
                        </div>
                        <div className="text-muted small">
                          Price: ${item.ITEM_PRICE}
                        </div>
                      </div>
                      <div>
                        <button
                          className="btn btn-sm btn-danger me-2"
                          onClick={() => remove(item.ITEM_ID)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}
            <div className="d-flex">
              <button
                type="submit"
                onClick={OrderConfirm}
                className="btn btn-info me-2"
              >
                Order All
              </button>
              <button
                type="submit"
                onClick={RemoveAllCartItems}
                className="btn btn-info me-2"
              >
                Empty Cart
              </button>
              <Link to="/DriverHome" className="btn btn-secondary">
                Back
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
