/* ==============================================================
   Conexão com o PostgreSQL
   ============================================================== */
const { Pool } = require('pg');

const isProd = process.env.NODE_ENV === 'production';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProd ? { rejectUnauthorized: false } : false,
    // Pool tuning para VPS
    max: isProd ? 20 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Testar conexão
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('❌ Erro ao conectar no PostgreSQL:', err.message);
    } else {
        console.log('✅ PostgreSQL conectado com sucesso');
    }
});

module.exports = pool;
