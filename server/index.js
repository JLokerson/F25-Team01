const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const app = express();
const port = process.env.SERVER_PORT || 4000; 

// More specific CORS configuration
const corsOptions = {
  origin: '*', // You can restrict this to 'http://localhost:3000' for better security
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'], // Explicitly allow Content-Type
};

app.use(cors(corsOptions)); // Enable CORS for cross-origin requests
app.use(express.json()); // Enable parsing JSON request bodies

// Add body parser middleware for form data as well
app.use(express.urlencoded({ extended: true }));

// Load routers
var userAPIRouter = require("./DB_API/userAPI").router;
var adminAPIRouter = require("./DB_API/adminAPI").router;
var sponsorAPIRouter = require("./DB_API/sponsorAPI").router;
var driverAPIRouter = require("./DB_API/driverAPI").router;
var cartAPIRouter = require("./DB_API/cartAPI").router;

// Mount API routers (same simple pattern as before)
app.use("/userAPI", userAPIRouter);
app.use("/adminAPI", adminAPIRouter);
app.use("/sponsorAPI", sponsorAPIRouter);
app.use("/driverAPI", driverAPIRouter);
app.use("/cartAPI", cartAPIRouter);

// Serve static files from the 'public' directory
app.use(express.static(path.resolve(__dirname, '../../public')));

// Add a test route to verify sponsorAPI is working
app.get('/test-sponsor-api', (req, res) => {
  res.json({ message: 'Sponsor API test route working' });
});

// Serve about.html at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, './about.html'));
});

// Example API endpoint
app.get('/hello/ohm', (req, res) => {
  res.json({ message: 'Ohm says hello from the Node.js backend!' });
});

app.get("/hello", (req, res) => {
  res.send("Hello World");
});

// Optional: Handle favicon.ico requests to avoid 404 errors in browser
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Test route to verify driverAPI is mounted correctly
app.get('/test-driver-api', (req, res) => {
  res.json({ message: 'Driver API test route working' });
});

if (port) {
  console.log("Port found - Running local host server");
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
} else {
  // This block will never be reached now, but you can keep it for serverless compatibility
  console.log("Port undefined - Running serverless server");
  module.exports = app;
}