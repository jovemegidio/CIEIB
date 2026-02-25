require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    try {
        // Buscar ministro Heleno
        const m = await pool.query("SELECT id, nome, cpf, email, status, aprovado, foto_url FROM ministros WHERE UPPER(nome) LIKE '%HELENO%'");
        console.log('=== MINISTRO HELENO ===');
        console.log(JSON.stringify(m.rows, null, 2));

        if (m.rows.length > 0) {
            const id = m.rows[0].id;

            // Verificar documentos (tabela ministro_documentos)
            const docs = await pool.query('SELECT * FROM ministro_documentos WHERE ministro_id = $1', [id]);
            console.log('\n=== MINISTRO_DOCUMENTOS ===');
            console.log(JSON.stringify(docs.rows, null, 2));

            // Verificar uploads (tabela ministro_uploads)
            const uploads = await pool.query('SELECT * FROM ministro_uploads WHERE ministro_id = $1', [id]);
            console.log('\n=== MINISTRO_UPLOADS ===');
            console.log(JSON.stringify(uploads.rows, null, 2));
        }
    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await pool.end();
    }
})();
