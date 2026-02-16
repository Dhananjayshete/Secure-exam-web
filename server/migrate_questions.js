const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        await pool.query('ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS model_answer TEXT;');
        console.log('Migration successful: model_answer column added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
