const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Listar todos os usuários (apenas Admin)
async function getUsers(req, res) {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, created_at,
              (SELECT COUNT(*) FROM tickets WHERE user_id = users.id) as ticket_count
       FROM users 
       ORDER BY created_at DESC`
    );

    return res.json({ users: result.rows });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ error: 'Erro interno ao listar usuários.' });
  }
}

// Criar novo usuário (Admin)
async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = (role === 'admin') ? 'admin' : 'user';

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, assignedRole]
    );

    return res.status(201).json({
      message: 'Usuário criado com sucesso!',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
}

// Alterar cargo do usuário (Admin)
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Cargo inválido. Use "admin" ou "user".' });
    }

    // Não permitir que o admin altere seu próprio cargo
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ error: 'Você não pode alterar seu próprio cargo.' });
    }

    const result = await db.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role`,
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json({
      message: 'Cargo do usuário atualizado!',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao alterar cargo:', error);
    return res.status(500).json({ error: 'Erro ao alterar cargo do usuário.' });
  }
}

// Excluir usuário (Admin)
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser
};
