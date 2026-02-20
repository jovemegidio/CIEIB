/* ==============================================================
   Middleware de Autenticação JWT
   ============================================================== */
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Formato do token inválido' });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userCpf = decoded.cpf;
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

module.exports = authMiddleware;
