const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createAdmin() {
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('🔄 Creating admin user...');
    console.log('Hashed password:', hashedPassword);
    
    try {
        const result = await pool.query(
            `INSERT INTO users (username, password, role) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (username) DO UPDATE 
             SET password = $2, role = $3
             RETURNING *`,
            ['admin', hashedPassword, 'admin']
        );
        
        console.log('✅ Admin user created/updated successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Login Credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Verify by checking the user
        const check = await pool.query('SELECT username, role FROM users WHERE username = $1', ['admin']);
        if (check.rows[0]) {
            console.log('✅ Verification: User exists in database');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    pool.end();
}

createAdmin();