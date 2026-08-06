const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Por favor, preencha todos os campos obrigatórios (nome, email e senha).' });
    }

    // Verificar se o email já existe
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = (role === 'admin') ? 'admin' : 'user';

    const newUser = await db.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, assignedRole]
    );

    const user = newUser.rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'super_secret_jwt_key_ticket_system_2026_neon_db',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      user,
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao registrar usuário.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Informe o e-mail e a senha.' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'super_secret_jwt_key_ticket_system_2026_neon_db',
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao realizar login.' });
  }
}

async function getMe(req, res) {
  try {
    const result = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar dados do perfil:', error);
    return res.status(500).json({ error: 'Erro ao buscar perfil do usuário.' });
  }
}

module.exports = {
  register,
  login,
  getMe
};
