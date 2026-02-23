/* ==============================================================
   Rotas de Notificações — Alertas inteligentes com dados reais
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// ---- Helper: carregar alertas dispensados do banco ----
async function getDismissedKeys(ministroId) {
    try {
        const r = await pool.query(
            'SELECT alerta_key FROM notificacoes_dismissed WHERE ministro_id = $1',
            [ministroId]
        );
        return new Set(r.rows.map(x => x.alerta_key));
    } catch { return new Set(); }
}

// ---- Helper: formatar moeda ----
function moeda(v) {
    return parseFloat(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---- Helper: gerar alertas dinâmicos baseados em dados REAIS ----
async function gerarAlertasDinamicos(ministroId) {
    const alertas = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Carregar chaves dispensadas para marcar como lidas
    const dismissed = await getDismissedKeys(ministroId);

    function push(key, obj) {
        alertas.push({ ...obj, _key: key, lida: dismissed.has(key) });
    }

    try {
        // ===============================================================
        // 1) BOLETOS — vencendo/vencidos nos últimos 30 e próximos 7 dias
        // ===============================================================
        const boletos = await pool.query(`
            SELECT id, referencia, valor, data_vencimento, status
            FROM ministro_boletos
            WHERE ministro_id = $1
              AND status IN ('pendente','aberto','vencido')
              AND data_vencimento >= CURRENT_DATE - INTERVAL '30 days'
              AND data_vencimento <= CURRENT_DATE + INTERVAL '7 days'
            ORDER BY data_vencimento ASC
            LIMIT 5
        `, [ministroId]);

        for (const b of boletos.rows) {
            const venc = new Date(b.data_vencimento); venc.setHours(0,0,0,0);
            const diff = Math.round((venc - hoje) / 86400000);
            const valor = moeda(b.valor);
            const ref = b.referencia || 'Boleto';

            if (diff < 0) {
                push(`boleto_vencido_${b.id}`, {
                    id: -1000 - b.id, titulo: 'Boleto Vencido',
                    mensagem: `${ref} no valor de ${valor} venceu há ${Math.abs(diff)} dia(s).`,
                    tipo: 'warning', link: '#historico', created_at: b.data_vencimento
                });
            } else if (diff === 0) {
                push(`boleto_hoje_${b.id}`, {
                    id: -2000 - b.id, titulo: 'Boleto Vence HOJE',
                    mensagem: `${ref} no valor de ${valor} vence hoje.`,
                    tipo: 'alerta', link: '#historico', created_at: b.data_vencimento
                });
            } else if (diff <= 3) {
                push(`boleto_breve_${b.id}`, {
                    id: -3000 - b.id, titulo: 'Boleto Vencendo em Breve',
                    mensagem: `${ref} — ${valor} vence em ${diff} dia(s).`,
                    tipo: 'boleto', link: '#historico', created_at: b.data_vencimento
                });
            } else {
                push(`boleto_futuro_${b.id}`, {
                    id: -4000 - b.id, titulo: 'Boleto a Vencer',
                    mensagem: `${ref} — ${valor} vence em ${venc.toLocaleDateString('pt-BR')}.`,
                    tipo: 'info', link: '#historico', created_at: b.data_vencimento
                });
            }
        }

        // ===============================================================
        // 2) CONTAS A RECEBER — agrupadas (não duplicar por conta)
        // ===============================================================
        // a) Resumo de contas em atraso
        const contasAtraso = await pool.query(`
            SELECT COUNT(*) as total, COALESCE(SUM(saldo),0) as saldo_total
            FROM contas_receber
            WHERE ministro_id = $1
              AND status IN ('ABERTO','PARCIAL')
              AND saldo > 0
              AND data_vencimento IS NOT NULL
              AND data_vencimento < CURRENT_DATE
        `, [ministroId]);

        const totalAtraso = parseInt(contasAtraso.rows[0].total);
        const saldoAtraso = parseFloat(contasAtraso.rows[0].saldo_total);

        if (totalAtraso > 0) {
            push('contas_atraso_resumo', {
                id: -5000, titulo: 'Contas em Atraso',
                mensagem: totalAtraso === 1
                    ? `Você tem 1 conta em atraso no valor de ${moeda(saldoAtraso)}. Regularize sua situação.`
                    : `Você tem ${totalAtraso} contas em atraso totalizando ${moeda(saldoAtraso)}. Regularize sua situação.`,
                tipo: 'warning', link: '#historico',
                created_at: new Date().toISOString()
            });
        }

        // b) Contas vencendo nos próximos 10 dias (individualmente, max 3)
        const contasProx = await pool.query(`
            SELECT id, servico, saldo, data_vencimento
            FROM contas_receber
            WHERE ministro_id = $1
              AND status IN ('ABERTO','PARCIAL')
              AND saldo > 0
              AND data_vencimento >= CURRENT_DATE
              AND data_vencimento <= CURRENT_DATE + INTERVAL '10 days'
            ORDER BY data_vencimento ASC
            LIMIT 3
        `, [ministroId]);

        for (const c of contasProx.rows) {
            const venc = new Date(c.data_vencimento); venc.setHours(0,0,0,0);
            const diff = Math.round((venc - hoje) / 86400000);
            push(`conta_vencendo_${c.id}`, {
                id: -6000 - c.id, titulo: 'Conta Vencendo',
                mensagem: `${c.servico || 'Conta'} — ${moeda(c.saldo)} vence ${diff === 0 ? 'HOJE' : `em ${diff} dia(s)`}.`,
                tipo: 'financeiro', link: '#historico',
                created_at: c.data_vencimento
            });
        }

        // ===============================================================
        // 3) ANUIDADE E CREDENCIAL
        // ===============================================================
        const ministro = await pool.query(
            'SELECT anuidade_status, credencial_status, nome FROM ministros WHERE id = $1',
            [ministroId]
        );
        if (ministro.rows.length > 0) {
            const m = ministro.rows[0];
            if (m.anuidade_status === 'pendente' || m.anuidade_status === 'vencida') {
                push('anuidade_pendente', {
                    id: -7000, titulo: 'Anuidade Pendente',
                    mensagem: 'Sua anuidade está pendente. Regularize para manter seus benefícios.',
                    tipo: 'warning', link: '#historico',
                    created_at: new Date().toISOString()
                });
            }
            if (m.credencial_status === 'pendente' || m.credencial_status === 'expirada') {
                push('credencial_pendente', {
                    id: -7001, titulo: 'Credencial Pendente',
                    mensagem: m.credencial_status === 'expirada'
                        ? 'Sua credencial expirou. Solicite a renovação.'
                        : 'Sua credencial está pendente de emissão.',
                    tipo: 'credencial', link: '#credencial',
                    created_at: new Date().toISOString()
                });
            }
        }

        // Credencial expirando nos próximos 30 dias
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
            const diff = Math.round((venc - hoje) / 86400000);
            push('credencial_expirando', {
                id: -8000, titulo: 'Credencial Expirando',
                mensagem: `Sua credencial ${cr.numero_credencial || ''} expira em ${diff} dia(s) (${venc.toLocaleDateString('pt-BR')}).`,
                tipo: 'credencial', link: '#credencial',
                created_at: new Date().toISOString()
            });
        }

        // ===============================================================
        // 4) CURSOS — Matrículas ativas com dados reais
        // ===============================================================
        const matriculas = await pool.query(`
            SELECT cm.id, cm.curso_id, cm.status, cm.progresso, cm.data_matricula,
                   c.titulo, c.carga_horaria
            FROM curso_matriculas cm
            JOIN cursos c ON c.id = cm.curso_id
            WHERE cm.ministro_id = $1
              AND cm.status = 'ativo'
              AND cm.data_conclusao IS NULL
            ORDER BY cm.data_matricula ASC
        `, [ministroId]);

        for (const mat of matriculas.rows) {
            const dataMatr = new Date(mat.data_matricula);
            const diasAberto = Math.round((hoje - dataMatr) / 86400000);
            const progresso = parseInt(mat.progresso || 0);

            if (progresso === 0 && diasAberto >= 3) {
                // Matriculou mas nunca acessou
                push(`curso_nao_iniciado_${mat.curso_id}`, {
                    id: -10000 - mat.id, titulo: 'Curso Não Iniciado',
                    mensagem: `Você se matriculou em "${mat.titulo}" há ${diasAberto} dia(s) e ainda não começou. Comece agora!`,
                    tipo: 'curso', link: '#cursos',
                    created_at: mat.data_matricula
                });
            } else if (progresso > 0 && progresso < 100 && diasAberto >= 7) {
                // Curso em andamento parado
                push(`curso_parado_${mat.curso_id}`, {
                    id: -11000 - mat.id, titulo: 'Curso em Andamento',
                    mensagem: `"${mat.titulo}" está com ${progresso}% de progresso há ${diasAberto} dia(s). Continue seus estudos!`,
                    tipo: 'curso', link: '#cursos',
                    created_at: mat.data_matricula
                });
            }
        }

        // ===============================================================
        // 5) EVENTOS — Inscrições e eventos próximos
        // ===============================================================
        const inscricoes = await pool.query(`
            SELECT ei.id, ei.status_inscricao, ei.valor, ei.valor_baixa, ei.data_inscricao,
                   e.titulo, e.data_evento, e.data_termino, e.local
            FROM evento_inscricoes ei
            JOIN eventos e ON e.id = ei.evento_id
            WHERE ei.ministro_id = $1
              AND e.data_evento >= CURRENT_DATE - INTERVAL '1 day'
            ORDER BY e.data_evento ASC
            LIMIT 5
        `, [ministroId]);

        for (const insc of inscricoes.rows) {
            const dataEvento = new Date(insc.data_evento);
            const diasAte = Math.round((dataEvento - hoje) / 86400000);
            const pago = parseFloat(insc.valor_baixa || 0);
            const total = parseFloat(insc.valor || 0);

            if (insc.status_inscricao === 'ABERTO' && total > 0 && pago < total) {
                // Inscrição com pagamento pendente
                push(`evento_pag_${insc.id}`, {
                    id: -12000 - insc.id, titulo: 'Inscrição Pendente',
                    mensagem: `Pagamento de ${moeda(total - pago)} pendente para o evento "${insc.titulo}".`,
                    tipo: 'evento', link: '#eventos',
                    created_at: insc.data_inscricao
                });
            } else if (diasAte >= 0 && diasAte <= 7) {
                // Evento acontecerá em breve
                push(`evento_proximo_${insc.id}`, {
                    id: -13000 - insc.id, titulo: 'Evento Próximo',
                    mensagem: diasAte === 0
                        ? `"${insc.titulo}" acontece HOJE!${insc.local ? ' Local: ' + insc.local : ''}`
                        : `"${insc.titulo}" acontece em ${diasAte} dia(s).${insc.local ? ' Local: ' + insc.local : ''}`,
                    tipo: 'evento', link: '#eventos',
                    created_at: insc.data_inscricao
                });
            }
        }

        // ===============================================================
        // 6) MENSAGENS — Mensagens não lidas
        // ===============================================================
        const msgNaoLidas = await pool.query(`
            SELECT COUNT(*) as total
            FROM mensagens
            WHERE ministro_id = $1
              AND tipo = 'recebida'
              AND lida = FALSE
              AND excluida = FALSE
        `, [ministroId]);

        const totalMsg = parseInt(msgNaoLidas.rows[0].total);
        if (totalMsg > 0) {
            push('mensagens_nao_lidas', {
                id: -14000, titulo: 'Mensagens Não Lidas',
                mensagem: totalMsg === 1
                    ? 'Você tem 1 mensagem não lida.'
                    : `Você tem ${totalMsg} mensagens não lidas.`,
                tipo: 'mensagem', link: '#mensagens',
                created_at: new Date().toISOString()
            });
        }

        // ===============================================================
        // 7) SUPORTE — Chamados respondidos
        // ===============================================================
        const tickets = await pool.query(`
            SELECT id, protocolo, assunto, respondido_em
            FROM suporte_tickets
            WHERE ministro_id = $1 AND status = 'respondido'
            ORDER BY respondido_em DESC LIMIT 3
        `, [ministroId]);

        for (const t of tickets.rows) {
            push(`suporte_resp_${t.id}`, {
                id: -9000 - t.id, titulo: 'Resposta no Suporte',
                mensagem: `Chamado #${t.protocolo} "${t.assunto}" foi respondido.`,
                tipo: 'suporte', link: null,
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

        // Alertas dinâmicos (baseados em dados reais — já vêm com lida baseada em dismissed)
        const alertas = await gerarAlertasDinamicos(req.userId);

        // Mesclar: alertas dinâmicos primeiro, depois notificações do banco, depois globais
        const todas = [...alertas, ...result.rows, ...globaisComStatus];

        // Ordenar: não-lidas primeiro, depois por created_at DESC
        todas.sort((a, b) => {
            if (a.lida !== b.lida) return a.lida ? 1 : -1;
            return new Date(b.created_at) - new Date(a.created_at);
        });

        res.json(todas);
    } catch (err) {
        console.error('Erro ao buscar notificações:', err);
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
});

// PUT /api/notificacoes/:id/lida — Marcar como lida (banco ou dinâmica)
router.put('/:id/lida', auth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { alertaKey } = req.body || {};

        if (id > 0) {
            // Notificação persistida no banco
            await pool.query(
                'UPDATE notificacoes SET lida = TRUE WHERE id = $1 AND (ministro_id = $2 OR global = TRUE)',
                [id, req.userId]
            );
        } else if (alertaKey) {
            // Alerta dinâmico — persistir no banco de dismissões
            await pool.query(
                'INSERT INTO notificacoes_dismissed (ministro_id, alerta_key) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [req.userId, alertaKey]
            );
        }
        res.json({ message: 'Notificação marcada como lida' });
    } catch (err) {
        console.error('Erro ao marcar notificação lida:', err);
        res.status(500).json({ error: 'Erro ao atualizar notificação' });
    }
});

// PUT /api/notificacoes/ler-todas — Marcar todas como lidas (banco + dinâmicas)
router.put('/ler-todas', auth, async (req, res) => {
    try {
        // Marcar notificações do banco
        await pool.query(
            'UPDATE notificacoes SET lida = TRUE WHERE ministro_id = $1',
            [req.userId]
        );

        // Marcar todos alertas dinâmicos atuais como dispensados
        const alertas = await gerarAlertasDinamicos(req.userId);
        for (const a of alertas) {
            if (a._key) {
                await pool.query(
                    'INSERT INTO notificacoes_dismissed (ministro_id, alerta_key) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [req.userId, a._key]
                );
            }
        }

        res.json({ message: 'Todas as notificações marcadas como lidas' });
    } catch (err) {
        console.error('Erro ao marcar todas lidas:', err);
        res.status(500).json({ error: 'Erro ao atualizar notificações' });
    }
});

// GET /api/notificacoes/nao-lidas — Contagem de não lidas (real)
router.get('/nao-lidas', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT COUNT(*) FROM notificacoes WHERE ministro_id = $1 AND lida = FALSE',
            [req.userId]
        );
        // Alertas dinâmicos já vêm com dismissed aplicado
        const alertas = await gerarAlertasDinamicos(req.userId);
        const naoLidasDinamicas = alertas.filter(a => !a.lida).length;
        const total = parseInt(result.rows[0].count) + naoLidasDinamicas;
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
