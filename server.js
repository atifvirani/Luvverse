// server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const socketio = require('socket.io');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------- SESSION SETUP -------------------
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'super_secret_key_change_me',
  resave: false,
  saveUninitialized: false,
  store: process.env.MONGO_URI
    ? MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
      })
    : undefined,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
  },
});

app.use(sessionMiddleware);

// ------------------- MIDDLEWARE -------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ------------------- FILE UPLOAD -------------------
const upload = multer({ dest: 'uploads/' });

// ------------------- TEMP DATASTORE -------------------
const dataStore = {
  letters: [],
  voiceNotes: [],
  memories: [],
  countdowns: [],
  messages: [],
  onlineUsers: [],
};

// ------------------- AUTH MIDDLEWARE -------------------
function authenticate(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login.html');
}

// ------------------- HEALTH CHECK (for Render) -------------------
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ------------------- ROUTES -------------------
app.get('/', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Hardcoded credentials
  if (username === 'Atif' && password === 'atif') {
    req.session.user = {
      id: uuidv4(),
      username,
    };
    console.log(`✅ User logged in: ${username}`);
    return res.redirect('/');
  }

  res.status(400).send('Invalid username or password');
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

// ------------------- CREATE HTTP SERVER -------------------
const server = http.createServer(app);

// ------------------- SOCKET.IO -------------------
const io = socketio(server);

// Integrate sessions with Socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (socket) => {
  const session = socket.request.session;
  if (session?.user) {
    console.log(`Socket connected for user: ${session.user.username}`);
    dataStore.onlineUsers.push(session.user.username);
  } else {
    console.log('Socket connected without user session');
  }

  socket.on('disconnect', () => {
    if (session?.user) {
      dataStore.onlineUsers = dataStore.onlineUsers.filter(
        (u) => u !== session.user.username
      );
    }
  });
});

// ------------------- START SERVER -------------------
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
