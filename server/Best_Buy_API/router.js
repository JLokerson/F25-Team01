/**
 * Express router mounted at /api/bestbuy. Warpas category/product calls, normalizes payload, enforces page size and reads API_KEY variable from .env
 */
const path = require("path");

require("dotenv").config({
  path: process.env.BBY_ENV_PATH || path.resolve(__dirname, ".env"),
});
const express = require("express");
const axios = require("axios");

const router = express.Router();
const API_KEY = process.env.API_KEY;
const BB_BASE = "https://api.bestbuy.com/v1";

// Axios instance with a hard timeout so requests don't hang forever
const http = axios.create({ timeout: 8000 });

// Utility: sanitize pageSize
function clampPageSize(n, max = 100) {
  const v = Number(n || 0);
  if (!Number.isFinite(v) || v <= 0) return max;
  return Math.min(v, max);
}

// ----- Categories -----
// GET /api/bestbuy/categories
// Query options:
// - page, pageSize, show (defaults id,name,url)
// - cursor (use cursorMark traversal)
// - all=1 (aggregate all categories via cursor marks)
router.get("/categories", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "Missing API_KEY in environment" });
    }

    const show = (req.query.show || "id,name,url").toString();
    const pageSize = clampPageSize(req.query.pageSize, 100);
    const cursor = req.query.cursor ? req.query.cursor.toString() : undefined;
    const all = req.query.all === "1" || req.query.all === "true";
    const page = Number(req.query.page || 1);

    // Filter out 'image' from show since we add it later for certain categories
    // (Best Buy API doesn't have image field on categories, but we fetch images from products)
    const showForBB = show
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "image")
      .join(",");

    console.log(
      `[BB Categories] show=${show}, pageSize=${pageSize}, all=${all}, page=${page}, cursor=${cursor}`
    );
    const baseParams = { show: showForBB, format: "json", apiKey: API_KEY };

    // Use Mode 1: aggregate all pages via cursor marks
    if (all) {
      let cursorMark = "*";
      const seen = new Set();
      const items = [];
      let total = 0;
      let totalPages = 0;
      let loops = 0;
      const MAX_LOOPS = 3; // Limit to 3 pages (300 items max) to avoid timeout

      while (loops < MAX_LOOPS) {
        loops++;
        if (seen.has(cursorMark)) break; // prevent loops
        seen.add(cursorMark);

        const params = { ...baseParams, pageSize, cursorMark };
        console.log(
          `[BB Categories Loop ${loops}] Requesting with params:`,
          params
        );
        const { data } = await http.get(`${BB_BASE}/categories`, { params });
        const cats = data?.categories || [];
        console.log(
          `[BB Categories Loop ${loops}] Got ${cats.length} categories`
        );
        items.push(...cats);
        total = data?.total ?? total;
        totalPages = data?.totalPages ?? totalPages;

        const next = data?.nextCursorMark;
        if (!next || cats.length === 0) break;
        cursorMark = next;
      }

      // Fetch preview images for only the first few categories (to avoid rate limiting)
      // Best Buy API seems to aggressively rate-limit product searches, so we keep this minimal
      const MAX_CATEGORIES_WITH_IMAGES = 5; // Only first 5 categories to avoid 403s
      console.log(
        `[BB Categories] Fetching preview images for first ${Math.min(
          items.length,
          MAX_CATEGORIES_WITH_IMAGES
        )} categories (with delays to avoid rate limits)...`
      );
      const categoriesToImage = items.slice(0, MAX_CATEGORIES_WITH_IMAGES);

      // Fetch one at a time with 500ms delay to avoid aggressive rate limiting
      for (const cat of categoriesToImage) {
        cat.image = await getCategoryImageFromFirstProduct(cat.id);
        // Add delay between requests to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      console.log(`[BB Categories] Finished fetching preview images`);

      return res.json({
        mode: "all",
        count: items.length,
        total,
        totalPages,
        items,
      });
    }

    // Mode 2: cursor mark paging
    if (cursor) {
      const params = { ...baseParams, pageSize, cursorMark: cursor };
      const { data } = await http.get(`${BB_BASE}/categories`, { params });
      return res.json({
        mode: "cursor",
        total: data?.total,
        totalPages: data?.totalPages,
        nextCursorMark: data?.nextCursorMark,
        items: data?.categories || [],
      });
    }

    // Mode 3: plain page/pageSize
    const params = { ...baseParams, pageSize, page };
    const { data } = await http.get(`${BB_BASE}/categories`, { params });
    return res.json({
      mode: "page",
      currentPage: data?.currentPage,
      totalPages: data?.totalPages,
      from: data?.from,
      to: data?.to,
      total: data?.total,
      items: data?.categories || [],
    });
  } catch (err) {
    const status = err?.response?.status ?? 500;
    const message =
      err?.response?.data?.message || err?.message || "Best Buy API error";
    res.status(status).json({ error: message, status });
  }
});

// ----- Products (demo) -----
async function findCatId(name) {
  const filter = `name="${name}*"`;
  const params = {
    show: "id,name",
    format: "json",
    apiKey: API_KEY,
  };
  const { data } = await http.get(`${BB_BASE}/categories(${filter})`, {
    params,
  });
  const cats = data?.categories || [];
  if (!cats.length) return null;

  const canon = (s) =>
    (s ?? "").toString().toLowerCase().trim().replace(/\s+/g, " ");
  const q = canon(name);
  const exact = cats.find((c) => canon(c.name) === q);
  if (exact) return exact.id;
  const starts = cats.find((c) => canon(c.name).startsWith(q));
  if (starts) return starts.id;
  return cats[0].id;
}

async function getFiveProducts(categoryId) {
  const filter = `categoryPath.id=${categoryId}`;
  const params = {
    show: "sku,name,salePrice,image,thumbnailImage,largeImage,url",
    pageSize: 5,
    page: 1,
    format: "json",
    apiKey: API_KEY,
  };
  const url = `${BB_BASE}/products(${filter})`;
  const { data } = await http.get(url, { params });
  return data?.products || [];
}

/**
 * Fetch the first product image for a category to use as a preview.
 * This makes the category grid more visually appealing.
 */
async function getCategoryImageFromFirstProduct(categoryId) {
  try {
    const filter = `categoryPath.id=${categoryId}`;
    const params = {
      show: "image,largeImage,thumbnailImage",
      pageSize: 1,
      page: 1,
      format: "json",
      apiKey: API_KEY,
    };
    const url = `${BB_BASE}/products(${filter})`;
    const { data } = await http.get(url, { params });
    const products = data?.products || [];
    if (products.length > 0) {
      const product = products[0];
      const imageUrl =
        product.largeImage || product.image || product.thumbnailImage || null;
      if (imageUrl) {
        console.log(
          `[BB Categories] Got image for category ${categoryId}:`,
          imageUrl.substring(0, 60) + "..."
        );
      } else {
        console.log(
          `[BB Categories] No image field for category ${categoryId} product`
        );
      }
      return imageUrl;
    }
    console.log(`[BB Categories] No products found for category ${categoryId}`);
    return null;
  } catch (err) {
    console.warn(
      `[BB Categories] Failed to fetch image for category ${categoryId}:`,
      err.message
    );
    return null;
  }
}

// GET /api/bestbuy/products?category=Phones
router.get("/products", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "Missing API_KEY in environment" });
    }

    const catName = (req.query.category || "").toString();
    if (!catName)
      return res.status(400).json({ error: "Category name is required" });

    const catId = await findCatId(catName);
    if (!catId)
      return res.status(404).json({ error: `Category "${catName}" not found` });

    const products = await getFiveProducts(catId);
    const normalized = products.map((p) => ({
      sku: p.sku,
      name: p.name,
      salePrice: p.salePrice,
      image: p.largeImage || p.image || p.thumbnailImage || null,
      url:
        p.url ||
        (p.sku
          ? `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(
              p.sku
            )}`
          : null),
    }));

    res.json({ categoryId: catId, items: normalized });
  } catch (err) {
    const status = err?.response?.status ?? 500;
    const message =
      err?.response?.data?.message || err?.message || "Best Buy API error";
    res.status(status).json({ error: message, status });
  }
});

module.exports = router;
