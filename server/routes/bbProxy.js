const express = require("express");
const axios = require("axios");

const router = express.Router();

const API_KEY = process.env.API_KEY;
const BB_BASE = "https://api.bestbuy.com/v1";

function clampSize(value, fallback = 30, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}

function sanitizeNameTerm(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = trimmed.endsWith("*") ? trimmed : `${trimmed}*`;
  return normalized.replace(/"/g, "");
}

router.get("/categories", async (req, res) => {
  if (!API_KEY) {
    return res
      .status(500)
      .json({ message: "Missing API_KEY environment variable." });
  }

  const nameFilter = sanitizeNameTerm(req.query.name || "");
  const pageSize = clampSize(req.query.pageSize);
  const page = Number(req.query.page || 1);
  const sort = (req.query.sort || "name.asc").toString();
  const show = (
    req.query.show || "id,name,url,image,thumbnailImage"
  ).toString();

  let endpoint = `${BB_BASE}/categories`;
  if (nameFilter) {
    endpoint = `${BB_BASE}/categories(name="${nameFilter}")`;
  }

  const params = {
    format: "json",
    apiKey: API_KEY,
    pageSize,
    page,
    sort,
    show,
  };

  if (req.query.cursorMark) {
    params.cursorMark = req.query.cursorMark;
  }

  try {
    const { data } = await axios.get(endpoint, {
      params,
      timeout: 8000,
    });

    const categories = Array.isArray(data?.categories) ? data.categories : [];

    res.json({
      query: nameFilter ? req.query.name : null,
      page: data?.currentPage ?? page,
      totalPages: data?.totalPages ?? 1,
      total: data?.total ?? categories.length,
      nextCursorMark: data?.nextCursorMark ?? null,
      items: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        url: cat.url ?? null,
        image:
          cat.image ||
          cat.thumbnailImage ||
          (Array.isArray(cat.images) && cat.images.length > 0
            ? cat.images[0]
            : null),
      })),
    });
  } catch (error) {
    const status = error?.response?.status ?? 500;
    const message =
      error?.response?.data?.message || error.message || "Best Buy proxy error";
    res.status(status).json({ message, status });
  }
});

module.exports = router;
