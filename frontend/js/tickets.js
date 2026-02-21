const api_base = "api/v1";
let tickets = []; // array global para os filtros terem acesso sem nova requisição

// ── Utilitários ────────────────────────────────────────────

// exibe uma notificação temporária no canto da tela
function showToast(message, type) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.classList.add("toast", `toast--${type}`);
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// lê o token, exibe nome/iniciais no header e retorna os headers autenticados
function getAuthHeaders() {
    const token = localStorage.getItem("token");
    if (!token) {
        showToast("Token não encontrado", "error");
        window.location.href = "/index.html";
        return;
    }
    const user = JSON.parse(atob(token.split(".")[1])).name;
    const parts = user.split(" ");
    const initials = parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
    document.getElementById("user-name").textContent = user;
    document.getElementById("user-initials").textContent = initials;
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    }
}

// abre o modal pelo id do overlay
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
}

// fecha o modal pelo id do overlay
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
}

// retorna a classe CSS correta do badge conforme valor e tipo
function getBadgeClass(value, type) {
    const statusMap = {
        "Novo": "badge--novo",
        "em orçamento": "badge--orcamento",
        "em reparo": "badge--reparo",
        "concluido": "badge--concluido",
        "arquivado": "badge--arquivado"
    }
    const priorityMap = {
        "Baixa": "badge--baixa",
        "Média": "badge--media",
        "Alta": "badge--alta"
    }
    return type === "status" ? statusMap[value] : priorityMap[value];
}

// formata data para pt-BR
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric"
    });
}

// formata número para moeda brasileira
function formatCost(value) {
    if (!value) return "—";
    return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── Dados — Proprietários ──────────────────────────────────

// busca proprietários e popula o select, pré-selecionando o selectedId se informado
async function loadProprietaries(selectedId = null) {
    const headers = getAuthHeaders();
    const response = await fetch(`${api_base}/proprietary`, { headers });
    const data = await response.json();
    const select = document.getElementById("c-proprietary");
    select.innerHTML = `<option value="">Selecione...</option>`;
    data.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name;
        if (selectedId && p.id === selectedId) option.selected = true;
        select.appendChild(option);
    });
}

// cria um novo proprietário e retorna o objeto criado
async function createProprietary(name, phone) {
    const headers = getAuthHeaders();
    const response = await fetch(`${api_base}/proprietary`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, phone })
    });
    if (!response.ok) throw new Error("Erro ao criar proprietário");
    return await response.json();
}

// ── Dados — Tickets ────────────────────────────────────────

// busca todos os tickets do usuário
async function getTickets() {
    const headers = getAuthHeaders();
    const response = await fetch(`${api_base}/tickets`, { headers });
    if (response.status === 401) {
        showToast("Token inválido", "error");
        window.location.href = "/index.html";
    }
    return await response.json();
}

// busca um ticket específico pelo id
async function getTicketById(id) {
    const headers = getAuthHeaders();
    const response = await fetch(`${api_base}/tickets/${id}`, { headers });
    if (!response.ok) throw new Error("Ticket não encontrado");
    return await response.json();
}

// orquestra: busca, salva no array global e renderiza
async function loadTickets() {
    tickets = await getTickets();
    renderTickets(tickets);
}

// ── Render ─────────────────────────────────────────────────

// monta o HTML de um card individual
function buildCard(ticket) {
    return `
        <div class="ticket-card" data-id="${ticket.id}">
            <div class="ticket-card__top">
                <span class="ticket-card__id">#${ticket.id}</span>
            </div>
            <p class="ticket-card__title">${ticket.title}</p>
            ${ticket.description
            ? `<p class="ticket-card__description">${ticket.description}</p>`
            : ""}
            <div class="ticket-card__meta">
                ${ticket.proprietary_name ? `<span>👤 ${ticket.proprietary_name}</span>` : ""}
                ${ticket.model ? `<span>🔧 ${ticket.model}</span>` : ""}
            </div>
            <div class="ticket-card__badges">
                <span class="badge ${getBadgeClass(ticket.status, "status")}">${ticket.status}</span>
                <span class="badge ${getBadgeClass(ticket.priority, "priority")}">${ticket.priority}</span>
            </div>
        </div>
    `;
}

// renderiza a lista ou o empty state conforme o array recebido
function renderTickets(list) {
    const grid = document.getElementById("tickets-grid");
    const emptyState = document.getElementById("empty-state");
    const counter = document.getElementById("tickets-count");

    if (list.length === 0) {
        grid.style.display = "none";
        emptyState.style.display = "flex";
        counter.textContent = "Nenhum ticket encontrado";
        return;
    }

    emptyState.style.display = "none";
    grid.style.display = "grid";
    counter.textContent = `${list.length} ticket(s) encontrado(s)`;
    grid.innerHTML = list.map(ticket => buildCard(ticket)).join("");

    // adiciona clique em cada card após o innerHTML ser atribuído
    document.querySelectorAll(".ticket-card").forEach(card => {
        card.addEventListener("click", () => openTicketDetail(card.dataset.id));
    });
}

// popula e abre o modal de detalhe com os dados do ticket
async function openTicketDetail(id) {
    try {
        const ticket = await getTicketById(id);

        // preenche os campos de exibição
        document.getElementById("d-id").textContent = `#${ticket.id}`;
        document.getElementById("d-title").textContent = ticket.title;
        document.getElementById("d-proprietary").textContent = ticket.proprietary_name || "—";
        document.getElementById("d-model").textContent = ticket.model || "—";
        document.getElementById("d-cost").textContent = formatCost(ticket.cost);
        document.getElementById("d-created").textContent = formatDate(ticket.created_at);
        document.getElementById("d-description").textContent = ticket.description || "—";

        // aplica as classes corretas nos badges
        const statusBadge = document.getElementById("d-status-badge");
        statusBadge.textContent = ticket.status;
        statusBadge.className = `badge ${getBadgeClass(ticket.status, "status")}`;

        const priorityBadge = document.getElementById("d-priority-badge");
        priorityBadge.textContent = ticket.priority;
        priorityBadge.className = `badge ${getBadgeClass(ticket.priority, "priority")}`;

        // pré-seleciona os campos editáveis com os valores atuais do ticket
        document.getElementById("e-id").value = ticket.id;
        document.getElementById("e-status").value = ticket.status;
        document.getElementById("e-priority").value = ticket.priority;
        document.getElementById("e-cost").value = ticket.cost || "";

        openModal("modal-detail");
    } catch {
        showToast("Erro ao carregar ticket", "error");
    }
}

// filtra o array global com base nos três campos da toolbar e rerenderiza
function filterTickets() {
    const search = document.getElementById("search-input").value.toLowerCase();
    const status = document.getElementById("filter-status").value;
    const priority = document.getElementById("filter-priority").value;

    const filtered = tickets.filter(ticket => {
        const matchSearch = ticket.title.toLowerCase().includes(search);
        const matchStatus = status ? ticket.status === status : true;
        const matchPriority = priority ? ticket.priority === priority : true;
        return matchSearch && matchStatus && matchPriority;
    });

    renderTickets(filtered);
}

// ── Eventos ────────────────────────────────────────────────

function initEvents() {

    // header — logout
    document.getElementById("logout-btn")
        .addEventListener("click", () => {
            localStorage.removeItem("token");
            window.location.href = "/index.html";
        });

    // toolbar — os três chamam a mesma função de filtro
    document.getElementById("search-input").addEventListener("input", filterTickets);
    document.getElementById("filter-status").addEventListener("change", filterTickets);
    document.getElementById("filter-priority").addEventListener("change", filterTickets);

    // modal criar — abrir e já carregar proprietários no select
    document.getElementById("btn-new-ticket")
        .addEventListener("click", () => {
            loadProprietaries();
            openModal("modal-create");
        });

    // modal criar — fechar e limpar form
    document.querySelector("[data-close='modal-create']")
        .addEventListener("click", () => {
            closeModal("modal-create");
            document.getElementById("form-create").reset();
        });

    // modal criar — submit
    document.getElementById("form-create")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            const body = {
                title: document.getElementById("c-title").value,
                description: document.getElementById("c-description").value,
                model: document.getElementById("c-model").value,
                proprietary_id: parseInt(document.getElementById("c-proprietary").value) || null,
                priority: document.getElementById("c-priority").value,
                cost: parseFloat(document.getElementById("c-cost").value) || null,
            };
            try {
                const response = await fetch(`${api_base}/tickets`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(body)
                });
                if (!response.ok) throw new Error();
                showToast("Ticket criado com sucesso", "success");
                closeModal("modal-create");
                document.getElementById("form-create").reset();
                await loadTickets();
            } catch {
                showToast("Erro ao criar ticket", "error");
            }
        });

    // modal proprietário — abrir pelo botão "+"
    document.getElementById("btn-new-proprietary")
        .addEventListener("click", () => openModal("modal-proprietary"));

    // modal proprietário — fechar e limpar form
    document.querySelector("[data-close='modal-proprietary']")
        .addEventListener("click", () => {
            closeModal("modal-proprietary");
            document.getElementById("form-proprietary").reset();
        });

    // modal proprietário — submit: cria e já pré-seleciona no select
    document.getElementById("form-proprietary")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("p-name").value;
            const phone = document.getElementById("p-phone").value;
            try {
                const created = await createProprietary(name, phone);
                showToast("Proprietário criado com sucesso", "success");
                closeModal("modal-proprietary");
                document.getElementById("form-proprietary").reset();
                await loadProprietaries(created.id); // pré-seleciona o novo
            } catch {
                showToast("Erro ao criar proprietário", "error");
            }
        });

    // modal detalhe — fechar
    document.querySelector("[data-close='modal-detail']")
        .addEventListener("click", () => closeModal("modal-detail"));

    // modal detalhe — arquivar ticket
    document.getElementById("btn-archive")
        .addEventListener("click", async () => {
            const id = document.getElementById("e-id").value;
            try {
                const response = await fetch(`${api_base}/tickets/${id}/archive`, {
                    method: "PATCH",
                    headers: getAuthHeaders()
                });
                if (!response.ok) throw new Error();
                showToast("Ticket arquivado", "success");
                closeModal("modal-detail");
                await loadTickets();
            } catch {
                showToast("Erro ao arquivar ticket", "error");
            }
        });

    // modal detalhe — submit edição
    document.getElementById("form-edit")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("e-id").value;
            const body = {
                status: document.getElementById("e-status").value,
                priority: document.getElementById("e-priority").value,
                cost: document.getElementById("e-cost").value || null,
            };
            try {
                const response = await fetch(`${api_base}/tickets/${id}`, {
                    method: "PATCH",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(body)
                });
                if (!response.ok) throw new Error();
                showToast("Ticket atualizado", "success");
                closeModal("modal-detail");
                await loadTickets();
            } catch {
                showToast("Erro ao atualizar ticket", "error");
            }
        });
}

// ── Inicialização ──────────────────────────────────────────

initEvents();
loadTickets();