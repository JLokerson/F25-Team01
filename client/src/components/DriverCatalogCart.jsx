import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import DriverNavbar from "./DriverNavbar";
import DriverProducts from "./DriverProducts";
import DriverCart from "./DriverCart";

/**
 * Two-tab interface combining DriverProducts.jsx (Catalog) and DriverCart.jsx (Cart)
 * Tab 1: Browse catalog and add items
 * Tab 2: View cart and manage items
 */
export default function DriverCatalogCart() {
  const [activeTab, setActiveTab] = useState("catalog"); // 'catalog' or 'cart'

  return (
    <div>
      {DriverNavbar()}
      <div className="container-fluid my-4">
        {/* Tab Navigation */}
        <ul className="nav nav-tabs mb-4" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "catalog" ? "active" : ""}`}
              id="catalog-tab"
              onClick={() => setActiveTab("catalog")}
              type="button"
              role="tab"
              aria-controls="catalog-content"
              aria-selected={activeTab === "catalog"}
            >
              📦 Catalog
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "cart" ? "active" : ""}`}
              id="cart-tab"
              onClick={() => setActiveTab("cart")}
              type="button"
              role="tab"
              aria-controls="cart-content"
              aria-selected={activeTab === "cart"}
            >
              🛒 Cart
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Catalog Tab */}
          <div
            className={`tab-pane fade ${
              activeTab === "catalog" ? "show active" : ""
            }`}
            id="catalog-content"
            role="tabpanel"
            aria-labelledby="catalog-tab"
          >
            <DriverProducts />
          </div>

          {/* Cart Tab */}
          <div
            className={`tab-pane fade ${
              activeTab === "cart" ? "show active" : ""
            }`}
            id="cart-content"
            role="tabpanel"
            aria-labelledby="cart-tab"
          >
            <DriverCart />
          </div>
        </div>
      </div>
    </div>
  );
}
