//This file is for data cleanup and maintenance related database api calls.
const db = require('./db'); //shared database connection pool

/**
 * Basic health check for the cleanup API
 * @returns {Promise<object>} Status information
 */
async function healthCheck() {
    try {
        console.log("Data cleanup API health check");
        return { status: "OK", message: "Data cleanup API is operational" };
    } catch (error) {
        console.error("Data cleanup API health check failed:", error);
        throw error;
    }
}

var express = require("express");
var router = express.Router();

// Ensure JSON body parsing for all routes in this router
router.use(express.json());

router.get("/health", async (req, res, next) => {
    try {
        const status = await healthCheck();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Health check failed' });
    }
});

module.exports = { router };
