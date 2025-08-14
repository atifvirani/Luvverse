// server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const socketio = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------- SESSION SETUP -------------------
app.use(session({
  secret: process.env.SESSION_SECRET || 'super_secret_key_change_me',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/luvverse_sessions',
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  }
}));

// ------------------- MIDDLEWARE -------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ------------------- FILE UPLOAD -------------------
const upload = multer({ dest: 'uploads/' });

// ------------------- TEMP DATASTORE (REPLACE WITH DB) -------------------
const dataStore = {
  letters: [],
  voiceNotes: [],
  memories: [],
  countdowns: [],
  messages: [],
  onlineUsers: []
};

// ------------------- AUTH MIDDLEWARE -------------------
function authenticate(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login.html');
}

// ------------------- ROUTES -------------------
app.get('/', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // TODO: Replace with real password check
  if (username && password) {
    req.session.user = {
      id: uuidv4(),
      username
    };
    console.log(`User logged in: ${username}`);
    return res.redirect('/');
  }

  res.status(400).send('Invalid credentials');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// Example upload route
app.post('/upload', authenticate, upload.single('file'), (req, res) => {
  res.json({ file: req.file });
});

// ------------------- SOCKET.IO -------------------
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const io = socketio(server);

io.use((socket, next) => {
  const sessionID = socket.request.sessionID;
  if (sessionID) return next();
  next(new Error('Not authenticated'));
});

io.on('connection', (socket) => {
  console.log('User connected to socket.io');
});
