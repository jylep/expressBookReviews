const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();
const salt = bcrypt.genSaltSync(10);

let users = [];

const isValid = (username) => {
  return !users.some(user => user.username === username);
};

const registeredUser = (username, password) => {
  return users.some(user => user.username === username && bcrypt.hashSync(password, salt) === user.passwordHash);
};

//only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "You must provide a username AND a password to login" });
  }

  if (registeredUser(username, password)) {
    const user = users.find(user => user.username === username);
    const token = jwt.sign(user, "fingerprint_customer", { expiresIn: "1h" });

    req.session = req.session || {};
    req.session.accessToken = token;

    return res.status(200).json({ message: `${username} logged in successfully.`, token });
  } else {
    return res.status(401).json({ message: "Invalid username or password" });
  }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const { review } = req.body;

  // Check if user is in request after middleware
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: Please login first" });
  }

  if (!review) {
    return res.status(400).json({ message: "The review is missing. Please try again with the review" });
  }

  const username = req.user.username;

  // Check if the book exists
  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  // Add or update the review
  books[isbn].reviews = books[isbn].reviews || {};
  books[isbn].reviews[username] = review;

  return res.status(200).json({ message: `Review added/updated for book ${isbn}`, reviews: books[isbn].reviews });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;

  // Check if user is in request after middleware
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: Please login first" });
  }

  const username = req.user.username;

  // Check if the book exists
  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({ message: "Review deleted successfully." });

});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
module.exports.bcryptSalt = salt;