const { createProxyMiddleware } = require("http-proxy-middleware");

const target =
  process.env.REACT_APP_SERVER_URL?.trim() || "http://localhost:4000";

const contexts = [
  "/userAPI",
  "/adminAPI",
  "/sponsorAPI",
  "/driverAPI",
  "/cartAPI",
  "/catalogAPI",
  "/bb",
];

module.exports = function setupProxy(app) {
  contexts.forEach((context) => {
    app.use(
      context,
      createProxyMiddleware({
        target,
        changeOrigin: true,
        logLevel: "warn",
      })
    );
  });
};
