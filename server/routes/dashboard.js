/* ==============================================================
   Rotas do Dashboard — Estatísticas e Configurações do site
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');

// GET /api/dashboard/stats — Estatísticas REAIS do banco de dados
router.get('/stats', async (req, res) => {
    try {
        // Contar ministros credenciados (status ATIVO)
        const ministrosResult = await pool.query(
            "SELECT COUNT(*) as total FROM ministros WHERE status = 'ATIVO'"
        );

        // Contar igrejas distintas dos ministros
        const igrejasResult = await pool.query(
            "SELECT COUNT(DISTINCT nome_igreja) as total FROM ministros WHERE nome_igreja IS NOT NULL AND nome_igreja != ''"
        );

        // Contar estados alcançados (do endereço dos ministros)
        const estadosResult = await pool.query(
            `SELECT COUNT(DISTINCT me.uf) as total FROM ministro_endereco me
             JOIN ministros m ON m.id = me.ministro_id
             WHERE me.uf IS NOT NULL AND me.uf != '' AND m.status = 'ATIVO'`
        );

        // Contar convenções regionais
        const convencoesResult = await pool.query(
            "SELECT COUNT(DISTINCT sigla) as total FROM ministro_convencoes WHERE status = 'ATIVO'"
        );

        // Buscar valores mínimos do configuracoes (admin pode definir valores de exibição)
        const configResult = await pool.query(
            "SELECT chave, valor FROM configuracoes WHERE chave LIKE 'stat_%'"
        );
        const configStats = {};
        configResult.rows.forEach(row => {
            configStats[row.chave.replace('stat_', '')] = parseInt(row.valor) || 0;
        });

        // Usar o MAIOR valor entre dados reais e configuração do admin
        const realStats = {
            igrejas: Math.max(parseInt(igrejasResult.rows[0].total) || 0, configStats.igrejas || 0),
            ministros: Math.max(parseInt(ministrosResult.rows[0].total) || 0, configStats.ministros || 0),
            estados: Math.max(parseInt(estadosResult.rows[0].total) || 0, configStats.estados || 0),
            convencoes: Math.max(parseInt(convencoesResult.rows[0].total) || 0, configStats.convencoes || 0)
        };

        res.json(realStats);
    } catch (err) {
        console.error('Erro ao buscar stats:', err);
        // Fallback com valores padrão
        res.json({
            igrejas: 500,
            ministros: 1200,
            estados: 26,
            convencoes: 50
        });
    }
});

// GET /api/dashboard/config — Configurações públicas do site
router.get('/config', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT chave, valor FROM configuracoes
            WHERE chave LIKE 'site_%'
        `);

        const config = {};
        result.rows.forEach(row => {
            config[row.chave.replace('site_', '')] = row.valor;
        });

        res.json(config);
    } catch (err) {
        res.json({
            telefone: '(00) 0000-0000',
            email: 'contato@cieib.org.br',
            whatsapp: '5500000000000',
            endereco: 'Rua Exemplo, 1000',
            horario: 'Seg a Sex: 09h às 17h'
        });
    }
});

// GET /api/dashboard/eventos-proximos — Próximos eventos para o site
router.get('/eventos-proximos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM eventos
            WHERE data_evento >= CURRENT_DATE AND status != 'Encerrado'
            ORDER BY data_evento ASC
            LIMIT 3
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar eventos' });
    }
});

// GET /api/dashboard/diretoria — Diretoria pública do site
router.get('/diretoria', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, nome, cargo, tipo, descricao, foto_url, email, ordem
             FROM diretoria WHERE ativo = true ORDER BY tipo, ordem, nome`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar diretoria' });
    }
});

// GET /api/dashboard/config-all — Todas as configurações (para injeção dinâmica no site)
router.get('/config-all', async (req, res) => {
    try {
        const result = await pool.query('SELECT chave, valor FROM configuracoes');
        const config = {};
        result.rows.forEach(row => { config[row.chave] = row.valor; });
        res.json(config);
    } catch (err) {
        res.json({
            site_telefone: '(00) 0000-0000',
            site_email: 'contato@cieib.org.br',
            site_whatsapp: '5500000000000',
            site_endereco: 'Rua Exemplo, 1000<br>Bairro Centro<br>CEP 00000-000<br>Cidade - UF',
            site_horario: 'Seg a Sex: 09h às 17h'
        });
    }
});

// GET /api/dashboard/redes-sociais — Redes sociais ativas (público)
router.get('/redes-sociais', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT nome, url, icone, ordem FROM redes_sociais WHERE ativa = true ORDER BY ordem'
        );
        res.json(result.rows);
    } catch (err) {
        res.json([]);
    }
});

// GET /api/dashboard/conteudos/:pagina — Conteúdos CMS por página (público)
router.get('/conteudos/:pagina', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT secao, titulo, conteudo, imagem_url, ordem FROM pagina_conteudos WHERE pagina = $1 ORDER BY ordem',
            [req.params.pagina]
        );
        res.json(result.rows);
    } catch (err) {
        res.json([]);
    }
});

module.exports = router;
