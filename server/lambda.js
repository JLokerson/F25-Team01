//import for aws lambda
const serverless = require('serverless-http');
const app = require("./index");
module.exports.handler = serverless(app);