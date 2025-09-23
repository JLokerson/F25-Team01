// server/DB_API/userAPI.js
const express = require('express');
const router = express.Router();

// 🔎 health check so you can curl it right away
router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'userAPI' });
});

/*
 // ✅ Example: add endpoints here later
 // GET /userAPI/users
 router.get('/users', async (req, res) => {
   try {
     // const db = require('../testAPI'); // if/when you want DB access
     // db.query('SELECT * FROM users', (err, rows) => { ... });
     res.json([{ id: 1, name: 'demo' }]);
   } catch (e) {
     res.status(500).json({ ok: false, error: String(e) });
   }
 });
*/

module.exports = router;

