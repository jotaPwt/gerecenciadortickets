const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token de autenticação não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_ticket_system_2026_neon_db', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado. Por favor, faça login novamente.' });
    }
    req.user = decoded;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a Administradores.' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin
};
