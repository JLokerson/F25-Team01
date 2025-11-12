/**
 * Irrelevant for now (Worry about this later)
 */

import React from "react";

export default function CatalogItemCard({
  product,
  actionLabel = "Add",
  onAction,
  small = false,
  enabled = true,
  meta,
}) {
  const containerStyle = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 12,
    textAlign: "center",
    transition: "opacity 200ms ease, filter 200ms ease",
    opacity: enabled ? 1 : 0.45,
    filter: enabled ? "none" : "grayscale(80%)",
    background: enabled ? "white" : "#f8f9fa",
  };

  const price =
    product.salePrice ??
    product.ITEM_PRICE ??
    product.price ??
    product.SalePrice ??
    null;

  return (
    <div style={containerStyle}>
      <div
        style={{
          height: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <img
          src={
            product.image ||
            product.ITEM_IMG ||
            "https://via.placeholder.com/150"
          }
          alt={product.name || product.ITEM_NAME}
          style={{ maxHeight: 110, maxWidth: "100%" }}
        />
      </div>
      <div style={{ fontWeight: 700, fontSize: small ? 13 : 14 }}>
        {product.name || product.ITEM_NAME}
      </div>
      {meta && (
        <div style={{ fontSize: small ? 11 : 12, color: "#6c757d" }}>{meta}</div>
      )}
      {price !== null && (
        <div
          style={{
            fontSize: small ? 12 : 14,
            color: "#b12704",
            marginTop: 6,
          }}
        >
          ${price}
        </div>
      )}
      {onAction && (
        <div style={{ marginTop: 8 }}>
          <button
            className={`btn btn-sm ${
              actionLabel === "Add" ? "btn-primary" : "btn-outline-secondary"
            }`}
            onClick={() => onAction(product)}
            disabled={!enabled}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
