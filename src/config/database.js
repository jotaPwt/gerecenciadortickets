const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERRO CRÍTICO: DATABASE_URL não foi configurado no arquivo .env!');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('⚡ Conectado com sucesso ao banco de dados PostgreSQL (Neon DB)');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexão PostgreSQL:', err);
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔄 Verificando e inicializando tabelas do banco de dados...');
    
    // Tabela de Usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'user' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de Tickets
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'Aberto' NOT NULL,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Inserir usuários padrão (Admin e Usuário Comum) se a tabela estiver vazia
    const userCheck = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(userCheck.rows[0].count, 10);

    if (userCount === 0) {
      console.log('🌱 Semeando usuários padrão (Admin e Usuário Comum)...');
      
      const adminPassHash = await bcrypt.hash('admin123', 10);
      const userPassHash = await bcrypt.hash('user123', 10);

      await client.query(`
        INSERT INTO users (name, email, password_hash, role) VALUES
        ('Administrador', 'admin@sistema.com', $1, 'admin'),
        ('Usuário Comum', 'user@sistema.com', $2, 'user');
      `, [adminPassHash, userPassHash]);

      console.log('✅ Usuários padrão criados:');
      console.log('   👑 Admin: admin@sistema.com / admin123');
      console.log('   👤 User: user@sistema.com / user123');
    }

    console.log('✅ Tabelas inicializadas com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao inicializar o banco de dados:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDatabase
};
