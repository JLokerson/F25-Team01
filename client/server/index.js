const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 5000; // Can change the port if needed

app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Enable parsing JSON request bodies

// Serve static files from the 'public' directory
app.use(express.static(path.resolve(__dirname, '../../public')));

// Serve about.html at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../public/about.html'));
});

// Example API endpoint
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from the Node.js backend!' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});