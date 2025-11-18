import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link, useNavigate } from "react-router-dom";
import DriverNavbar from "./DriverNavbar";
import driversSeed from "../content/json-assets/driver_sample.json";
import { CookiesProvider, useCookies } from "react-cookie";
import {
  getCartItems,
  removeCartItem,
  deleteUserCartItems,
} from "./MiscellaneousParts/ServerCall";

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

  // Check if admin is in impostor mode as driver
  const impostorMode = localStorage.getItem("impostorMode");
  const impostorType = localStorage.getItem("impostorType");
  const isAdminImpostorAsDriver = impostorMode && impostorType === "driver";

  // Cart is now stored as an array of objects with { MappingID, DriverID, ProductID }
  const [cart, setCart] = useState([]);
  const [productsMap, setProductsMap] = useState({});

  // Fetch cart items from backend
  async function GetCartFromDB() {
    try {
      const driverId = user?.DriverID || cookies.MyDriverID;
      if (!driverId) {
        setMessage("No driver ID found. Please log in as a driver.");
        setMessageType("error");
        return;
      }

      const response = await getCartItems(driverId);
      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Failed to fetch cart from server. Check the getCartItems API from server/DB_API/CartAPI.jsx"
        );
        setMessageType("error");
        return;
      }

      // Cart items from backend: { MappingID, DriverID, ProductID }
      setCart(data.items || []);
      setMessage("Cart loaded from server!");
      setMessageType("success");

      console.log("Cart loaded from backend:", data.items);
    } catch (error) {
      console.error("Error fetching cart from backend CartAPI.jsx:", error);
      setMessage("Network error. Please try again.");
      setMessageType("error");
    }
  }

  useEffect(() => {
    // Fetch cart from backend on component mount
    GetCartFromDB();

    // Also load products map from localStorage for display info
    const prodRaw = localStorage.getItem("products") || "[]";
    try {
      const prods = JSON.parse(prodRaw);
      const map = {};
      prods.forEach((p) => (map[p.ITEM_ID] = p));
      setProductsMap(map);
    } catch (e) {
      setProductsMap({});
    }
  }, [cookies.MyDriverID]);

  const remove = async (mappingId, productId) => {
    try {
      // Get driver ID
      const driverId = user?.DriverID || cookies.MyDriverID;
      if (!driverId) {
        setMessage("No driver ID found.");
        setMessageType("error");
        return;
      }

      // Call backend to remove item
      const result = await removeCartItem(mappingId, driverId);

      if (result.success) {
        // Update local cart state by removing the item with this MappingID
        setCart((prev) => prev.filter((item) => item.MappingID !== mappingId));

        // Update products map stock
        setProductsMap((prev) => {
          const updated = { ...prev };
          if (updated[productId]) {
            updated[productId] = {
              ...updated[productId],
              ITEM_STOCK: (updated[productId].ITEM_STOCK ?? 0) + 1,
            };
          }
          return updated;
        });

        setMessage(`Item removed from cart`);
        setMessageType("success");
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
      setMessage("Failed to remove item from cart.");
      setMessageType("error");
    }
  };

  async function RemoveAllCartItems() {
    try {
      const driverId = user?.DriverID || cookies.MyDriverID;
      if (!driverId) {
        setMessage("No driver ID found.");
        setMessageType("error");
        return;
      }

      const response = await deleteUserCartItems(driverId);
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to clear cart.");
        setMessageType("error");
        return;
      }

      // Clear local cart state
      setCart([]);
      setMessage("Cart cleared successfully!");
      setMessageType("success");

      console.log("Cart cleared from backend");
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  }

  async function OrderConfirm() {
    // Use local cart to determine items to order
    let CartItems = cart;

    // REQUEST HANDLING START
    try {
      const response = await fetch(
        "http://localhost:4000/CartAPI/getCartItems",
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
        <h3>Your Cart</h3>
        {userType !== 1 && !isAdminImpostorAsDriver ? (
          <p>
            The cart is only available to drivers. If you believe this is an
            error, please contact an administrator.
          </p>
        ) : (
          <>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <div className="list-group mb-3">
                {cart.map((cartItem) => {
                  const product = productsMap[cartItem.ProductID];
                  return (
                    <div
                      key={cartItem.MappingID}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div>
                          <strong>
                            {product?.ITEM_NAME || "Unknown Item"}
                          </strong>
                        </div>
                        <div className="text-muted small">
                          Price: ${product?.ITEM_PRICE || "N/A"} • Stock:{" "}
                          {product?.ITEM_STOCK ?? 0}
                        </div>
                      </div>
                      <div>
                        <button
                          className="btn btn-sm btn-danger me-2"
                          onClick={() =>
                            remove(cartItem.MappingID, cartItem.ProductID)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
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
