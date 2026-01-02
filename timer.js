// Timer duration set to 10 seconds (10000 milliseconds) for testing
const IDLE_TIMEOUT = 10000;
let lastActivity = Date.now();

// Store the last activity time in sessionStorage
function updateLastActivity() {
    lastActivity = Date.now();
    sessionStorage.setItem('lastActivity', lastActivity);
}

// Check if user has been inactive for too long
function checkIdleTime() {
    const currentTime = Date.now();
    const lastActivityTime = parseInt(sessionStorage.getItem('lastActivity')) || lastActivity;
    
    if (currentTime - lastActivityTime > IDLE_TIMEOUT) {
        // Redirect to login page
        window.location.href = '/index.html';
    }
}

// Reset timer on user activity
function resetTimer() {
    updateLastActivity();
}

// Initialize timer
function initTimer() {
    // Set initial last activity time if not already set
    if (!sessionStorage.getItem('lastActivity')) {
        sessionStorage.setItem('lastActivity', lastActivity);
    }

    // Add event listeners for user activity
    ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetTimer);
    });

    // Check idle time every 2 seconds for testing
    setInterval(checkIdleTime, 10000);
}

// Start the timer when the page loads
document.addEventListener('DOMContentLoaded', initTimer);
