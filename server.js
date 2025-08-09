

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage
let chatMessages = [];
let typingUsers = new Set();

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New user connected');
    
    // Send chat history to new user
    socket.emit('chat history', chatMessages);
    
    // Handle new messages
    socket.on('chat message', (msg) => {
        // Store message
        chatMessages.push(msg);
        if (chatMessages.length > 100) {
            chatMessages.shift(); // Keep only the last 100 messages
        }
        
        // Broadcast to all clients
        io.emit('chat message', msg);
    });
    
    // Typing indicators
    socket.on('typing', (username) => {
        typingUsers.add(username);
        io.emit('typing update', Array.from(typingUsers));
    });
    
    socket.on('stop typing', (username) => {
        typingUsers.delete(username);
        io.emit('typing update', Array.from(typingUsers));
    });
    
    // Clean up on disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// API endpoints for other features
app.get('/api/letters', (req, res) => {
    res.json([]);
});

app.get('/api/memories', (req, res) => {
    res.json([]);
});

app.get('/api/countdown', (req, res) => {
    res.json({ date: null, event: '' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});