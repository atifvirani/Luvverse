

// Chat functionality for LuvVerse
document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');
    
    let typingTimeout;
    const username = prompt('Enter your name:') || 'Anonymous Lover';
    
    // Handle sending messages
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            const messageData = {
                username: username,
                text: message,
                timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            
            // Emit message to server
            socket.emit('chat message', messageData);
            
            // Add to local UI immediately
            addMessage(messageData, true);
            
            // Clear input
            messageInput.value = '';
        }
    }
    
    // Add message to chat UI
    function addMessage(messageData, isSent) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isSent ? 'sent' : 'received');
        
        const content = `
            <div class="message-sender">${isSent ? 'You' : messageData.username}</div>
            <div class="message-text">${messageData.text}</div>
            <div class="message-time">${messageData.timestamp}</div>
        `;
        
        messageElement.innerHTML = content;
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Typing indicator
    messageInput.addEventListener('input', function() {
        socket.emit('typing', username);
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stop typing');
        }, 1000);
    });
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Socket.io events
    socket.on('chat message', function(msg) {
        addMessage(msg, false);
    });
    
    socket.on('typing', function(username) {
        typingIndicator.textContent = `${username} is typing...`;
    });
    
    socket.on('stop typing', function() {
        typingIndicator.textContent = '';
    });
    
    socket.on('chat history', function(messages) {
        messages.forEach(msg => {
            addMessage(msg, msg.username === username);
        });
    });
    
    socket.on('typing update', function(users) {
        if (users.length > 0) {
            typingIndicator.textContent = `${users.join(', ')} ${users.length > 1 ? 'are' : 'is'} typing...`;
        } else {
            typingIndicator.textContent = '';
        }
    });
    
    // Welcome message
    setTimeout(() => {
        const welcomeMessage = {
            username: 'LuvVerse',
            text: 'Welcome to your private chat! Send sweet messages to your loved one.',
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        addMessage(welcomeMessage, false);
    }, 500);
});