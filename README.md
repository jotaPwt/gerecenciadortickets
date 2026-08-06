# Sistema de Gerenciamento de Tickets (Full-Stack)

Sistema completo de gerenciamento de chamados/tickets com controle de acesso baseado em funções (RBAC), autenticação via JWT, banco de dados PostgreSQL hospedado no Neon DB e interface web responsiva e moderna.

## 🚀 Tecnologias Utilizadas

- **Backend**: Node.js, Express.js
- **Banco de Dados**: PostgreSQL (Neon DB) via `pg` pool com SSL
- **Autenticação**: JSON Web Tokens (JWT) & `bcryptjs` para hash de senhas
- **Frontend**: Single-Page Application (SPA) com HTML5, Vanilla CSS3 (Glassmorphism, Dark/Light Mode), Lucide Icons
- **Gerenciador de Estado / RBAC**: Controle de sessão e permissões dinâmicas

---

## 🔐 Níveis de Acesso e Permissões (RBAC)

### 👑 **Administrador (Admin)**
- Visualiza todos os tickets de todos os usuários do sistema.
- Altera o status de qualquer ticket para `Aberto`, `Em Andamento`, `Concluído` ou `Cancelado`.
- Cria, edita e exclui qualquer ticket.
- **Painel Administrativo de Usuários**: Pode cadastrar novos usuários, alterar cargos (`user` ↔ `admin`) e remover usuários.

### 👤 **Usuário Comum (User)**
- Cria e abre novos tickets com título e descrição detalhada.
- Visualiza e acompanha apenas os tickets criados por ele próprio.
- Altera e atualiza seus próprios tickets.

---

## 🔑 Credenciais Padrão para Teste

Ao iniciar o servidor pela primeira vez, o banco de dados é automaticamente semeado com duas contas padrão:

| Perfil | E-mail | Senha |
| :--- | :--- | :--- |
| 👑 **Administrador** | `admin@sistema.com` | `admin123` |
| 👤 **Usuário Comum** | `user@sistema.com` | `user123` |

---

## 🛠️ Como Executar o Projeto

1. Clone o repositório:
   ```bash
   git clone https://github.com/jotaPwt/gerecenciadortickets.git
   cd gerecenciadortickets
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o arquivo `.env` (já pré-configurado com o Neon DB):
   ```env
   PORT=3000
   DATABASE_URL=postgresql://neondb_owner:npg_UkZ0TQS9GhKP@ep-rough-block-axwjl2ad-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=super_secret_jwt_key_ticket_system_2026_neon_db
   ```

4. Inicie o servidor:
   ```bash
   npm start
   ```
   *Ou em modo de desenvolvimento:*
   ```bash
   npm run dev
   ```

5. Acesse no seu navegador: `http://localhost:3000`

---

## 📡 Endpoints da API REST

### Autenticação (`/api/auth`)
- `POST /api/auth/login` - Realiza login e retorna token JWT
- `POST /api/auth/register` - Cadastro de novos usuários
- `GET /api/auth/me` - Retorna dados do perfil do usuário logado

### Tickets (`/api/tickets`)
- `GET /api/tickets` - Listar tickets (restrigo por escopo RBAC)
- `GET /api/tickets/stats` - Retorna métricas/contadores para o Dashboard
- `GET /api/tickets/:id` - Detalhes do ticket
- `POST /api/tickets` - Criar novo ticket
- `PUT /api/tickets/:id` - Editar título/descrição do ticket
- `PATCH /api/tickets/:id/status` - Alterar status do ticket (`Aberto`, `Em Andamento`, `Concluído`, `Cancelado`)
- `DELETE /api/tickets/:id` - Excluir ticket

### Usuários (`/api/users` - Admin Only)
- `GET /api/users` - Listar todos os usuários com contagem de tickets
- `POST /api/users` - Criar usuário com papel específico
- `PATCH /api/users/:id/role` - Alterar cargo do usuário
- `DELETE /api/users/:id` - Excluir usuário
