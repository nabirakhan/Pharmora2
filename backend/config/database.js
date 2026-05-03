const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

const testConnection = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to Supabase Postgres successfully");
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
