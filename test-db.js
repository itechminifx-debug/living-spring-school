const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testConnection() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully!');
        console.log('Server time:', res.rows[0].now);
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
    }
}

testConnection();