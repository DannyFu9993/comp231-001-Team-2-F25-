// ===================================
// AUTHENTICATION UTILITIES
// ===================================

// API endpoint configuration
const API_URL = 'http://localhost:5000/api';

document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            clearAuth();
            window.location.href = "login.html";
        });
    }
});



// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Verify token with server (returns true if server accepts token)
async function isSessionValid() {
    const token = getToken();
    if (!token) return false;
    try {
        const res = await fetch(`${API_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) {
            clearAuth();
            return false;
        }
        return true;
    } catch (err) {
        // network errors -> consider session invalid for redirect logic
        console.error('Session validation error', err);
        return false;
    }
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
    // Redirect to dashboard only if the session is valid on the server
    if (isLoggedIn()) {
        isSessionValid().then(valid => {
            if (valid) window.location.href = 'dashboard.html';
        });
    }
}

// ===================================
// LOGIN PAGE
// ===================================

function initLoginPage() {
    // Redirect if already logged in and session still valid on server
    if (isLoggedIn()) {
        isSessionValid().then(valid => {
            if (valid) window.location.href = 'dashboard.html';
        });
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
    // Redirect if already logged in and session still valid on server
    if (isLoggedIn()) {
        isSessionValid().then(valid => {
            if (valid) window.location.href = 'dashboard.html';
        });
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

    // Populate user info and attach logout if present
    loadCurrentUser();
    attachLogout();

    // (transactions/history pages are initialized at top-level so they run when their pages load)
}

// ===================================
// Global helpers: load user and logout
// ===================================

async function loadCurrentUser() {
    const token = getToken();
    if (!token) return null;
    try {
        const res = await fetch(`${API_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) {
            clearAuth();
            return null;
        }
        const data = await res.json();
        const el = document.getElementById('userEmail');
        if (el) el.textContent = data.user.email;
        return data.user;
    } catch (err) {
        console.error('loadCurrentUser error', err);
        return null;
    }
}

function attachLogout() {
    const btn = document.getElementById('logoutBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        const token = getToken();
        try {
            if (token) {
                await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            }
        } catch (err) {
            console.error('Logout error', err);
        }
        clearAuth();
        window.location.href = 'login.html';
    });
}

// ===================================
// Transactions Page (manage add/delete)
// ===================================

async function initTransactionsPage() {
    const token = getToken();
    if (!token) { window.location.href = 'login.html'; return; }

    // populate user info and attach logout
    await loadCurrentUser();
    attachLogout();

    const form = document.getElementById('transactionForm');
    if (!form) return; // not on transactions page

    const descInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const typeSelect = document.getElementById('type');
    const listEl = document.getElementById('transactionsList');
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpenseEl = document.getElementById('totalExpense');
    const totalBalanceEl = document.getElementById('totalBalance');
    const msgEl = document.getElementById('txMessage');

    function apiHeaders() { return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }; }
    function showMsg(text, type = 'info') { if (!msgEl) return; msgEl.textContent = text; msgEl.className = `message ${type}`; setTimeout(() => { msgEl.textContent = ''; msgEl.className = 'message'; }, 3000); }
    function formatCurrency(n) { return Number(n).toFixed(2); }

    async function fetchTransactions() {
        try {
            const res = await fetch(`${API_URL}/transactions`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            return data.transactions || [];
        } catch (err) { console.error('Fetch transactions error', err); showMsg('Failed to load transactions', 'error'); return []; }
    }

    async function renderTransactions() {
        const txs = await fetchTransactions();
        listEl.innerHTML = '';
        txs.forEach(tx => {
            const li = document.createElement('li');
            li.className = `tx ${tx.type}`;
            const date = new Date(tx.date).toLocaleString();
            li.innerHTML = `<div class="tx-left"><strong>${tx.description}</strong><br><small>${date}</small></div><div class="tx-right"><span>${tx.type === 'income' ? '+' : '-'}$${formatCurrency(tx.amount)}</span> <button class="btn small" data-id="${tx.id}">Delete</button></div>`;
            listEl.appendChild(li);
        });

        listEl.querySelectorAll('button[data-id]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                try {
                    const res = await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                    if (!res.ok) throw new Error('Delete failed');
                    showMsg('Transaction deleted', 'success');
                    renderTransactions();
                } catch (err) { console.error('Delete error', err); showMsg('Delete failed', 'error'); }
            });
        });

        updateTotals(txs);
    }

    function updateTotals(txs) {
        const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        const balance = income - expense;
        totalIncomeEl.textContent = formatCurrency(income);
        totalExpenseEl.textContent = formatCurrency(expense);
        totalBalanceEl.textContent = formatCurrency(balance);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const description = descInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const type = typeSelect.value;
        if (!description) { showMsg('Please enter a description', 'error'); return; }
        if (!amount || isNaN(amount) || amount <= 0) { showMsg('Please enter a valid amount', 'error'); return; }
        try {
            const res = await fetch(`${API_URL}/transactions`, { method: 'POST', headers: apiHeaders(), body: JSON.stringify({ description, amount: Math.abs(amount), type, date: new Date().toISOString() }) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Create failed'); }
            form.reset(); showMsg('Transaction added', 'success'); renderTransactions();
        } catch (err) { console.error('Create tx error', err); showMsg('Failed to add transaction', 'error'); }
    });

    // initial render
    renderTransactions();
}

// ===================================
// History Page (read-only list/table)
// ===================================

async function initHistoryPage() {
    const token = getToken();
    if (!token) { window.location.href = 'login.html'; return; }

    await loadCurrentUser();
    attachLogout();

    const tableBody = document.getElementById('historyBody');
    if (!tableBody) return;

    function formatCurrency(n) { return Number(n).toFixed(2); }

    // load all transactions once and keep in memory for client-side filtering
    let allTx = [];
    try {
        const res = await fetch(`${API_URL}/transactions`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        allTx = data.transactions || [];
    } catch (err) {
        console.error('History load error', err);
        return;
    }

    // filter controls
    const filterType = document.getElementById('filterType');
    const filterTime = document.getElementById('filterTime');
    const filterKeyword = document.getElementById('filterKeyword');
    const clearFilters = document.getElementById('clearFilters');
    const exportPdfBtn = document.getElementById('exportPdf');

    function matchesType(tx, type) {
        if (!type || type === 'all') return true;
        return tx.type === type;
    }

    function matchesTime(tx, timeFilter) {
        if (!timeFilter || timeFilter === 'all') return true;
        const txDate = new Date(tx.date);
        const now = new Date();
        let deltaMs = now - txDate;
        const dayMs = 24 * 60 * 60 * 1000;
        if (timeFilter === 'week') return deltaMs <= 7 * dayMs;
        if (timeFilter === 'month') return deltaMs <= 30 * dayMs;
        if (timeFilter === 'year') return deltaMs <= 365 * dayMs;
        return true;
    }

    function matchesKeyword(tx, kw) {
        if (!kw) return true;
        return tx.description.toLowerCase().includes(kw.toLowerCase());
    }

    function renderFiltered() {
        const type = filterType ? filterType.value : 'all';
        const time = filterTime ? filterTime.value : 'all';
        const kw = filterKeyword ? filterKeyword.value.trim() : '';

        const filtered = allTx.filter(tx => matchesType(tx, type) && matchesTime(tx, time) && matchesKeyword(tx, kw));

        tableBody.innerHTML = '';
        if (filtered.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="4">No records found</td>`;
            tableBody.appendChild(tr);
            return;
        }

        filtered.forEach(tx => {
            const tr = document.createElement('tr');
            const date = new Date(tx.date).toLocaleString();
            tr.innerHTML = `<td>${tx.description}</td><td>$${formatCurrency(tx.amount)}</td><td>${tx.type}</td><td>${date}</td>`;
            tableBody.appendChild(tr);
        });
    }

    // wire up filters
    if (filterType) filterType.addEventListener('change', renderFiltered);
    if (filterTime) filterTime.addEventListener('change', renderFiltered);
    if (filterKeyword) filterKeyword.addEventListener('input', renderFiltered);
    if (clearFilters) clearFilters.addEventListener('click', () => {
        if (filterType) filterType.value = 'all';
        if (filterTime) filterTime.value = 'all';
        if (filterKeyword) filterKeyword.value = '';
        renderFiltered();
    });

    // Export filtered results to PDF
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            // build rows from currently filtered data
            const type = filterType ? filterType.value : 'all';
            const time = filterTime ? filterTime.value : 'all';
            const kw = filterKeyword ? filterKeyword.value.trim() : '';
            const filtered = allTx.filter(tx => matchesType(tx, type) && matchesTime(tx, time) && matchesKeyword(tx, kw));

            // create PDF
            try {
                // jspdf UMD exposes window.jspdf
                const { jsPDF } = window.jspdf || {};
                const doc = jsPDF ? new jsPDF() : null;
                if (!doc) throw new Error('jsPDF not loaded');

                doc.setFontSize(14);
                doc.text('Transaction History', 14, 16);

                const rows = filtered.map(tx => [tx.description, `$${formatCurrency(tx.amount)}`, tx.type, new Date(tx.date).toLocaleString()]);
                doc.autoTable({
                    head: [['Description', 'Amount', 'Type', 'Date']],
                    body: rows,
                    startY: 22,
                    styles: { fontSize: 10 }
                });

                doc.save('transactions.pdf');
            } catch (err) {
                console.error('Export PDF error', err);
                alert('Failed to export PDF (check console)');
            }
        });
    }

    // initial render
    renderFiltered();
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
    } else if (path.includes('transactions.html')) {
        initTransactionsPage();
    } else if (path.includes('history.html')) {
        initHistoryPage();
    }
});