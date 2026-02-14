const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Test connection on startup
pool.query('SELECT NOW()')
    .then(() => console.log('✅ Connected to Neon PostgreSQL'))
    .catch(err => console.error('❌ DB Connection Error:', err.message));

module.exports = pool;
