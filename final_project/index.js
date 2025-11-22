const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();
app.disable('x-powered-by');

app.use(express.json());

app.use("/customer", session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }));

app.use("/customer/auth/*", function auth(req, res, next) {
  // check the token exists
  if (!req.session || !req.session.accessToken) {
    return res.status(401).json({ message: "Unauthorized: No session token" });
  }

  const token = req.session.accessToken;

  // verify the token
  jwt.verify(token, "fingerprint_customer", (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden: Invalid token" });
    }

    // Save user in req and forward to next handler
    req.user = decoded;
    next();
  });
});

const PORT = 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

const httpServer = http.createServer(app);

httpServer.listen(PORT, () => {
  const { address, port } = httpServer.address();
  console.log(`🚀 ~ Server is running on http://${address}:${port}`);
});
