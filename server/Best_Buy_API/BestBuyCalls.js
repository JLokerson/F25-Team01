// Import from package.json
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;
const PORT = Number(process.env.PORT);
console.log(`Port is ${PORT}\n`);
const BB_BASE = 'https://api.bestbuy.com/v1';

// Axios instance with a hard timeout so requests don't hang forever
const http = axios.create({ timeout: 8000 });

/// Finds the category ID given a category name
async function findCatId(name) {
  const filter = `name="${name}*"`;
  const params = {
    show: 'id,name',
    format:'json',
    apiKey:API_KEY
  };
  const { data } = await http.get(`${BB_BASE}/categories(${filter})`, { params });
  const cats = data?.categories || [];
  if (!cats.length) {
      return null;
  }

  const canon = s => {
    const base = (s ?? '').toString();
    const lower = base.toLowerCase();
    const trimmed = lower.trim();
    const normal= trimmed.replace(/\s+/g, ' ');
    return normal;
  };

  const q = canon(name);
  
  // Looks for match between user's normalized input and normalized name
  const exact = cats.find(c => canon(c.name) === q);
  if (exact) {
    return exact.id;
  }
  
  // Looks for match between users normalized input starts with the entire query string
  const starts = cats.find(c => canon(c.name).startsWith(q));
  if (starts) {
    return starts.id;
  }

  return cats[0].id;
}

/// Gets five products for a given category ID
async function getFiveProducts(categoryId) {
  // This will go into the base URL
  const filter = `categoryPath.id=${categoryId}`;
  const params = {
    show: 'sku,name,salePrice,image,thumbnailImage,largeImage,url',
    pageSize: 5,
    page: 1,
    format: 'json',
    apiKey: API_KEY
  };
  // This is the path portion
  const path = `/products(${filter})`;
  // This is the base url + path url
  const url = `${BB_BASE}${path}`;

  // Ignore products with a null url
  if(!url.url) {
    console.error('A product from the BB API returned an null URL');
  }

  // Params defined earlier
  const options = { params };
  const response = await http.get(url, options);
  const data = response.data;

  return data?.products || [];
}

/// Bread and butter, this function returns the details of the products
/// Looks up category by name and returns the first 5 products 
app.get('/api/products', async (req, res) => {
  try {
    // Request for a category name and store it as a string
    const catName = (req.query.category || '').toString();
    console.log(`[products] category query=\"${catName}\"`);
    // Error handling if nothing returns
    if (!catName) {
        console.error("(!) Failed to fetch category name");
        return res.status(400).json({ error: "Category name is required" });
    }
    
    // Request for category ID w error handling
    const catId = await findCatId(catName);
    if (!catId) {
      console.error(`(!) Failed to get category ID but did successfully get ${catName}`);
      return res.status(400).json({ error: `Category "${catName}" not found` });
    }
    
    // Take the id from catId and request 5 products
    const products = await getFiveProducts(catId);

    // Mapping a stable img url, idk what 'mapping' means or any stable img stuff
    const normalized = products.map(p => ({
      sku: p.sku,
      name: p.name,
      salePrice: p.salePrice,
      // Go though the different img options prioritizing the largeImage
      image: p.largeImage || p.image || p.thumbnailImage || null,
      // Direct link to the product page; fallback to a SKU search if missing
      url: p.url || `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(p.sku)}`
    }));

    // Response of the res, if this fails it goes to the catch() statement
    res.json({ categoryId: catId, items: normalized });
  } catch (err) {
    const status = err?.response?.status ??  500;
    const reason = err?.code === 'ECONNABORTED' ? 'Upstream timeout' : 'Best Buy API error';
    console.error(`[products] ${reason}:`, err?.message);
    res.status(status).json({
      error: reason,
      status,
      details: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
