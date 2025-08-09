// Shared JavaScript for LuvVerse app

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Highlight active page in navigation
    highlightActiveNav();
    
    // Initialize countdown if on countdown page
    if (document.querySelector('.countdown-content')) {
        initializeCountdown();
    }
    
    // Setup placeholder buttons
    setupPlaceholderButtons();
});

// Function to highlight active navigation item
function highlightActiveNav() {
    const navItems = document.querySelectorAll('.nav-item');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    navItems.forEach(item => {
        const link = item.getAttribute('href').split('/').pop();
        if (link === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Countdown functionality
function initializeCountdown() {
    // Set a default date (next Valentine's Day)
    let targetDate = new Date();
    targetDate.setMonth(1); // February
    targetDate.setDate(14);
    
    // If current date is past February 14th, set for next year
    if (targetDate < new Date()) {
        targetDate.setFullYear(targetDate.getFullYear() + 1);
    }
    
    // Check if there's a saved date in localStorage
    const savedDate = localStorage.getItem('luvverseEventDate');
    const savedName = localStorage.getItem('luvverseEventName');
    
    if (savedDate) {
        targetDate = new Date(savedDate);
    }
    
    if (savedName) {
        document.querySelector('.countdown-card h2').textContent = savedName;
        document.getElementById('event-name').value = savedName;
    }
    
    // Set the date picker to the target date
    document.getElementById('event-date').valueAsDate = targetDate;
    
    // Update countdown every second
    const countdown = setInterval(() => {
        updateCountdown(targetDate);
    }, 1000);
    
    // Initial update
    updateCountdown(targetDate);
    
    // Event listener for date change
    document.getElementById('event-date').addEventListener('change', function() {
        targetDate = new Date(this.value);
        localStorage.setItem('luvverseEventDate', targetDate);
        updateCountdown(targetDate);
    });
    
    // Event listener for event name change
    document.getElementById('event-name').addEventListener('change', function() {
        const eventName = this.value || 'Our Next Anniversary';
        document.querySelector('.countdown-card h2').textContent = eventName;
        localStorage.setItem('luvverseEventName', eventName);
    });
    
    // Save button event listener
    document.querySelector('.save-button').addEventListener('click', function() {
        alert('Countdown settings saved!');
    });
}

function updateCountdown(targetDate) {
    const now = new Date();
    const diff = targetDate - now;
    
    if (diff <= 0) {
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('days').textContent = days.toString().padStart(2, '0');
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}

// Placeholder for future functionality
function setupPlaceholderButtons() {
    document.querySelectorAll('.read-more, .play-button, .add-button, .record-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            alert('This feature will be implemented in the next version!');
        });
    });
}