import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

// Get api key from .env file
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.error(`(!) Missing API_KEY in environment variables.`);
    process.exit(1);
}

// Set port from .env file or default to 4001
const PORT = Number(process.env.PORT) || 4001;
app.listen(PORT, () => {
    console.log(`(*) Port is running on ${PORT}`);
    console.log(`(*) Listening on port ${PORT}`);
});

// Base URL for Best Buy API
const BASE = 'https://api.bestbuy.com/v1';

// Axios instance with a hard timeout so requests don't hang forever
// and a base URL for Best Buy API
const http = axios.create({
  timeout: 8000,
  baseURL: BASE
});

/**
 * Generic Best Buy API caller
 * @param {'GET'} method
 * @param {string} path - e.g. '/categories(name="tv*")'
 * @param {Object} [params]
 * @returns {Promise<any>}
 */
export const bbCall = async (method, path, params = {}) => {
  const baseParams = {
    apiKey: API_KEY,
    format: 'json',
  }

  const requestOptions = {
    method, 
    url: path,
    params: baseParams
  }

  try {
    const response = await http.request(requestOptions);
    return response.data;
  } catch (err) {
    const upstreamStatus = err?.response?.status;
    const isTimeout = err?.code === 'ECONNABORTED';
    const message = err?.message || 'Message error';

    // Additional logging for debugging
    const wrapped = new Error(message);
    wrapped.status = upstreamStatus || 500;
    wrappped.reason = reason;
    throw wrapped;
  }
};

/** Normalize a string for robust comparisons */
const canon = s => {
  const base = (s ?? '').toString();
  const lower = base.toLowerCase();
  const trimmed = lower.trim();
  const normal= trimmed.replace(/\s+/g, ' ');
  return normal;
};

/**
 * Find a Best Buy category id by (fuzzy) visible name.
 * - exact normalized match first
 * - then 'startsWith'
 * - otherwise first returned category
 */
export const findCatId = async (name) => {
  const filter  = `name${name}*"`;
  const paths = `/categories(${filter})`;
  const params = {
    show: 'id,name',
  };

  const data = await bbCall('GET', path, params);
  const cats = data?.categories || [];
  if(!cats.length) {
    return null;
  }

  const q = canon(name);

  const exact = cats.find((c) => 
    canon(c.name) === q);
  if (exact) {
    return exact.id;
  }

  const starts = cats.find((c) => canon(c.name).startsWith(q));
  if (starts) {
    return starts.id;
  }

  return cats[0].id;
};

/**
 * Get N products from a category ID
 */
export const getProdByCatId = async (categoryId, n = 5) => {
  const filter = `categoryPath.id=${categoryId}`;
  const path = `/products(${filter})`;
  const params = {
    show: 'sku,name,salePrice,image,thumbnailImage,largeImage,url',
    pageSize,
    page: 1,
  };

  const response = await bbCall('GET', path, params);
  const products = Array.isArray(response?.products) ? response.products : [];

  // Keeping items with a valid linkable page
  const withURL = products.filter(p => !!p.url);
  return withURL;
};

/**
 * Normalize the product shape to what our client expects
 */
const normalizeProd = (p) => {
  const bestImage = p.largeImage | p.image || p.thumbnailImage || null;
  const safeUrl = p.url || `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(p.sku)}`;

  return {
    name: p.name || 'No Name',
    salePrice: p.salePrice || 0,
    image: bestImage,
    url: safeUrl
  };
};

/** 
 * Routes
 */

app.get('/', (req, res) => {
  res.send('ok');
});

/**
 * Main endpoint for looking up category name + returning products
*/
app.get('api/products', async (req, res) => {
  const rawCat = req.query.category;
  const catName = (rawCat ?? '').toString();

  console.log(`[products] category query="${catName}"`);
  if(!catName) {
    return res.status(400).json({ error: `Category name is required` });
  }

  try {
    const catId = await findCatId(catName);
    if(!catId) {
      return res.status(400).json({ error: `Category "${catName}" not found` });
    }

    const products = await getProdByCatId(catId, 5);
    const items = products.map(normalizeProd);
    
    return res.json({ products: items });
  } catch (err) {
    const status = err?.status || 500;
    const reason = err?.reason || 'Server error';
    console.error(`[products] ${reason}:`, err?.message);
    return res.status(status).json({
      error: reason,
      status,
      details: err?.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`(*) Port is running on ${PORT}`);
  console.log(`Listening on port ${PORT}`);
});