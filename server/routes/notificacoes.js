/* ==============================================================
   Rotas de Notificações — com alertas inteligentes
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// ---- Helper: gerar alertas dinâmicos baseados nas movimentações ----
async function gerarAlertasDinamicos(ministroId) {
    const alertas = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    try {
        // 1) Boletos vencendo hoje, amanhã, ou vencidos nos últimos 7 dias
        const boletos = await pool.query(`
            SELECT id, referencia, valor, data_vencimento, status
            FROM ministro_boletos
            WHERE ministro_id = $1
              AND status IN ('pendente','aberto','vencido')
              AND data_vencimento >= CURRENT_DATE - INTERVAL '7 days'
              AND data_vencimento <= CURRENT_DATE + INTERVAL '7 days'
            ORDER BY data_vencimento ASC
        `, [ministroId]);

        for (const b of boletos.rows) {
            const venc = new Date(b.data_vencimento);
            venc.setHours(0, 0, 0, 0);
            const diffDays = Math.round((venc - hoje) / 86400000);
            const valor = parseFloat(b.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const ref = b.referencia || 'Boleto';

            if (diffDays < 0) {
                alertas.push({
                    id: -1000 - b.id, titulo: '⚠️ Boleto Vencido!',
                    mensagem: `${ref} no valor de ${valor} venceu há ${Math.abs(diffDays)} dia(s). Regularize sua situação.`,
                    tipo: 'warning', link: '#historico', lida: false,
                    created_at: b.data_vencimento
                });
            } else if (diffDays === 0) {
                alertas.push({
                    id: -2000 - b.id, titulo: '🔴 Boleto Vence HOJE!',
                    mensagem: `${ref} no valor de ${valor} vence hoje. Pague para evitar atraso.`,
                    tipo: 'alerta', link: '#historico', lida: false,
                    created_at: b.data_vencimento
                });
            } else if (diffDays <= 3) {
                alertas.push({
                    id: -3000 - b.id, titulo: '📅 Boleto Vencendo em Breve',
                    mensagem: `${ref} no valor de ${valor} vence em ${diffDays} dia(s) (${venc.toLocaleDateString('pt-BR')}).`,
                    tipo: 'boleto', link: '#historico', lida: false,
                    created_at: b.data_vencimento
                });
            } else {
                alertas.push({
                    id: -4000 - b.id, titulo: '💰 Boleto a Vencer',
                    mensagem: `${ref} no valor de ${valor} vence em ${venc.toLocaleDateString('pt-BR')}.`,
                    tipo: 'info', link: '#historico', lida: false,
                    created_at: b.data_vencimento
                });
            }
        }

        // 2) Contas a receber abertas com vencimento próximo
        const contas = await pool.query(`
            SELECT id, servico, saldo, data_vencimento, status
            FROM contas_receber
            WHERE ministro_id = $1
              AND status IN ('ABERTO','PARCIAL')
              AND saldo > 0
              AND data_vencimento IS NOT NULL
              AND data_vencimento <= CURRENT_DATE + INTERVAL '10 days'
            ORDER BY data_vencimento ASC
        `, [ministroId]);

        for (const c of contas.rows) {
            const venc = new Date(c.data_vencimento);
            venc.setHours(0, 0, 0, 0);
            const diffDays = Math.round((venc - hoje) / 86400000);
            const saldo = parseFloat(c.saldo || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const servico = c.servico || 'Conta';

            if (diffDays < 0) {
                alertas.push({
                    id: -5000 - c.id, titulo: '⚠️ Conta em Atraso',
                    mensagem: `${servico} — saldo ${saldo} venceu há ${Math.abs(diffDays)} dia(s).`,
                    tipo: 'warning', link: '#historico', lida: false,
                    created_at: c.data_vencimento
                });
            } else if (diffDays <= 3) {
                alertas.push({
                    id: -6000 - c.id, titulo: '📋 Conta Vencendo',
                    mensagem: `${servico} — saldo ${saldo} vence ${diffDays === 0 ? 'HOJE' : `em ${diffDays} dia(s)`}.`,
                    tipo: 'financeiro', link: '#historico', lida: false,
                    created_at: c.data_vencimento
                });
            }
        }

        // 3) Anuidade pendente
        const ministro = await pool.query(
            'SELECT anuidade_status, credencial_status, nome FROM ministros WHERE id = $1',
            [ministroId]
        );
        if (ministro.rows.length > 0) {
            const m = ministro.rows[0];
            if (m.anuidade_status === 'pendente' || m.anuidade_status === 'vencida') {
                alertas.push({
                    id: -7000, titulo: '💳 Anuidade Pendente',
                    mensagem: 'Sua anuidade está pendente de pagamento. Regularize para manter seus benefícios.',
                    tipo: 'warning', link: '#historico', lida: false,
                    created_at: new Date().toISOString()
                });
            }

            // 4) Credencial pendente/expirada
            if (m.credencial_status === 'pendente' || m.credencial_status === 'expirada') {
                alertas.push({
                    id: -7001, titulo: '🪪 Credencial Pendente',
                    mensagem: m.credencial_status === 'expirada'
                        ? 'Sua credencial expirou. Solicite a renovação.'
                        : 'Sua credencial está pendente de emissão. Solicite pelo painel.',
                    tipo: 'credencial', link: '#credencial', lida: false,
                    created_at: new Date().toISOString()
                });
            }
        }

        // 5) Credencial digital expirando nos próximos 30 dias
        const creds = await pool.query(`
            SELECT id, numero_credencial, data_validade
            FROM ministro_credenciais
            WHERE ministro_id = $1 AND status = 'ativa'
              AND data_validade IS NOT NULL
              AND data_validade <= CURRENT_DATE + INTERVAL '30 days'
              AND data_validade >= CURRENT_DATE
            ORDER BY data_validade ASC LIMIT 1
        `, [ministroId]);

        if (creds.rows.length > 0) {
            const cr = creds.rows[0];
            const venc = new Date(cr.data_validade);
            const diffDays = Math.round((venc - hoje) / 86400000);
            alertas.push({
                id: -8000, titulo: '🪪 Credencial Expirando',
                mensagem: `Sua credencial ${cr.numero_credencial || ''} expira em ${diffDays} dia(s) (${venc.toLocaleDateString('pt-BR')}). Solicite renovação.`,
                tipo: 'credencial', link: '#credencial', lida: false,
                created_at: new Date().toISOString()
            });
        }

        // 6) Chamados de suporte com resposta não lida
        const tickets = await pool.query(`
            SELECT id, protocolo, assunto, respondido_em
            FROM suporte_tickets
            WHERE ministro_id = $1 AND status = 'respondido'
            ORDER BY respondido_em DESC LIMIT 5
        `, [ministroId]);

        for (const t of tickets.rows) {
            alertas.push({
                id: -9000 - t.id, titulo: '💬 Resposta no Suporte',
                mensagem: `Seu chamado #${t.protocolo} "${t.assunto}" foi respondido.`,
                tipo: 'suporte', link: null, lida: false,
                created_at: t.respondido_em || new Date().toISOString()
            });
        }

    } catch (err) {
        console.error('Erro ao gerar alertas dinâmicos:', err);
    }

    return alertas;
}

// GET /api/notificacoes — Notificações do ministro + alertas dinâmicos
router.get('/', auth, async (req, res) => {
    try {
        // Notificações salvas no banco
        const result = await pool.query(`
            SELECT id, titulo, mensagem, tipo, link, lida, created_at
            FROM notificacoes
            WHERE ministro_id = $1
            ORDER BY created_at DESC
            LIMIT 50
        `, [req.userId]);

        // Notificações globais (últimos 30 dias)
        const globais = await pool.query(`
            SELECT id, titulo, mensagem, tipo, link, created_at
            FROM notificacoes
            WHERE global = TRUE AND created_at >= NOW() - INTERVAL '30 days'
            ORDER BY created_at DESC
            LIMIT 10
        `);

        // Verificar quais globais o ministro já leu
        const lidas = await pool.query(
            'SELECT id FROM notificacoes WHERE ministro_id = $1 AND lida = TRUE',
            [req.userId]
        );
        const lidasSet = new Set(lidas.rows.map(r => r.id));

        const globaisComStatus = globais.rows.map(g => ({
            ...g,
            lida: lidasSet.has(g.id)
        }));

        // Alertas dinâmicos (baseados nas movimentações)
        const alertas = await gerarAlertasDinamicos(req.userId);

        // Mesclar: alertas dinâmicos primeiro, depois notificações do banco, depois globais
        const todas = [...alertas, ...result.rows, ...globaisComStatus];

        // Ordenar por created_at DESC
        todas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json(todas);
    } catch (err) {
        console.error('Erro ao buscar notificações:', err);
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
});

// PUT /api/notificacoes/:id/lida — Marcar como lida
router.put('/:id/lida', auth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        // IDs negativos são alertas dinâmicos — não persistem no banco
        if (id > 0) {
            await pool.query(
                'UPDATE notificacoes SET lida = TRUE WHERE id = $1 AND (ministro_id = $2 OR global = TRUE)',
                [id, req.userId]
            );
        }
        res.json({ message: 'Notificação marcada como lida' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar notificação' });
    }
});

// PUT /api/notificacoes/ler-todas — Marcar todas como lidas
router.put('/ler-todas', auth, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notificacoes SET lida = TRUE WHERE ministro_id = $1',
            [req.userId]
        );
        res.json({ message: 'Todas as notificações marcadas como lidas' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar notificações' });
    }
});

// GET /api/notificacoes/nao-lidas — Contagem de não lidas
router.get('/nao-lidas', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT COUNT(*) FROM notificacoes WHERE ministro_id = $1 AND lida = FALSE',
            [req.userId]
        );
        // Também contar alertas dinâmicos
        const alertas = await gerarAlertasDinamicos(req.userId);
        const total = parseInt(result.rows[0].count) + alertas.length;
        res.json({ count: total });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao contar notificações' });
    }
});

// GET /api/notificacoes/site — Notificações públicas para o site (sem auth)
router.get('/site', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, titulo, mensagem, tipo, link, data_inicio
            FROM notificacoes_site
            WHERE ativa = TRUE
              AND data_inicio <= NOW()
              AND (data_fim IS NULL OR data_fim >= NOW())
            ORDER BY data_inicio DESC
            LIMIT 5
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar notificações do site:', err);
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
});

module.exports = router;
