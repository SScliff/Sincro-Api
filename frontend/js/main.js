const api_base = '/api/v1'; 

const token = localStorage.getItem('token');

const ticketForm = document.getElementById('ticket-form');
const ticketList = document.getElementById('ticket-list');
const refreshBtn = document.getElementById('refresh-btn');
const apiStatus = document.getElementById('api-status');
const delaySelect = document.getElementById('delay-select');
const logoutBtn = document.getElementById('logout-btn');

//------------------funções-------------------------------

async function checkApiHealth() {
    try {
        const res = await fetch(`${api_base}/health`);
        const data = await res.json();
        if (data.status === 'UP') {
            apiStatus.textContent = 'Online';
            apiStatus.className = 'status-indicator online';
        }
    } catch (err) {
        apiStatus.textContent = 'Offline';
        apiStatus.className = 'status-indicator offline';
    }
}

async function fetchTickets() {
    const delay = delaySelect.value;
    const start = Date.now();

    try {
        const res = await fetch(`${api_base}/tickets?delay=${delay}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 429) {
            showToast('Rate Limit Atingido! Aguarde um pouco.', 'error');
            return;
        }

        const tickets = await res.json();
        renderTickets(tickets);

        const duration = Date.now() - start;
        if (duration > 500) {
            showToast(`Lista carregada em ${duration}ms (Pool stress test)`, 'warning');
        }
    } catch (err) {
        console.error('Erro ao buscar tickets:', err);
        showToast('Erro ao conectar com a API', 'error');
    }
}

async function createTicket(ticket) {
    try {
        const res = await fetch(`${api_base}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(ticket)
        });

        if (res.status === 201) {
            showToast('Ticket criado com sucesso!');
            ticketForm.reset();
            fetchTickets();
        } else {
            const data = await res.json();
            if (data.details && Array.isArray(data.details)) {
                const firstError = data.details[0].message;
                showToast(firstError, 'error');
            } else {
                showToast(data.error || 'Erro ao criar ticket', 'error');
            }
        }
    } catch (err) {
        showToast('Erro de rede', 'error');
    }
}

async function deleteTicket(id) {
    try {
        const res = await fetch(`${api_base}/tickets/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            showToast('Ticket removido');
            fetchTickets();
        }
    } catch (err) {
        showToast('Erro ao remover', 'error');
    }
}

// --------------------ui rendering-------------------------------

function renderTickets(tickets) {
    if (tickets.length === 0) {
        ticketList.innerHTML = '<div class="loading">Nenhum chamado encontrado.</div>';
        return;
    }

    ticketList.innerHTML = tickets.map(ticket => {
        const statusClass = (ticket.status || '').toLowerCase().replace(/\s+/g, '_');
        const priorityClass = (ticket.priority || '').toLowerCase();

        return `
            <div class="ticket-card card">
                <span class="status-tag status-${statusClass}">${ticket.status}</span>
                <span class="priority-tag priority-${priorityClass}">${ticket.priority}</span>
                <h3>${ticket.title}</h3>
                <p>${ticket.description || 'Sem descrição'}</p>
                <div class="ticket-footer">
                    <span>#${ticket.id} • ${new Date(ticket.created_at).toLocaleDateString()}</span>
                    <div>
                        <button class="edit-btn" onclick="window.openEditModal(${JSON.stringify(ticket).replace(/"/g, '&quot;')})">Editar</button>
                        <button class="delete-btn" onclick="window.removeTicket(${ticket.id})">Apagar</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- Modal Control ---
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeModal = document.querySelector('.close-modal');

window.openEditModal = (ticket) => {
    document.getElementById('edit-id').value = ticket.id;
    document.getElementById('edit-title').value = ticket.title;
    document.getElementById('edit-description').value = ticket.description;
    document.getElementById('edit-status').value = ticket.status;
    document.getElementById('edit-priority').value = ticket.priority;
    editModal.style.display = 'flex';
};

closeModal.onclick = () => editModal.style.display = 'none';
window.onclick = (event) => {
    if (event.target === editModal) editModal.style.display = 'none';
};

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const updatedData = {
        status: document.getElementById('edit-status').value,
        priority: document.getElementById('edit-priority').value,
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-description').value
    };

    try {
        const res = await fetch(`${api_base}/tickets/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            showToast('Ticket atualizado!');
            editModal.style.display = 'none';
            fetchTickets();
        } else {
            showToast('Erro ao atualizar', 'error');
        }
    } catch (err) {
        showToast('Erro de rede', 'error');
    }
});

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'priority-high' : type === 'warning' ? 'priority-medium' : ''}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ----------------eventos--------------------

ticketForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ticket = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        priority: document.getElementById('priority').value
    };
    createTicket(ticket);
});

refreshBtn.addEventListener('click', fetchTickets);

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}

if (!token) {
    window.location.href = 'index.html';
}


window.removeTicket = deleteTicket;

//------------- carga inicial ------------------


checkApiHealth(); //trazer status da API
fetchTickets(); //buscar tickets do usuario
setInterval(checkApiHealth, 10000); // intervalo de atualização do status da API para monitoramento constante
