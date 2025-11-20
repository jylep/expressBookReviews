const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./final_project/router/auth_users.js').authenticated;
const genl_routes = require('./final_project/router/general.js').general;

const app = express();
app.disable('x-powered-by');

app.use(express.json());

app.use("/customer", session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }));

app.use("/customer/auth/*", function auth(req, res, next) {
  //Write the authenication mechanism here
});

const PORT = 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

const httpServer = http.createServer(app);

httpServer.listen(PORT, () => {
  const {address, port} = httpServer.address();
  console.log(`🚀 ~ Server is running on http://${address}:${port}`)
})
