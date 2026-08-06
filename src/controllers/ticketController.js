const db = require('../config/database');

// Criar um novo ticket
async function createTicket(req, res) {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição detalhada são obrigatórios.' });
    }

    const result = await db.query(
      `INSERT INTO tickets (title, description, status, user_id) 
       VALUES ($1, $2, 'Aberto', $3) 
       RETURNING id, title, description, status, user_id, created_at, updated_at`,
      [title.trim(), description.trim(), userId]
    );

    return res.status(201).json({
      message: 'Ticket criado com sucesso!',
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao criar ticket.' });
  }
}

// Listar tickets (Admin vê todos; Usuário vê apenas os seus)
async function getTickets(req, res) {
  try {
    const { status, search } = req.query;
    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    let queryText = `
      SELECT t.id, t.title, t.description, t.status, t.created_at, t.updated_at,
             u.id as author_id, u.name as author_name, u.email as author_email
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // RBAC: Se não for admin, restringe aos tickets do próprio usuário
    if (!isAdmin) {
      queryText += ` AND t.user_id = $${paramIndex++}`;
      params.push(userId);
    }

    // Filtro por status (opcional)
    if (status && status !== 'todos') {
      queryText += ` AND t.status = $${paramIndex++}`;
      params.push(status);
    }

    // Filtro por palavra-chave (busca no título ou descrição)
    if (search) {
      queryText += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY t.created_at DESC`;

    const result = await db.query(queryText, params);
    return res.json({ tickets: result.rows });
  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar tickets.' });
  }
}

// Obter detalhes de um ticket específico
async function getTicketById(req, res) {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    const result = await db.query(
      `SELECT t.id, t.title, t.description, t.status, t.created_at, t.updated_at,
              u.id as author_id, u.name as author_name, u.email as author_email
       FROM tickets t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado.' });
    }

    const ticket = result.rows[0];

    // Verificar permissão
    if (!isAdmin && ticket.author_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado a este ticket.' });
    }

    return res.json({ ticket });
  } catch (error) {
    console.error('Erro ao obter ticket:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar ticket.' });
  }
}

// Atualizar status do ticket
async function updateTicketStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Aberto', 'Em Andamento', 'Concluído', 'Cancelado'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status inválido. Escolha entre: ${validStatuses.join(', ')}` });
    }

    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    // Verificar se ticket existe e propriedade
    const ticketCheck = await db.query('SELECT user_id FROM tickets WHERE id = $1', [id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado.' });
    }

    if (!isAdmin && ticketCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Permissão negada para alterar este ticket.' });
    }

    const result = await db.query(
      `UPDATE tickets 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, title, description, status, updated_at`,
      [status, id]
    );

    return res.json({
      message: 'Status do ticket atualizado com sucesso!',
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar status do ticket:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar status do ticket.' });
  }
}

// Editar título / descrição do ticket
async function updateTicket(req, res) {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    }

    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    const ticketCheck = await db.query('SELECT user_id FROM tickets WHERE id = $1', [id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado.' });
    }

    if (!isAdmin && ticketCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Permissão negada para editar este ticket.' });
    }

    const result = await db.query(
      `UPDATE tickets 
       SET title = $1, description = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, title, description, status, updated_at`,
      [title.trim(), description.trim(), id]
    );

    return res.json({
      message: 'Ticket atualizado com sucesso!',
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar ticket:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar ticket.' });
  }
}

// Excluir ticket
async function deleteTicket(req, res) {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    const ticketCheck = await db.query('SELECT user_id FROM tickets WHERE id = $1', [id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado.' });
    }

    if (!isAdmin && ticketCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Permissão negada para excluir este ticket.' });
    }

    await db.query('DELETE FROM tickets WHERE id = $1', [id]);
    return res.json({ message: 'Ticket excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir ticket:', error);
    return res.status(500).json({ error: 'Erro interno ao excluir ticket.' });
  }
}

// Obter estatísticas para o Dashboard
async function getStats(req, res) {
  try {
    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    let queryText = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Aberto') as abertos,
        COUNT(*) FILTER (WHERE status = 'Em Andamento') as em_andamento,
        COUNT(*) FILTER (WHERE status = 'Concluído') as concluidos,
        COUNT(*) FILTER (WHERE status = 'Cancelado') as cancelados
      FROM tickets
    `;
    const params = [];

    if (!isAdmin) {
      queryText += ` WHERE user_id = $1`;
      params.push(userId);
    }

    const result = await db.query(queryText, params);
    const stats = result.rows[0];

    return res.json({
      stats: {
        total: parseInt(stats.total, 10),
        abertos: parseInt(stats.abertos, 10),
        em_andamento: parseInt(stats.em_andamento, 10),
        concluidos: parseInt(stats.concluidos, 10),
        cancelados: parseInt(stats.cancelados, 10)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
  }
}

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  updateTicket,
  deleteTicket,
  getStats
};
