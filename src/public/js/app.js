/* ==========================================================================
   SISTEMA DE GERENCIAMENTO DE TICKETS - LÓGICA DO FRONTEND (APP.JS)
   ========================================================================== */

const API_BASE = '/api';

// Estado global da aplicação
let state = {
  token: localStorage.getItem('ticket_token') || null,
  user: JSON.parse(localStorage.getItem('ticket_user') || 'null'),
  tickets: [],
  currentTicketId: null,
  activeFilter: 'todos',
  searchQuery: ''
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
  initLucideIcons();
  checkAuth();
});

function initLucideIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

// Alternar abas de Login/Registro
function switchAuthTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

  if (tab === 'login') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('login-form').classList.add('active');
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('register-form').classList.add('active');
  }
}

// Preencher credenciais de teste ao clicar na dica
function fillCredentials(email, password) {
  switchAuthTab('login');
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
}

// Verificar autenticação
async function checkAuth() {
  if (!state.token) {
    showAuthScreen();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (res.ok) {
      const data = await res.json();
      state.user = data.user;
      localStorage.setItem('ticket_user', JSON.stringify(data.user));
      showDashboardScreen();
    } else {
      handleLogout();
    }
  } catch (err) {
    console.error('Erro ao verificar sessão:', err);
    showAuthScreen();
  }
}

// Exibir Tela de Login
function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('dashboard-screen').classList.add('hidden');
}

// Exibir Tela de Dashboard
function showDashboardScreen() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('dashboard-screen').classList.remove('hidden');

  // Atualizar informações do usuário logado
  const avatar = document.getElementById('user-avatar');
  const nameEl = document.getElementById('display-user-name');
  const roleEl = document.getElementById('display-user-role');
  const adminUsersBtn = document.getElementById('admin-users-btn');

  if (state.user) {
    avatar.textContent = state.user.name.charAt(0).toUpperCase();
    nameEl.textContent = state.user.name;

    if (state.user.role === 'admin') {
      roleEl.textContent = '👑 Admin';
      roleEl.className = 'badge badge-admin';
      adminUsersBtn.classList.remove('hidden');
    } else {
      roleEl.textContent = '👤 Usuário';
      roleEl.className = 'badge badge-user';
      adminUsersBtn.classList.add('hidden');
    }
  }

  loadDashboardData();
}

// Carregar Dados do Dashboard (Stats + Tickets)
async function loadDashboardData() {
  await Promise.all([loadStats(), loadTickets()]);
}

// Processar Login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('ticket_token', data.token);
      localStorage.setItem('ticket_user', JSON.stringify(data.user));

      showToast('Login realizado com sucesso!', 'success');
      showDashboardScreen();
    } else {
      showToast(data.error || 'Erro ao realizar login.', 'error');
    }
  } catch (err) {
    console.error('Erro na requisição de login:', err);
    showToast('Erro de conexão com o servidor.', 'error');
  }
}

// Processar Registro
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('ticket_token', data.token);
      localStorage.setItem('ticket_user', JSON.stringify(data.user));

      showToast('Conta criada com sucesso!', 'success');
      showDashboardScreen();
    } else {
      showToast(data.error || 'Erro ao criar conta.', 'error');
    }
  } catch (err) {
    console.error('Erro no registro:', err);
    showToast('Erro de conexão ao criar conta.', 'error');
  }
}

// Logout
function handleLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('ticket_token');
  localStorage.removeItem('ticket_user');
  showToast('Sessão encerrada.', 'success');
  showAuthScreen();
}

// Carregar Estatísticas
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/tickets/stats`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (res.ok) {
      const data = await res.json();
      const stats = data.stats;

      document.getElementById('stat-total').textContent = stats.total;
      document.getElementById('stat-aberto').textContent = stats.abertos;
      document.getElementById('stat-andamento').textContent = stats.em_andamento;
      document.getElementById('stat-concluido').textContent = stats.concluidos;
      document.getElementById('stat-cancelado').textContent = stats.cancelados;
    }
  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err);
  }
}

// Carregar Tickets
async function loadTickets() {
  const statusFilter = document.getElementById('status-filter').value;
  const search = document.getElementById('search-input').value;

  state.activeFilter = statusFilter;
  state.searchQuery = search;

  try {
    let url = `${API_BASE}/tickets?status=${encodeURIComponent(statusFilter)}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (res.ok) {
      const data = await res.json();
      state.tickets = data.tickets;
      renderTickets();
    }
  } catch (err) {
    console.error('Erro ao carregar tickets:', err);
    showToast('Erro ao carregar lista de tickets.', 'error');
  }
}

// Filtrar ao clicar nos cards de estatística
function filterByStatus(status) {
  document.getElementById('status-filter').value = status;
  loadTickets();
}

// Busca ao digitar
function handleSearch() {
  loadTickets();
}

// Renderizar Lista de Tickets
function renderTickets() {
  const grid = document.getElementById('tickets-grid');
  const emptyState = document.getElementById('empty-state');
  const badge = document.getElementById('tickets-count-badge');
  const sectionTitle = document.getElementById('tickets-section-title');

  badge.textContent = `${state.tickets.length} encontrado(s)`;

  if (state.user.role === 'admin') {
    sectionTitle.textContent = 'Todos os Chamados do Sistema';
  } else {
    sectionTitle.textContent = 'Meus Chamados Solicitados';
  }

  if (state.tickets.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  grid.innerHTML = state.tickets.map(ticket => {
    const dateFormatted = new Date(ticket.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const statusBadgeClass = getStatusBadgeClass(ticket.status);

    return `
      <div class="ticket-card glass-card">
        <div>
          <div class="ticket-header">
            <span class="ticket-id">#${ticket.id}</span>
            <span class="badge ${statusBadgeClass}">${ticket.status}</span>
          </div>

          <h4 class="ticket-title">${escapeHtml(ticket.title)}</h4>
          <p class="ticket-desc-snippet">${escapeHtml(ticket.description)}</p>
        </div>

        <div>
          <div class="ticket-meta">
            <div class="ticket-author">
              <i data-lucide="user"></i>
              <span>${escapeHtml(ticket.author_name)}</span>
            </div>
            <span>${dateFormatted}</span>
          </div>

          <div class="ticket-actions">
            <button class="btn btn-secondary" onclick="openDetailModal(${ticket.id})">
              <i data-lucide="eye"></i> Ver Detalhes
            </button>

            ${(state.user.role === 'admin' || ticket.author_id === state.user.id) ? `
              <button class="btn btn-outline" onclick="openEditTicketModal(${ticket.id})">
                <i data-lucide="edit-3"></i>
              </button>
              <button class="btn btn-outline" onclick="deleteTicket(${ticket.id})">
                <i data-lucide="trash-2"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  initLucideIcons();
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Aberto': return 'badge-aberto';
    case 'Em Andamento': return 'badge-andamento';
    case 'Concluído': return 'badge-concluido';
    case 'Cancelado': return 'badge-cancelado';
    default: return 'badge-aberto';
  }
}

// Abrir Modal de Criar Ticket
function openNewTicketModal() {
  document.getElementById('ticket-id').value = '';
  document.getElementById('ticket-title-input').value = '';
  document.getElementById('ticket-desc-input').value = '';
  document.getElementById('modal-ticket-title').innerHTML = '<i data-lucide="ticket"></i> Criar Novo Ticket';

  document.getElementById('ticket-modal').classList.remove('hidden');
  initLucideIcons();
}

// Abrir Modal de Editar Ticket
function openEditTicketModal(ticketId) {
  const ticket = state.tickets.find(t => t.id === ticketId);
  if (!ticket) return;

  document.getElementById('ticket-id').value = ticket.id;
  document.getElementById('ticket-title-input').value = ticket.title;
  document.getElementById('ticket-desc-input').value = ticket.description;
  document.getElementById('modal-ticket-title').innerHTML = '<i data-lucide="edit-3"></i> Editar Ticket #' + ticket.id;

  document.getElementById('ticket-modal').classList.remove('hidden');
  initLucideIcons();
}

// Salvar Ticket (Criar ou Atualizar)
async function handleSaveTicket(e) {
  e.preventDefault();
  const id = document.getElementById('ticket-id').value;
  const title = document.getElementById('ticket-title-input').value;
  const description = document.getElementById('ticket-desc-input').value;

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_BASE}/tickets/${id}` : `${API_BASE}/tickets`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ title, description })
    });

    const data = await res.json();

    if (res.ok) {
      showToast(id ? 'Ticket atualizado com sucesso!' : 'Ticket criado com sucesso!', 'success');
      closeModal('ticket-modal');
      loadDashboardData();
    } else {
      showToast(data.error || 'Erro ao salvar ticket.', 'error');
    }
  } catch (err) {
    console.error('Erro ao salvar ticket:', err);
    showToast('Erro de conexão ao salvar ticket.', 'error');
  }
}

// Excluir Ticket
async function deleteTicket(ticketId) {
  if (!confirm(`Tem certeza de que deseja excluir o ticket #${ticketId}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (res.ok) {
      showToast('Ticket excluído com sucesso.', 'success');
      loadDashboardData();
    } else {
      const data = await res.json();
      showToast(data.error || 'Erro ao excluir ticket.', 'error');
    }
  } catch (err) {
    console.error('Erro ao excluir ticket:', err);
    showToast('Erro de conexão ao excluir ticket.', 'error');
  }
}

// Abrir Modal de Detalhes
async function openDetailModal(ticketId) {
  try {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (res.ok) {
      const data = await res.json();
      const ticket = data.ticket;
      state.currentTicketId = ticket.id;

      document.getElementById('detail-id').textContent = ticket.id;
      document.getElementById('detail-title').textContent = ticket.title;
      document.getElementById('detail-desc').textContent = ticket.description;
      document.getElementById('detail-author-name').textContent = ticket.author_name;
      document.getElementById('detail-author-email').textContent = ticket.author_email;

      const dateFormatted = new Date(ticket.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      document.getElementById('detail-date').textContent = `Criado em: ${dateFormatted}`;

      const badgeEl = document.getElementById('detail-status-badge');
      badgeEl.textContent = ticket.status;
      badgeEl.className = `badge ${getStatusBadgeClass(ticket.status)}`;

      document.getElementById('detail-modal').classList.remove('hidden');
      initLucideIcons();
    }
  } catch (err) {
    console.error('Erro ao buscar detalhes do ticket:', err);
  }
}

// Alterar Status do Ticket no Modal de Detalhes
async function changeTicketStatus(newStatus) {
  if (!state.currentTicketId) return;

  try {
    const res = await fetch(`${API_BASE}/tickets/${state.currentTicketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      showToast(`Status alterado para "${newStatus}"!`, 'success');
      openDetailModal(state.currentTicketId);
      loadDashboardData();
    } else {
      const data = await res.json();
      showToast(data.error || 'Erro ao alterar status.', 'error');
    }
  } catch (err) {
    console.error('Erro ao alterar status:', err);
    showToast('Erro de conexão ao alterar status.', 'error');
  }
}

// Abrir Modal de Gestão de Usuários (Admin)
async function openUsersModal() {
  if (state.user.role !== 'admin') return;

  document.getElementById('users-modal').classList.remove('hidden');
  loadUsersList();
  initLucideIcons();
}

// Carregar Lista de Usuários (Admin)
async function loadUsersList() {
  try {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (res.ok) {
      const data = await res.json();
      const tbody = document.getElementById('users-table-body');

      tbody.innerHTML = data.users.map(u => `
        <tr>
          <td>#${u.id}</td>
          <td><strong>${escapeHtml(u.name)}</strong></td>
          <td>${escapeHtml(u.email)}</td>
          <td>
            <select onchange="updateUserRole(${u.id}, this.value)" ${u.id === state.user.id ? 'disabled' : ''}>
              <option value="user" ${u.role === 'user' ? 'selected' : ''}>Usuário Comum</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador</option>
            </select>
          </td>
          <td>${u.ticket_count} ticket(s)</td>
          <td>
            ${u.id !== state.user.id ? `
              <button class="btn btn-outline" onclick="deleteUser(${u.id})" title="Excluir Usuário">
                <i data-lucide="trash-2"></i>
              </button>
            ` : '<span class="text-muted">(Você)</span>'}
          </td>
        </tr>
      `).join('');

      initLucideIcons();
    }
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
  }
}

// Criar Usuário pelo Admin
async function handleAdminCreateUser(e) {
  e.preventDefault();
  const name = document.getElementById('admin-new-name').value;
  const email = document.getElementById('admin-new-email').value;
  const password = document.getElementById('admin-new-password').value;
  const role = document.getElementById('admin-new-role').value;

  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();

    if (res.ok) {
      showToast('Usuário cadastrado com sucesso!', 'success');
      document.getElementById('admin-create-user-form').reset();
      loadUsersList();
    } else {
      showToast(data.error || 'Erro ao criar usuário.', 'error');
    }
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    showToast('Erro ao criar usuário.', 'error');
  }
}

// Alterar Cargo de Usuário (Admin)
async function updateUserRole(userId, newRole) {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ role: newRole })
    });

    if (res.ok) {
      showToast('Cargo atualizado com sucesso!', 'success');
      loadUsersList();
    } else {
      const data = await res.json();
      showToast(data.error || 'Erro ao alterar cargo.', 'error');
    }
  } catch (err) {
    console.error('Erro ao alterar cargo:', err);
  }
}

// Excluir Usuário (Admin)
async function deleteUser(userId) {
  if (!confirm('Deseja realmente excluir este usuário? Todos os tickets associados também serão excluídos.')) return;

  try {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (res.ok) {
      showToast('Usuário excluído com sucesso.', 'success');
      loadUsersList();
    } else {
      const data = await res.json();
      showToast(data.error || 'Erro ao excluir usuário.', 'error');
    }
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
  }
}

// Alternar Tema Escuro / Claro
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);

  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.setAttribute('data-lucide', newTheme === 'dark' ? 'sun' : 'moon');
    initLucideIcons();
  }
}

// Utilitários de Modal
function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function closeModalOnBackdrop(e, modalId) {
  if (e.target.classList.contains('modal-backdrop')) {
    closeModal(modalId);
  }
}

// Notificações Toast
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  initLucideIcons();

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}
