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
