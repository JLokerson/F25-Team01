// server/index.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000; // or any other available port

app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Enable parsing JSON request bodies

// Example API endpoint
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from the Node.js backend!' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});