const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Test database connection
pool.connect((err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('PostgreSQL connected successfully');
    }
});

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Teacher login
app.post('/api/teacher/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM teachers WHERE email = $1', [email]);
        const teacher = result.rows[0];
        if (!teacher) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        
        const isValid = await bcrypt.compare(password, teacher.password);
        if (!isValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        
        const token = jwt.sign({ id: teacher.id, email: teacher.email, name: teacher.name, assigned_class: teacher.assigned_class }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token, teacher: { id: teacher.id, name: teacher.name, email: teacher.email, assigned_class: teacher.assigned_class } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get students
app.get('/api/students', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM students ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get subjects
app.get('/api/subjects', async (req, res) => {
    const { class_level } = req.query;
    try {
        let query = 'SELECT * FROM subjects WHERE 1=1';
        let params = [];
        if (class_level === 'KG1' || class_level === 'KG2') {
            query += ' AND class_level IN ($1, $2) ORDER BY display_order';
            params = ['KG1', 'KG2'];
        } else if (class_level === 'P1' || class_level === 'P2' || class_level === 'P3') {
            query += ' AND class_level = $1 ORDER BY display_order';
            params = ['P1-3'];
        } else if (class_level === 'P4' || class_level === 'P5' || class_level === 'P6') {
            query += ' AND class_level = $1 ORDER BY display_order';
            params = ['P4-6'];
        } else {
            query += ' AND class_level = $1 ORDER BY display_order';
            params = [class_level];
        }
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== SERVE HTML ====================
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Living Spring School</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px;">
            <h1>🏫 Living Spring School</h1>
            <p>School Management System API is running</p>
            <a href="/login.html">Admin Login</a> | 
            <a href="/teacher-login.html">Teacher Login</a>
        </body>
        </html>
    `);
});

// ==================== START SERVER ====================
module.exports = app;
