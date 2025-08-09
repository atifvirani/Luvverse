// Global variables
let currentUser = null;
let socket = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check which page we're on and initialize accordingly
  const path = window.location.pathname.split('/').pop();
  
  // Initialize user session
  checkUserSession();
  
  // Initialize specific page functionality
  switch(path) {
    case 'login.html':
      initLoginPage();
      break;
    case 'index.html':
      initHomePage();
      break;
    case 'letters.html':
      initLettersPage();
      break;
    case 'voice.html':
      initVoicePage();
      break;
    case 'memories.html':
      initMemoriesPage();
      break;
    case 'countdown.html':
      initCountdownPage();
      break;
    case 'chat.html':
      initChatPage();
      break;
    default:
      if (path === '' || path === 'luvverse/' || path === 'luvverse') {
        initHomePage();
      }
  }
});

// Check user session
function checkUserSession() {
  fetch('/api/check-session')
    .then(response => {
      if (!response.ok && window.location.pathname.split('/').pop() !== 'login.html') {
        window.location.href = '/login.html';
      }
      return response.json();
    })
    .then(data => {
      if (data.user) {
        currentUser = data.user;
        updateUserDisplay();
      } else if (window.location.pathname.split('/').pop() !== 'login.html') {
        window.location.href = '/login.html';
      }
    })
    .catch(error => {
      console.error('Error checking session:', error);
      if (window.location.pathname.split('/').pop() !== 'login.html') {
        window.location.href = '/login.html';
      }
    });
}

// Update user display on all pages
function updateUserDisplay() {
  const userElements = document.querySelectorAll('#loggedInUser');
  if (userElements.length > 0 && currentUser) {
    userElements.forEach(el => {
      el.textContent = `Logged in as ${currentUser}`;
    });
  }
}

// Login Page
function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          currentUser = data.username;
          window.location.href = '/index.html';
        } else {
          loginMessage.textContent = data.message || 'Login failed. Please try again.';
        }
      })
      .catch(error => {
        console.error('Error:', error);
        loginMessage.textContent = 'An error occurred. Please try again.';
      });
    });
  }
}

// Home Page
function initHomePage() {
  // No special initialization needed for home page yet
}

// Letters Page
function initLettersPage() {
  const letterForm = document.getElementById('sendLetter');
  const letterContent = document.getElementById('letterContent');
  const lettersContainer = document.getElementById('lettersContainer');
  
  // Load existing letters
  loadLetters();
  
  // Handle new letter submission
  if (letterForm) {
    letterForm.addEventListener('click', function() {
      if (!letterContent.value.trim()) return;
      
      fetch('/api/letters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: letterContent.value })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          letterContent.value = '';
          loadLetters();
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
    });
  }
}

function loadLetters() {
  const lettersContainer = document.getElementById('lettersContainer');
  if (!lettersContainer) return;
  
  fetch('/api/letters')
    .then(response => response.json())
    .then(letters => {
      lettersContainer.innerHTML = '';
      letters.forEach(letter => {
        const letterElement = document.createElement('div');
        letterElement.className = 'letter-card';
        letterElement.innerHTML = `
          <div class="letter-author">${letter.author}</div>
          <div class="letter-content">${letter.content}</div>
          <div class="letter-date">${new Date(letter.timestamp).toLocaleString()}</div>
        `;
        lettersContainer.appendChild(letterElement);
      });
    })
    .catch(error => {
      console.error('Error loading letters:', error);
    });
}

// Voice Page
function initVoicePage() {
  const uploadVoiceBtn = document.getElementById('uploadVoice');
  const voiceUpload = document.getElementById('voiceUpload');
  const startRecordingBtn = document.getElementById('startRecording');
  const stopRecordingBtn = document.getElementById('stopRecording');
  const saveRecordingBtn = document.getElementById('saveRecording');
  const recordedAudio = document.getElementById('recordedAudio');
  const voiceNotesContainer = document.getElementById('voiceNotesContainer');
  
  let mediaRecorder;
  let audioChunks = [];
  
  // Load existing voice notes
  loadVoiceNotes();
  
  // Handle voice note upload
  if (uploadVoiceBtn && voiceUpload) {
    uploadVoiceBtn.addEventListener('click', function() {
      if (voiceUpload.files.length === 0) return;
      
      const formData = new FormData();
      formData.append('voiceNote', voiceUpload.files[0]);
      
      fetch('/api/voice', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          voiceUpload.value = '';
          loadVoiceNotes();
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
    });
  }
  
  // Handle recording functionality
  if (startRecordingBtn) {
    startRecordingBtn.addEventListener('click', startRecording);
  }
  
  if (stopRecordingBtn) {
    stopRecordingBtn.addEventListener('click', stopRecording);
  }
  
  if (saveRecordingBtn) {
    saveRecordingBtn.addEventListener('click', saveRecording);
  }
  
  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        
        startRecordingBtn.disabled = true;
        stopRecordingBtn.disabled = false;
        saveRecordingBtn.disabled = true;
        
        audioChunks = [];
        
        mediaRecorder.addEventListener('dataavailable', event => {
          audioChunks.push(event.data);
        });
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
      });
  }
  
  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      
      startRecordingBtn.disabled = false;
      stopRecordingBtn.disabled = true;
      saveRecordingBtn.disabled = false;
      
      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        recordedAudio.src = audioUrl;
        recordedAudio.style.display = 'block';
      });
    }
  }
  
  function saveRecording() {
    if (audioChunks.length === 0) return;
    
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
    
    const formData = new FormData();
    formData.append('voiceNote', audioFile);
    
    fetch('/api/voice', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        recordedAudio.style.display = 'none';
        saveRecordingBtn.disabled = true;
        loadVoiceNotes();
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }
}

function loadVoiceNotes() {
  const voiceNotesContainer = document.getElementById('voiceNotesContainer');
  if (!voiceNotesContainer) return;
  
  fetch('/api/voice')
    .then(response => response.json())
    .then(voiceNotes => {
      voiceNotesContainer.innerHTML = '';
      voiceNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'voice-note-card';
        noteElement.innerHTML = `
          <div class="voice-note-author">${note.author}</div>
          <audio controls src="/uploads/${note.filename}"></audio>
          <div class="voice-note-date">${new Date(note.timestamp).toLocaleString()}</div>
        `;
        voiceNotesContainer.appendChild(noteElement);
      });
    })
    .catch(error => {
      console.error('Error loading voice notes:', error);
    });
}

// Memories Page
function initMemoriesPage() {
  const uploadMemoryBtn = document.getElementById('uploadMemory');
  const memoryUpload = document.getElementById('memoryUpload');
  const memoriesGrid = document.getElementById('memoriesGrid');
  
  // Load existing memories
  loadMemories();
  
  // Handle memory upload
  if (uploadMemoryBtn && memoryUpload) {
    uploadMemoryBtn.addEventListener('click', function() {
      if (memoryUpload.files.length === 0) return;
      
      const formData = new FormData();
      for (let i = 0; i < memoryUpload.files.length; i++) {
        formData.append('memory', memoryUpload.files[i]);
      }
      
      fetch('/api/memories', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          memoryUpload.value = '';
          loadMemories();
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
    });
  }
}

function loadMemories() {
  const memoriesGrid = document.getElementById('memoriesGrid');
  if (!memoriesGrid) return;
  
  fetch('/api/memories')
    .then(response => response.json())
    .then(memories => {
      memoriesGrid.innerHTML = '';
      memories.forEach(memory => {
        const memoryElement = document.createElement('div');
        memoryElement.className = 'memory-card';
        memoryElement.innerHTML = `
          <img class="memory-image" src="/uploads/${memory.filename}" alt="${memory.originalname}">
          <div class="memory-info">
            <div class="memory-author">${memory.author}</div>
            <div class="memory-date">${new Date(memory.timestamp).toLocaleString()}</div>
          </div>
        `;
        memoriesGrid.appendChild(memoryElement);
      });
    })
    .catch(error => {
      console.error('Error loading memories:', error);
    });
}

// Countdown Page
function initCountdownPage() {
  const createCountdownBtn = document.getElementById('createCountdown');
  const countdownTitle = document.getElementById('countdownTitle');
  const countdownDate = document.getElementById('countdownDate');
  const countdownsContainer = document.getElementById('countdownsContainer');
  
  // Load existing countdowns
  loadCountdowns();
  
  // Handle new countdown creation
  if (createCountdownBtn) {
    createCountdownBtn.addEventListener('click', function() {
      if (!countdownTitle.value.trim() || !countdownDate.value) return;
      
      fetch('/api/countdowns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: countdownTitle.value,
          date: countdownDate.value
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          countdownTitle.value = '';
          countdownDate.value = '';
          loadCountdowns();
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
    });
  }
  
  // Update countdown timers every second
  setInterval(updateCountdownTimers, 1000);
}

function loadCountdowns() {
  const countdownsContainer = document.getElementById('countdownsContainer');
  if (!countdownsContainer) return;
  
  fetch('/api/countdowns')
    .then(response => response.json())
    .then(countdowns => {
      countdownsContainer.innerHTML = '';
      countdowns.forEach(countdown => {
        const countdownElement = document.createElement('div');
        countdownElement.className = 'countdown-card';
        countdownElement.dataset.date = countdown.date;
        countdownElement.innerHTML = `
          <div class="countdown-title">${countdown.title}</div>
          <div class="countdown-timer" id="timer-${countdown.date}">Calculating...</div>
          <div class="countdown-date">Target Date: ${new Date(countdown.date).toLocaleDateString()}</div>
          <div class="countdown-author">Set by ${countdown.author}</div>
        `;
        countdownsContainer.appendChild(countdownElement);
      });
      
      // Initialize timers
      updateCountdownTimers();
    })
    .catch(error => {
      console.error('Error loading countdowns:', error);
    });
}

function updateCountdownTimers() {
  const countdownElements = document.querySelectorAll('.countdown-card');
  
  countdownElements.forEach(element => {
    const targetDate = new Date(element.dataset.date);
    const now = new Date();
    const diff = targetDate - now;
    
    if (diff <= 0) {
      element.querySelector('.countdown-timer').textContent = 'The day has arrived! ❤️';
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    element.querySelector('.countdown-timer').textContent = 
      `${days}d ${hours}h ${minutes}m ${seconds}s`;
  });
}

// Chat Page
function initChatPage() {
  // Initialize Socket.io connection
  socket = io();
  
  const messagesContainer = document.getElementById('messagesContainer');
  const messageInput = document.getElementById('messageInput');
  const sendMessageBtn = document.getElementById('sendMessage');
  const typingIndicator = document.getElementById('typingIndicator');
  const partnerStatus = document.getElementById('partnerStatus');
  
  let typingTimeout;
  
  // Load existing messages
  loadMessages();
  
  // Notify server that user is online
  socket.emit('user-login', currentUser);
  
  // Listen for online users updates
  socket.on('online-users', users => {
    const partner = currentUser === 'Atif' ? 'Adiba' : 'Atif';
    const isPartnerOnline = users.includes(partner);
    
    partnerStatus.textContent = isPartnerOnline ? `${partner} is online` : `${partner} is offline`;
    partnerStatus.className = isPartnerOnline ? 'status online' : 'status offline';
  });
  
  // Listen for new messages
  socket.on('new-message', message => {
    addMessageToUI(message);
    scrollToBottom();
    
    // Mark as seen
    setTimeout(() => {
      socket.emit('message-seen', message.id);
    }, 1000);
  });
  
  // Listen for typing indicator
  socket.on('typing', data => {
    const partner = currentUser === 'Atif' ? 'Adiba' : 'Atif';
    if (data.isTyping) {
      typingIndicator.textContent = `${partner} is typing...`;
    } else {
      typingIndicator.textContent = '';
    }
  });
  
  // Listen for seen receipts
  socket.on('message-seen', messageId => {
    const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
    if (messageElement && messageElement.classList.contains('sent')) {
      const seenElement = messageElement.querySelector('.message-seen');
      if (seenElement) {
        seenElement.textContent = 'Seen';
      }
    }
  });
  
  // Handle message submission
  if (sendMessageBtn && messageInput) {
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
  
  // Handle typing indicator
  if (messageInput) {
    messageInput.addEventListener('input', function() {
      socket.emit('typing', { isTyping: true });
      
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('typing', { isTyping: false });
      }, 1000);
    });
  }
  
  function sendMessage() {
    const messageText = messageInput.value.trim();
    if (!messageText) return;
    
    const message = {
      id: Date.now().toString(),
      text: messageText,
      author: currentUser,
      timestamp: new Date(),
      seen: false
    };
    
    // Emit message to server
    socket.emit('send-message', message);
    
    // Clear input
    messageInput.value = '';
    
    // Stop typing indicator
    socket.emit('typing', { isTyping: false });
  }
  
  function addMessageToUI(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.author === currentUser ? 'sent' : 'received'}`;
    messageElement.dataset.id = message.id;
    
    const seenText = message.author === currentUser ? 
      `<div class="message-seen">${message.seen ? 'Seen' : 'Delivered'}</div>` : '';
    
    messageElement.innerHTML = `
      <div class="message-author">${message.author}</div>
      <div class="message-text">${message.text}</div>
      <div class="message-time">${new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      ${seenText}
    `;
    
    messagesContainer.appendChild(messageElement);
  }
  
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

function loadMessages() {
  // In a real app, we would fetch messages from the server
  // For this demo, we'll use socket.io for real-time messaging
  const messagesContainer = document.getElementById('messagesContainer');
  if (messagesContainer) {
    messagesContainer.innerHTML = '<div class="welcome-message">Start your romantic conversation...</div>';
  }
}