/* ==========================================================================
   TICKETMANAGER PRO - FRONTEND LOGIC (STITCH DESIGN INTEGRATED)
   ========================================================================== */

const API_BASE = '/api';

let state = {
  token: localStorage.getItem('ticket_token') || null,
  user: JSON.parse(localStorage.getItem('ticket_user') || 'null'),
  tickets: [],
  currentTicketId: null,
  activeFilter: 'todos',
  searchQuery: ''
};

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

// Alternar abas de Login/Registro
function switchAuthTab(tab) {
  const loginTab = document.getElementById('tab-login');
  const regTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');

  if (tab === 'login') {
    loginTab.className = 'flex-1 pb-3 text-center border-b-2 border-primary text-primary font-semibold text-sm transition-colors';
    regTab.className = 'flex-1 pb-3 text-center text-on-surface-variant hover:text-on-surface font-semibold text-sm transition-colors';
    loginForm.classList.remove('hidden');
    loginForm.classList.add('flex');
    regForm.classList.add('hidden');
    regForm.classList.remove('flex');
  } else {
    regTab.className = 'flex-1 pb-3 text-center border-b-2 border-primary text-primary font-semibold text-sm transition-colors';
    loginTab.className = 'flex-1 pb-3 text-center text-on-surface-variant hover:text-on-surface font-semibold text-sm transition-colors';
    regForm.classList.remove('hidden');
    regForm.classList.add('flex');
    loginForm.classList.add('hidden');
    loginForm.classList.remove('flex');
  }
}

// Preencher credenciais de teste
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
    console.error('Erro ao verificar autenticação:', err);
    showAuthScreen();
  }
}

function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('dashboard-screen').classList.add('hidden');
  document.getElementById('dashboard-screen').classList.remove('flex');
}

function showDashboardScreen() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('dashboard-screen').classList.remove('hidden');
  document.getElementById('dashboard-screen').classList.add('flex');

  const avatar = document.getElementById('user-avatar');
  const nameEl = document.getElementById('display-user-name');
  const roleEl = document.getElementById('display-user-role');
  const adminUsersBtn = document.getElementById('admin-users-btn');
  const navUsersLink = document.getElementById('nav-users-link');

  if (state.user) {
    avatar.textContent = state.user.name.charAt(0).toUpperCase();
    nameEl.textContent = state.user.name;

    if (state.user.role === 'admin') {
      roleEl.textContent = '👑 Admin';
      roleEl.className = 'text-[10px] text-primary uppercase font-bold tracking-wider leading-none mt-0.5';
      if (adminUsersBtn) adminUsersBtn.classList.remove('hidden');
      if (navUsersLink) navUsersLink.classList.remove('hidden');
    } else {
      roleEl.textContent = '👤 Usuário';
      roleEl.className = 'text-[10px] text-secondary uppercase font-bold tracking-wider leading-none mt-0.5';
      if (adminUsersBtn) adminUsersBtn.classList.add('hidden');
      if (navUsersLink) navUsersLink.classList.add('hidden');
    }
  }

  loadDashboardData();
}

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
      showToast(data.error || 'Erro no login.', 'error');
    }
  } catch (err) {
    showToast('Erro ao conectar ao servidor.', 'error');
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
    showToast('Erro de conexão ao registrar.', 'error');
  }
}

function handleLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('ticket_token');
  localStorage.removeItem('ticket_user');
  showToast('Sessão encerrada com sucesso.', 'info');
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
    console.error('Erro ao buscar tickets:', err);
  }
}

function filterByStatus(status) {
  document.getElementById('status-filter').value = status;
  loadTickets();
}

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
    emptyState.classList.add('flex');
    return;
  }

  emptyState.classList.add('hidden');
  emptyState.classList.remove('flex');

  grid.innerHTML = state.tickets.map(ticket => {
    const dateFormatted = new Date(ticket.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const statusBadge = getStatusBadgeHTML(ticket.status);

    return `
      <div class="bg-surface border border-outline rounded-xl p-5 flex flex-col justify-between ticket-card-hover">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="text-xs font-bold text-on-surface-variant/70 font-mono">#${ticket.id}</span>
            ${statusBadge}
          </div>

          <h4 class="text-base font-bold text-on-surface mb-2 line-clamp-1">${escapeHtml(ticket.title)}</h4>
          <p class="text-xs text-on-surface-variant line-clamp-3 mb-4 leading-relaxed">${escapeHtml(ticket.description)}</p>
        </div>

        <div>
          <div class="flex items-center justify-between pt-3 border-t border-outline text-[11px] text-on-surface-variant">
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm text-primary">person</span>
              <span class="font-medium">${escapeHtml(ticket.author_name)}</span>
            </div>
            <span>${dateFormatted}</span>
          </div>

          <div class="flex items-center gap-2 mt-3 pt-2">
            <button class="flex-1 bg-surface-container border border-outline hover:border-primary text-on-surface text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors" onclick="openDetailModal(${ticket.id})">
              <span class="material-symbols-outlined text-sm">visibility</span> Detalhes
            </button>

            ${(state.user.role === 'admin' || ticket.author_id === state.user.id) ? `
              <button class="p-1.5 border border-outline hover:border-primary text-on-surface-variant hover:text-on-surface rounded-lg transition-colors" onclick="openEditTicketModal(${ticket.id})" title="Editar">
                <span class="material-symbols-outlined text-base">edit</span>
              </button>
              <button class="p-1.5 border border-outline hover:border-rose-500 text-on-surface-variant hover:text-rose-400 rounded-lg transition-colors" onclick="deleteTicket(${ticket.id})" title="Excluir">
                <span class="material-symbols-outlined text-base">delete</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getStatusBadgeHTML(status) {
  switch (status) {
    case 'Aberto':
      return `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">Aberto</span>`;
    case 'Em Andamento':
      return `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">Em Andamento</span>`;
    case 'Concluído':
      return `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Concluído</span>`;
    case 'Cancelado':
      return `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">Cancelado</span>`;
    default:
      return `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant border border-outline">${status}</span>`;
  }
}

// Abrir Modal de Criar Ticket
function openNewTicketModal() {
  document.getElementById('ticket-id').value = '';
  document.getElementById('ticket-title-input').value = '';
  document.getElementById('ticket-desc-input').value = '';
  document.getElementById('modal-ticket-title').innerHTML = `<span class="material-symbols-outlined text-primary">confirmation_number</span> Criar Novo Ticket`;

  document.getElementById('ticket-modal').classList.remove('hidden');
}

// Abrir Modal de Editar Ticket
function openEditTicketModal(ticketId) {
  const ticket = state.tickets.find(t => t.id === ticketId);
  if (!ticket) return;

  document.getElementById('ticket-id').value = ticket.id;
  document.getElementById('ticket-title-input').value = ticket.title;
  document.getElementById('ticket-desc-input').value = ticket.description;
  document.getElementById('modal-ticket-title').innerHTML = `<span class="material-symbols-outlined text-primary">edit</span> Editar Ticket #${ticket.id}`;

  document.getElementById('ticket-modal').classList.remove('hidden');
}

// Salvar Ticket
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
      showToast(id ? 'Ticket atualizado!' : 'Ticket criado com sucesso!', 'success');
      closeModal('ticket-modal');
      loadDashboardData();
    } else {
      showToast(data.error || 'Erro ao salvar ticket.', 'error');
    }
  } catch (err) {
    showToast('Erro ao conectar ao servidor.', 'error');
  }
}

// Excluir Ticket
async function deleteTicket(ticketId) {
  if (!confirm(`Confirma a exclusão do ticket #${ticketId}?`)) return;

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
    showToast('Erro de conexão.', 'error');
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
      badgeEl.outerHTML = `<div id="detail-status-badge">${getStatusBadgeHTML(ticket.status)}</div>`;

      document.getElementById('detail-modal').classList.remove('hidden');
    }
  } catch (err) {
    console.error('Erro ao buscar detalhes:', err);
  }
}

// Alterar Status no Modal
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
      showToast(`Status atualizado para "${newStatus}"!`, 'success');
      openDetailModal(state.currentTicketId);
      loadDashboardData();
    } else {
      const data = await res.json();
      showToast(data.error || 'Erro ao alterar status.', 'error');
    }
  } catch (err) {
    showToast('Erro ao atualizar status.', 'error');
  }
}

// Gestão de Usuários (Admin)
async function openUsersModal() {
  if (state.user.role !== 'admin') return;

  document.getElementById('users-modal').classList.remove('hidden');
  loadUsersList();
}

async function loadUsersList() {
  try {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (res.ok) {
      const data = await res.json();
      const tbody = document.getElementById('users-table-body');

      tbody.innerHTML = data.users.map(u => `
        <tr class="hover:bg-surface-variant/30 transition-colors">
          <td class="p-3 font-mono text-on-surface-variant">#${u.id}</td>
          <td class="p-3 font-semibold text-on-surface">${escapeHtml(u.name)}</td>
          <td class="p-3 text-on-surface-variant font-mono">${escapeHtml(u.email)}</td>
          <td class="p-3">
            <select class="bg-surface border border-outline rounded text-xs py-1 px-2 text-on-surface font-medium cursor-pointer" onchange="updateUserRole(${u.id}, this.value)" ${u.id === state.user.id ? 'disabled' : ''}>
              <option value="user" ${u.role === 'user' ? 'selected' : ''}>Usuário Comum</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador</option>
            </select>
          </td>
          <td class="p-3 text-on-surface-variant">${u.ticket_count} ticket(s)</td>
          <td class="p-3 text-right">
            ${u.id !== state.user.id ? `
              <button class="p-1 text-on-surface-variant hover:text-rose-400 transition-colors" onclick="deleteUser(${u.id})" title="Excluir Usuário">
                <span class="material-symbols-outlined text-base">delete</span>
              </button>
            ` : '<span class="text-on-surface-variant/50 text-[10px]">(Você)</span>'}
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
  }
}

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
      showToast('Novo usuário cadastrado!', 'success');
      document.getElementById('admin-create-user-form').reset();
      loadUsersList();
    } else {
      showToast(data.error || 'Erro ao criar usuário.', 'error');
    }
  } catch (err) {
    showToast('Erro de conexão.', 'error');
  }
}

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
      showToast('Cargo atualizado!', 'success');
      loadUsersList();
    } else {
      const data = await res.json();
      showToast(data.error || 'Erro ao alterar cargo.', 'error');
    }
  } catch (err) {
    console.error('Erro ao alterar cargo:', err);
  }
}

async function deleteUser(userId) {
  if (!confirm('Deseja realmente excluir este usuário? Todos os seus tickets serão removidos.')) return;

  try {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (res.ok) {
      showToast('Usuário excluído.', 'success');
      loadUsersList();
    } else {
      const data = await res.json();
      showToast(data.error || 'Erro ao excluir usuário.', 'error');
    }
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
  }
}

// Utilitários de Modal & Toast
function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function closeModalOnBackdrop(e, modalId) {
  if (e.target.id === modalId) {
    closeModal(modalId);
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  
  let typeBg = 'bg-surface-container border-primary text-primary';
  if (type === 'error') typeBg = 'bg-surface-container border-rose-500 text-rose-400';
  if (type === 'success') typeBg = 'bg-surface-container border-emerald-500 text-emerald-400';

  toast.className = `toast-item pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold ${typeBg}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-base">${type === 'success' ? 'check_circle' : 'info'}</span>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

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
