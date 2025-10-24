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

// Load routers with better error handling
console.log('Loading API routers...');

var userAPIRouter = require("./DB_API/userAPI").router;
var adminAPIRouter = require("./DB_API/adminAPI").router;
var sponsorAPIRouter = require("./DB_API/sponsorAPI").router;

// Handle driverAPI with extensive debugging
let driverAPIRouter;
console.log('=== Loading driverAPI ===');
try {
    console.log('Requiring driverAPI module...');
    const driverModule = require("./DB_API/driverAPI");
    console.log('driverAPI module loaded:', typeof driverModule);
    console.log('driverAPI module keys:', Object.keys(driverModule));
    
    if (driverModule.router) {
        driverAPIRouter = driverModule.router;
        console.log('Using driverModule.router');
    } else if (typeof driverModule === 'function' && driverModule.stack) {
        driverAPIRouter = driverModule;
        console.log('Using driverModule directly as router');
    } else {
        console.error('driverAPI module does not export a valid router');
        throw new Error('Invalid router export from driverAPI');
    }
    
    console.log('driverAPI loaded successfully, type:', typeof driverAPIRouter);
    console.log('driverAPI is Express router:', driverAPIRouter && typeof driverAPIRouter.use === 'function');
    console.log('driverAPI stack length:', driverAPIRouter.stack ? driverAPIRouter.stack.length : 'no stack');
    
    if (driverAPIRouter.stack) {
        console.log('driverAPI routes preview:');
        driverAPIRouter.stack.slice(0, 5).forEach((layer, i) => {
            if (layer.route) {
                console.log(`  ${i}: ${Object.keys(layer.route.methods)} ${layer.route.path}`);
            }
        });
    }
    
} catch (error) {
    console.error('Critical error loading driverAPI:', error);
    console.error('Stack trace:', error.stack);
    
    // Create a functional dummy router with proper error responses
    driverAPIRouter = express.Router();
    driverAPIRouter.get('/health', (req, res) => {
        res.status(503).json({ 
            status: 'error', 
            message: 'driverAPI failed to load', 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    });
    driverAPIRouter.all('*', (req, res) => {
        res.status(503).json({ 
            error: 'driverAPI module failed to load', 
            details: error.message,
            path: req.path,
            method: req.method
        });
    });
}

var cartAPIRouter = require("./DB_API/cartAPI").router;

console.log('=== Mounting API routers ===');
app.use("/userAPI", userAPIRouter);
app.use("/adminAPI", adminAPIRouter);
app.use("/sponsorAPI", sponsorAPIRouter);
app.use("/driverAPI", driverAPIRouter);
app.use("/cartAPI", cartAPIRouter);

console.log('All routers mounted successfully');

// Test the driverAPI endpoints immediately after mounting
console.log('=== Testing driverAPI after mounting ===');
setTimeout(() => {
    const http = require('http');
    
    const testEndpoint = (path, method = 'GET') => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
            timeout: 5000
        };
        
        console.log(`Testing ${method} ${path}...`);
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`✓ ${method} ${path}: Status ${res.statusCode}`);
                if (res.statusCode !== 200) {
                    console.log(`  Response: ${data}`);
                }
            });
        });
        
        req.on('error', (e) => {
            console.log(`✗ ${method} ${path}: Error ${e.message}`);
        });
        
        req.on('timeout', () => {
            console.log(`✗ ${method} ${path}: Timeout`);
            req.destroy();
        });
        
        req.end();
    };
    
    // Test multiple endpoints
    testEndpoint('/driverAPI/health');
    testEndpoint('/driverAPI/test');
    testEndpoint('/driverAPI/getAllDrivers');
    testEndpoint('/driverAPI/testAddExistingUserAsDriver');
    
}, 2000);

// List all registered routes after mounting
console.log('\n=== All registered routes ===');
app._router.stack.forEach(function(middleware) {
    if(middleware.route) {
        // Regular route
        console.log(middleware.route.path);
    } else if(middleware.name === 'router') {
        // Router middleware
        console.log('Router at:', middleware.regexp.source);
        if(middleware.handle && middleware.handle.stack) {
            middleware.handle.stack.forEach(function(handler) {
                if(handler.route) {
                    console.log('  Route:', handler.route.path, handler.route.methods);
                }
            });
        }
    }
});
console.log('=== End routes list ===\n');

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
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    
    // Test driverAPI after a longer delay to ensure everything is loaded
    setTimeout(() => {
      console.log('=== Post-startup driverAPI test ===');
      const http = require('http');
      
      const testHealthCheck = () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/driverAPI/health',
          method: 'GET',
          timeout: 3000
        };
        
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            console.log(`driverAPI health check: Status ${res.statusCode}`);
            console.log(`Response: ${data}`);
            if (res.statusCode === 200) {
              console.log('✅ driverAPI is now accessible');
            } else {
              console.log('❌ driverAPI health check failed');
            }
          });
        });
        
        req.on('error', (e) => {
          console.log(`❌ driverAPI health check error: ${e.message}`);
        });
        
        req.on('timeout', () => {
          console.log('❌ driverAPI health check timeout');
          req.destroy();
        });
        
        req.end();
      };
      
      testHealthCheck();
    }, 5000); // Wait 5 seconds after server start
  });
} else {
  // This block will never be reached now, but you can keep it for serverless compatibility
  console.log("Port undefined - Running serverless server");
  module.exports = app;
}