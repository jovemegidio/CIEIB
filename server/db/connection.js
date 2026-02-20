/* ==============================================================
   Conexão com o PostgreSQL
   ============================================================== */
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
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
