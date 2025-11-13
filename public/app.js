// ===================================
// AUTHENTICATION UTILITIES
// ===================================

// API endpoint configuration
const API_URL = 'http://localhost:5000/api';

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Get stored token
function getToken() {
    return localStorage.getItem('token');
}

// Save authentication data
function saveAuth(token, email) {
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
}

// Clear authentication data
function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
}

// Show message (error or success)
function showMessage(messageDiv, text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
}

// ===================================
// INDEX PAGE (Landing)
// ===================================

function initIndexPage() {
    // Redirect to dashboard if already logged in
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
    }
}

// ===================================
// LOGIN PAGE
// ===================================

function initLoginPage() {
    // Redirect if already logged in
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
    }

    // Get form elements
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // Send login request to server
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Save authentication data
                saveAuth(data.token, data.user.email);
                
                // Show success message
                showMessage(messageDiv, 'Login successful!', 'success');
                
                // Redirect to dashboard after 1 second
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                // Show error message from server
                showMessage(messageDiv, data.message, 'error');
            }
        } catch (error) {
            // Show network error
            showMessage(messageDiv, 'Network error', 'error');
        }
    });
}

// ===================================
// REGISTER PAGE
// ===================================

function initRegisterPage() {
    // Redirect if already logged in
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
    }

    // Get form elements
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');

    // Handle register form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Check if passwords match
        if (password !== confirmPassword) {
            showMessage(messageDiv, 'Passwords do not match', 'error');
            return;
        }
        
        try {
            // Send registration request to server
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Save authentication data
                saveAuth(data.token, data.user.email);
                
                // Show success message
                showMessage(messageDiv, 'Registration successful!', 'success');
                
                // Redirect to dashboard after 1 second
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                // Show error message from server
                showMessage(messageDiv, data.message, 'error');
            }
        } catch (error) {
            // Show network error
            showMessage(messageDiv, 'Network error', 'error');
        }
    });
}

// ===================================
// DASHBOARD PAGE
// ===================================

function initDashboardPage() {
    const token = getToken();
    
    // Redirect to login if not authenticated
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Load user information from server
    async function loadUser() {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                // Display user email
                document.getElementById('userEmail').textContent = data.user.email;
            } else {
                // Token is invalid, clear auth and redirect
                clearAuth();
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }
    }

    // Handle logout button click
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            // Send logout request to server
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        // Clear authentication data
        clearAuth();
        
        // Redirect to login page
        window.location.href = 'login.html';
    });

    // Load user data when page loads
    loadUser();
}

// ===================================
// PAGE INITIALIZATION
// ===================================

// Initialize the appropriate page based on current location
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path.endsWith('/')) {
        initIndexPage();
    } else if (path.includes('login.html')) {
        initLoginPage();
    } else if (path.includes('register.html')) {
        initRegisterPage();
    } else if (path.includes('dashboard.html')) {
        initDashboardPage();
    }
});