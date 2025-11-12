// Import for AWS Lambda
/**
 * Wraps express for AWS Lambda. Confirms how /api/bestbuy is exposed in production via the Lambda URL your client calls.
 */
const serverless = require("serverless-http");
const app = require("./index");
module.exports.handler = serverless(app);
