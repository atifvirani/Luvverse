const express = require('express');
const session = require('express-session');
const socketio = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
  secret: 'luvverse_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// File upload configuration
const upload = multer({ dest: 'uploads/' });

// Temporary in-memory storage
const dataStore = {
  letters: [],
  voiceNotes: [],
  memories: [],
  countdowns: [],
  messages: [],
  onlineUsers: []
};

// Authentication middleware
function authenticate(req, res, next) {
  if (req.session.user || req.path === '/login.html' || req.path === '/') {
    next();
  } else {
    res.redirect('/login.html');
  }
}

app.use(authenticate);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Login handling
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if ((username === 'Atif' && password === 'atif123') || 
      (username === 'Adiba' && password === 'adiba123')) {
    req.session.user = username;
    res.json({ success: true, username });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

// API endpoints for data
app.post('/api/letters', (req, res) => {
  const { content } = req.body;
  const author = req.session.user;
  const letter = { content, author, timestamp: new Date() };
  dataStore.letters.push(letter);
  res.json({ success: true, letter });
});

app.get('/api/letters', (req, res) => {
  res.json(dataStore.letters);
});

app.post('/api/voice', upload.single('voiceNote'), (req, res) => {
  const author = req.session.user;
  const voiceNote = {
    filename: req.file.filename,
    originalname: req.file.originalname,
    author,
    timestamp: new Date()
  };
  dataStore.voiceNotes.push(voiceNote);
  res.json({ success: true, voiceNote });
});

app.get('/api/voice', (req, res) => {
  res.json(dataStore.voiceNotes);
});

app.post('/api/memories', upload.single('memory'), (req, res) => {
  const author = req.session.user;
  const memory = {
    filename: req.file.filename,
    originalname: req.file.originalname,
    author,
    timestamp: new Date()
  };
  dataStore.memories.push(memory);
  res.json({ success: true, memory });
});

app.get('/api/memories', (req, res) => {
  res.json(dataStore.memories);
});

app.post('/api/countdowns', (req, res) => {
  const { title, date } = req.body;
  const author = req.session.user;
  const countdown = { title, date, author, timestamp: new Date() };
  dataStore.countdowns.push(countdown);
  res.json({ success: true, countdown });
});

app.get('/api/countdowns', (req, res) => {
  res.json(dataStore.countdowns);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.io setup
const io = socketio(server);

io.on('connection', (socket) => {
  console.log('New user connected');
  
  // Handle user login
  socket.on('user-login', (username) => {
    if (!dataStore.onlineUsers.includes(username)) {
      dataStore.onlineUsers.push(username);
    }
    io.emit('online-users', dataStore.onlineUsers);
  });
  
  // Handle chat messages
  socket.on('send-message', (message) => {
    message.timestamp = new Date();
    dataStore.messages.push(message);
    io.emit('new-message', message);
  });
  
  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });
  
  // Handle seen receipts
  socket.on('message-seen', (messageId) => {
    const message = dataStore.messages.find(m => m.id === messageId);
    if (message) {
      message.seen = true;
      io.emit('message-seen', messageId);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected');
    // Note: In a real app, we'd need a more robust way to track online users
  });
});