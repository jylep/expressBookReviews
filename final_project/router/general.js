const express = require('express');
const bcrypt = require('bcrypt');
const Fuse = require('fuse.js');

let books = require('./booksdb.js');
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
let salt = require("./auth_users.js").bcryptSalt;
const public_users = express.Router();

const fuseOptions = {
  threshold: 0.3,
  keys: ["author", "title"]
};
const bookRegistry = new Fuse(Object.values(books), fuseOptions);

public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  // Basic conditions
  if (!username || !password) {
    return res.status(400).json({ message: "You must provide a username AND a password to register" });
  }

  // Error if username already exists
  if (!isValid(username)) {
    return res.status(409).json({ message: "There is already an existing user with that username. Usernames must be unique" });
  }

  // Store user with hashed password
  const hashedPwd = bcrypt.hashSync(password, salt);
  users.push({ username, passwordHash: hashedPwd });

  return res.status(200).json({ message: `user '${username}' registered.` });
});

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  try {
    // Simulate API call
    const fetchedBooks = await Promise.resolve(books);

    return res.status(200).json(fetchedBooks);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong whie fetching books" });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  const { isbn } = req.params;

  try {
    const book = await Promise.resolve(books[isbn]);

    if (!book) {
      return res.status(404).json({ message: `There was no book found for ISBN: ${isbn}` });
    } else {
      return res.status(200).json(book);
    }
  } catch (error) {
    return res.status(500).json({ message: `Something went wrong whie fetching a book with ISBN: ${isbn}` });
  }
});

// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  const { author } = req.params;

  try {
    // Search for exact match
    const booksFromAuthor = await Promise.resolve(Object.values(books).filter(book => book.author.toLowerCase() === author.toLowerCase()));

    if (booksFromAuthor.length === 0) {
      // Just in case of typos, fuzzily search for author
      const fuzzySearchResults = bookRegistry.search(author);

      if (fuzzySearchResults.length > 0) {
        return res.status(200).json({
          message: `We could not find an exact match for: '${author}'`,
          items: fuzzySearchResults.map(result => result.item)
        });
      }

      return res.status(404).json({ message: `No books found for author: '${author}'.` });
    }

    return res.status(200).json(booksFromAuthor);
  } catch (error) {
    return res.status(500).json({ message: `There was an error fetching books for author: ${author}` });
  }
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  const { title } = req.params;

  try {
    const booksFromTitle = await Promise.resolve(Object.values(books).filter(book => book.title.toLowerCase() === title.toLowerCase()));

    if (booksFromTitle.length === 0) {
      // Just in case of typos, fuzzily search for title
      const fuzzySearchResults = bookRegistry.search(title);

      if (fuzzySearchResults.length > 0) {
        return res.status(200).json({
          message: `We could not find an exact match for: '${title}'`,
          items: fuzzySearchResults.map(result => result.item)
        });
      }
      return res.status(404).json({ message: `No books found for title: '${title}'.` });
    }

    return res.status(200).json(booksFromTitle);
  } catch (error) {
    return res.status(500).json({ message: `There was an error fetching books for title: ${title}` });
  }
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const { isbn } = req.params;

  if (!books[isbn]) {
    return res.status(404).json({ message: `There was no book found for ISBN: ${isbn}` });
  } else {
    const reviews = books[isbn].reviews;

    return res.status(200).json(reviews);
  }
});

module.exports.general = public_users;
