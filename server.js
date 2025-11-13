const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'budget_app'
});

// Test DB connection
pool.getConnection()
  .then(conn => {
    console.log('Database connected');
    conn.release();
  })
  .catch(err => console.error('Database connection failed:', err));

// In-memory session store (use Redis or database for production)
const sessions = new Map();

// Generate random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  const session = sessions.get(token);
  if (!session) return res.status(403).json({ message: 'Invalid token' });
  
  req.userEmail = session.email;
  next();
};

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    await pool.execute('INSERT INTO users (email, password) VALUES (?, ?)', [email, password]);
    
    const token = generateToken();
    sessions.set(token, { email });
    
    res.status(201).json({ message: 'User registered', token, user: { email } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0 || users[0].password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken();
    sessions.set(token, { email });
    
    res.json({ message: 'Login successful', token, user: { email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT email FROM users WHERE email = ?', [req.userEmail]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user: { email: users[0].email } });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
app.post('/api/auth/logout', verifyToken, (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  sessions.delete(token);
  res.json({ message: 'Logout successful' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});