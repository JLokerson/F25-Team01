const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

const userAPIRouter = require('./DB_API/userAPI')

// Serve static files from the monorepo public directory
app.use(express.static(path.resolve(__dirname, '../../public')))
app.use('/userAPI', userAPIRouter)

// --- Data store helpers ---
const dataDir = path.join(__dirname, 'data')
const dataPath = path.join(dataDir, 'products.json')
const seedPath = path.resolve(__dirname, '../client/public/products.json')

function ensureDataFile() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    if (!fs.existsSync(dataPath)) {
      let products = []
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, 'utf8')
        products = JSON.parse(raw)
      }
      // run field migration before first write
      for (const p of products) {
        if (p.popularity == null) p.popularity = 0
        if (p.sales == null) p.sales = 0
        if (p.rating == null) p.rating = 0
        if (p.ITEM_STOCK == null) p.ITEM_STOCK = 0
      }
      const tmp = dataPath + '.tmp'
      fs.writeFileSync(tmp, JSON.stringify(products, null, 2), 'utf8')
      fs.renameSync(tmp, dataPath)
    }
  } catch (err) {
    console.error('Failed to ensure data file', err)
  }
}

function readProducts() {
  ensureDataFile()
  try {
    const raw = fs.readFileSync(dataPath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('readProducts error', err)
    return []
  }
}

function writeProducts(products) {
  try {
    const tmp = dataPath + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(products, null, 2), 'utf8')
    fs.renameSync(tmp, dataPath)
  } catch (err) {
    console.error('writeProducts error', err)
  }
}

// --- Migration on boot: ensure fields exist ---
(function migrate() {
  const products = readProducts()
  let changed = false
  for (const p of products) {
    if (p.popularity == null) { p.popularity = 0; changed = true }
    if (p.sales == null) { p.sales = 0; changed = true }
    if (p.rating == null) { p.rating = 0; changed = true }
    if (p.ITEM_STOCK == null) { p.ITEM_STOCK = 0; changed = true }
  }
  if (changed) writeProducts(products)
})()

// --- API Endpoints ---
// List products with sorting
app.get('/api/products', (req, res) => {
  const { sort } = req.query
  const products = readProducts()
  let out = [...products]
  if (sort === 'popular') out.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
  else if (sort === 'rating_asc') out.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0))
  else if (sort === 'rating_desc') out.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  else if (sort === 'sales_desc') out.sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0))
  res.json(out)
})

// Top sales
app.get('/api/products/top-sales', (req, res) => {
  const limit = Math.max(1, Math.min(parseInt(req.query.limit || '10', 10), 100))
  const products = readProducts()
  const out = [...products]
    .sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0))
    .slice(0, limit)
  res.json(out)
})

// Popularity click increment
app.post('/api/products/:id/click', (req, res) => {
  const id = Number(req.params.id)
  const products = readProducts()
  const p = products.find(x => Number(x.ITEM_ID) === id)
  if (!p) return res.status(404).json({ error: 'not_found' })
  p.popularity = (p.popularity ?? 0) + 1
  writeProducts(products)
  res.json({ ok: true, popularity: p.popularity })
})

// Checkout: decrement stock, increment sales
app.post('/api/checkout', (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : []
  if (!items.length) return res.status(400).json({ error: 'empty_cart' })

  const products = readProducts()

  // validate stock
  for (const it of items) {
    const id = Number(it.id)
    const qty = Number(it.qty || 0)
    const p = products.find(x => Number(x.ITEM_ID) === id)
    if (!p) return res.status(404).json({ error: 'not_found', id })
    if (qty <= 0) return res.status(400).json({ error: 'bad_qty', id })
    if ((p.ITEM_STOCK ?? 0) < qty) {
      return res.status(400).json({ error: 'insufficient_stock', id, available: p.ITEM_STOCK ?? 0 })
    }
  }

  // apply changes
  for (const it of items) {
    const id = Number(it.id)
    const qty = Number(it.qty)
    const p = products.find(x => Number(x.ITEM_ID) === id)
    p.ITEM_STOCK -= qty
    p.sales = (p.sales ?? 0) + qty
  }

  writeProducts(products)
  res.json({ ok: true })
})

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`)
})