const path = require('path');

require('dotenv').config({ path: process.env.BBY_ENV_PATH || path.resolve(__dirname, '.env') });
const express = require('express');
const axios = require('axios');

const router = express.Router();
console.log('hello world');
const API_KEY = process.env.API_KEY || '3AsycyCu2CRRwvvnLtHYuBMV';
console.log(`(#) 3AsycyCu2CRRwvvnLtHYuBMV`);
const BB_BASE = 'https://api.bestbuy.com/v1';

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
router.get('/categories', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'Missing API_KEY in environment' });
    }

    const show = (req.query.show || 'id,name,url').toString();
    const pageSize = clampPageSize(req.query.pageSize, 100);
    const cursor = req.query.cursor ? req.query.cursor.toString() : undefined;
    const all = req.query.all === '1' || req.query.all === 'true';
    const page = Number(req.query.page || 1);

    const baseParams = { show, format: 'json', apiKey: API_KEY };

    // Use Mode 1: aggregate all pages via cursor marks
    if (all) {
      let cursorMark = '*';
      const seen = new Set();
      const items = [];
      let total = 0;
      let totalPages = 0;
      let loops = 0;
      const MAX_LOOPS = 10000;

      while (loops < MAX_LOOPS) {
        loops++;
        if (seen.has(cursorMark)) break; // prevent loops
        seen.add(cursorMark);

        const params = { ...baseParams, pageSize, cursorMark };
        const { data } = await http.get(`${BB_BASE}/categories`, { params });
        const cats = data?.categories || [];
        items.push(...cats);
        total = data?.total ?? total;
        totalPages = data?.totalPages ?? totalPages;

        const next = data?.nextCursorMark;
        if (!next || cats.length === 0) break;
        cursorMark = next;
      }

      return res.json({
        mode: 'all',
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
        mode: 'cursor',
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
      mode: 'page',
      currentPage: data?.currentPage,
      totalPages: data?.totalPages,
      from: data?.from,
      to: data?.to,
      total: data?.total,
      items: data?.categories || [],
    });
  } catch (err) {
    const status = err?.response?.status ?? 500;
    const message = err?.response?.data?.message || err?.message || 'Best Buy API error';
    res.status(status).json({ error: message, status });
  }
});

// ----- Products (demo) -----
async function findCatId(name) {
  const filter = `name="${name}*"`;
  const params = {
    show: 'id,name',
    format: 'json',
    apiKey: API_KEY,
  };
  const { data } = await http.get(`${BB_BASE}/categories(${filter})`, { params });
  const cats = data?.categories || [];
  if (!cats.length) return null;

  const canon = (s) => (s ?? '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
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
    show: 'sku,name,salePrice,image,thumbnailImage,largeImage,url',
    pageSize: 5,
    page: 1,
    format: 'json',
    apiKey: API_KEY,
  };
  const url = `${BB_BASE}/products(${filter})`;
  const { data } = await http.get(url, { params });
  return data?.products || [];
}

// GET /api/bestbuy/products?category=Phones
router.get('/products', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'Missing API_KEY in environment' });
    }

    const catName = (req.query.category || '').toString();
    if (!catName) return res.status(400).json({ error: 'Category name is required' });

    const catId = await findCatId(catName);
    if (!catId) return res.status(404).json({ error: `Category "${catName}" not found` });

    const products = await getFiveProducts(catId);
    const normalized = products.map((p) => ({
      sku: p.sku,
      name: p.name,
      salePrice: p.salePrice,
      image: p.largeImage || p.image || p.thumbnailImage || null,
      url: p.url || (p.sku ? `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(p.sku)}` : null),
    }));

    res.json({ categoryId: catId, items: normalized });
  } catch (err) {
    const status = err?.response?.status ?? 500;
    const message = err?.response?.data?.message || err?.message || 'Best Buy API error';
    res.status(status).json({ error: message, status });
  }
});

module.exports = router;