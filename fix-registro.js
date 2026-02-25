require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    try {
        // Gerar registro para todos que não possuem
        const sem = await pool.query("SELECT id FROM ministros WHERE registro IS NULL OR registro = ''");
        console.log(`${sem.rows.length} ministro(s) sem registro. Gerando...`);

        for (const m of sem.rows) {
            const reg = `CIEIB-${new Date().getFullYear()}-${String(m.id).padStart(4, '0')}`;
            await pool.query(
                'UPDATE ministros SET registro = $1, data_registro = COALESCE(data_registro, created_at::date) WHERE id = $2',
                [reg, m.id]
            );
            console.log(`  -> ID ${m.id}: ${reg}`);
        }

        console.log('✅ Concluído!');
    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await pool.end();
    }
})();
