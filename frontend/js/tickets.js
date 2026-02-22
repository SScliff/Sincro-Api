const api_base = "api/v1";
let tickets = [];

let lastStatus = "";
let lastPriority = "";
let lastCost = 0;

function showToast(message, type) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/index.html";
        return null;
    }

    try {
        const payload = token.split(".")[1];
        if (!payload) throw new Error("Token malformado");

        const user = JSON.parse(atob(payload)).name;
        if (!user) throw new Error("Campo 'name' ausente no token");

        const parts = user.split(" ");
        const initials = parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : "");

        document.getElementById("user-name").textContent = user;
        document.getElementById("user-initials").textContent = initials;
    } catch (err) {
        console.error("Token inválido:", err);
        localStorage.removeItem("token");
        showToast("Sessão inválida, faça login novamente", "error");
        setTimeout(() => window.location.href = "/index.html", 1500);
        return null;
    }

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
}

function getBadgeClass(value, type) {
    const statusMap = {
        "Novo": "badge--novo",
        "em orçamento": "badge--orcamento",
        "em reparo": "badge--reparo",
        "concluido": "badge--concluido",
        "arquivado": "badge--arquivado"
    };
    const priorityMap = {
        "Baixa": "badge--baixa",
        "Média": "badge--media",
        "Alta": "badge--alta"
    };
    return type === "status" ? statusMap[value] : priorityMap[value];
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric"
    });
}

function formatCost(value) {
    if (!value || value === "0.00" || value === 0) return "R$ 0,00";
    return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function loadProprietaries(selectedId = null) {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        const response = await fetch(`${api_base}/proprietary`, { headers });
        if (response.status === 401) { window.location.href = "/index.html"; return; }
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
    } catch (err) {
        console.error("Erro ao carregar proprietários", err);
    }
}

async function createProprietary(name, phone) {
    const headers = getAuthHeaders();
    if (!headers) return;

    const response = await fetch(`${api_base}/proprietary`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, phone })
    });
    if (!response.ok) throw new Error();
    return await response.json();
}

async function getTickets() {
    const headers = getAuthHeaders();
    if (!headers) return [];

    const response = await fetch(`${api_base}/tickets`, { headers });
    if (response.status === 401) { window.location.href = "/index.html"; return []; }
    return await response.json();
}

async function getTicketById(id) {
    const headers = getAuthHeaders();
    if (!headers) return null;

    const response = await fetch(`${api_base}/tickets/${id}`, { headers });
    if (response.status === 401) { window.location.href = "/index.html"; return null; }
    return await response.json();
}

async function loadTickets() {
    tickets = await getTickets();
    renderTickets(tickets);
}

function buildCard(ticket) {
    return `
        <div class="ticket-card" data-id="${ticket.id}">
            <div class="ticket-card__top">
                <span class="ticket-card__id">#${ticket.id}</span>
            </div>
            <p class="ticket-card__title">${ticket.title}</p>
            ${ticket.description ? `<p class="ticket-card__description">${ticket.description}</p>` : ""}
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

    document.querySelectorAll(".ticket-card").forEach(card => {
        card.onclick = () => openTicketDetail(card.dataset.id);
    });
}

function getLogType(acao = "") {
    const a = acao.toLowerCase();
    if (a.includes("status")) return "status";
    if (a.includes("prioridade")) return "prioridade";
    if (a.includes("custo")) return "custo";
    if (a.includes("arquiv")) return "arquivamento";
    return "";
}

async function renderHistory(ticketId) {
    const historyList = document.getElementById("history-list");
    if (!historyList) return;

    historyList.innerHTML = `
        <div class="history-item">
            <div class="history-item__card">
                <span class="history-date">Carregando histórico...</span>
            </div>
        </div>`;

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        const response = await fetch(`${api_base}/tickets/${ticketId}/log`, { headers });

        if (!response.ok) {
            historyList.innerHTML = `
                <div class="history-item">
                    <div class="history-item__card">
                        <span class="history-date">Erro ao carregar histórico.</span>
                    </div>
                </div>`;
            return;
        }

        const logs = await response.json();

        if (!logs || logs.length === 0) {
            historyList.innerHTML = `
                <div class="history-item">
                    <div class="history-item__card">
                        <span class="history-date">Sem histórico registrado.</span>
                    </div>
                </div>`;
            return;
        }

        // API já retorna ordenado DESC; sort como fallback
        const sorted = [...logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        historyList.innerHTML = sorted.map(log => {
            const type = getLogType(log.acao);
            return `
                <div class="history-item${type ? ` history-item--${type}` : ""}">
                    <div class="history-item__card">
                        <span class="history-date">${new Date(log.created_at).toLocaleString("pt-BR")}</span>
                        <p><strong>${log.usuario_nome}</strong> ${log.acao}</p>
                    </div>
                </div>`;
        }).join("");
    } catch (err) {
        console.error("Erro ao renderizar histórico:", err);
        historyList.innerHTML = `
            <div class="history-item">
                <div class="history-item__card">
                    <span class="history-date">Erro ao carregar histórico.</span>
                </div>
            </div>`;
    }
}

async function openTicketDetail(id) {
    try {
        const ticket = await getTicketById(id);
        if (!ticket) return;

        lastStatus = ticket.status;
        lastPriority = ticket.priority;
        lastCost = parseFloat(ticket.cost || 0);

        document.getElementById("d-id").textContent = `#${ticket.id}`;
        document.getElementById("d-title").textContent = ticket.title;
        document.getElementById("d-proprietary").textContent = ticket.proprietary_name || "—";
        document.getElementById("d-model").textContent = ticket.model || "—";
        document.getElementById("d-cost").textContent = formatCost(ticket.cost);
        document.getElementById("d-created").textContent = formatDate(ticket.created_at);
        document.getElementById("d-description").textContent = ticket.description || "—";

        const sBadge = document.getElementById("d-status-badge");
        sBadge.textContent = ticket.status;
        sBadge.className = `badge ${getBadgeClass(ticket.status, "status")}`;

        const pBadge = document.getElementById("d-priority-badge");
        pBadge.textContent = ticket.priority;
        pBadge.className = `badge ${getBadgeClass(ticket.priority, "priority")}`;

        document.getElementById("e-id").value = ticket.id;
        document.getElementById("e-status").value = ticket.status;
        document.getElementById("e-priority").value = ticket.priority;
        document.getElementById("e-cost").value = ticket.cost || "";

        openModal("modal-detail");
        await renderHistory(id);
    } catch (err) {
        console.error("Erro ao abrir detalhes:", err);
        showToast("Erro ao abrir detalhes", "error");
    }
}

function filterTickets() {
    const search = document.getElementById("search-input").value.toLowerCase();
    const status = document.getElementById("filter-status").value;
    const priority = document.getElementById("filter-priority").value;

    const filtered = tickets.filter(t => {
        const mSearch = t.title.toLowerCase().includes(search);
        const mStatus = status ? t.status === status : true;
        const mPriority = priority ? t.priority === priority : true;
        return mSearch && mStatus && mPriority;
    });

    renderTickets(filtered);
}

function initEvents() {
    document.getElementById("logout-btn").addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "/index.html";
    });

    document.getElementById("search-input").addEventListener("input", filterTickets);
    document.getElementById("filter-status").addEventListener("change", filterTickets);
    document.getElementById("filter-priority").addEventListener("change", filterTickets);

    document.getElementById("btn-new-ticket").addEventListener("click", () => {
        loadProprietaries();
        openModal("modal-create");
    });

    document.querySelector("[data-close='modal-create']").addEventListener("click", () => {
        closeModal("modal-create");
        document.getElementById("form-create").reset();
    });

    document.getElementById("form-create").addEventListener("submit", async (e) => {
        e.preventDefault();
        const headers = getAuthHeaders();
        if (!headers) return;

        const body = {
            title: document.getElementById("c-title").value,
            description: document.getElementById("c-description").value,
            model: document.getElementById("c-model").value,
            proprietary_id: parseInt(document.getElementById("c-proprietary").value) || null,
            priority: document.getElementById("c-priority").value,
            cost: parseFloat(document.getElementById("c-cost").value) || null,
        };
        try {
            const res = await fetch(`${api_base}/tickets`, {
                method: "POST",
                headers,
                body: JSON.stringify(body)
            });
            if (res.ok) {
                showToast("Ticket criado!", "success");
                closeModal("modal-create");
                document.getElementById("form-create").reset();
                await loadTickets();
            } else {
                showToast("Erro ao criar ticket", "error");
            }
        } catch (err) {
            showToast("Erro ao criar ticket", "error");
        }
    });

    document.getElementById("btn-new-proprietary").addEventListener("click", () => openModal("modal-proprietary"));

    document.querySelector("[data-close='modal-proprietary']").addEventListener("click", () => {
        closeModal("modal-proprietary");
        document.getElementById("form-proprietary").reset();
    });

    document.getElementById("form-proprietary").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("p-name").value;
        const phone = document.getElementById("p-phone").value;
        try {
            const created = await createProprietary(name, phone);
            showToast("Proprietário criado!", "success");
            closeModal("modal-proprietary");
            document.getElementById("form-proprietary").reset();
            await loadProprietaries(created.id);
        } catch (err) {
            showToast("Erro ao criar proprietário", "error");
        }
    });

    document.querySelector("[data-close='modal-detail']").addEventListener("click", () => closeModal("modal-detail"));

    // FIX: btn-archive movido para fora do form-edit no HTML,
    // mas garantimos e.preventDefault() e stopPropagation() aqui também
    document.getElementById("btn-archive").addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const id = document.getElementById("e-id").value;
        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const res = await fetch(`${api_base}/tickets/${id}/archive`, {
                method: "PATCH",
                headers
            });
            if (res.ok) {
                showToast("Ticket arquivado!", "success");
                closeModal("modal-detail");
                await loadTickets();
            } else {
                showToast("Erro ao arquivar", "error");
            }
        } catch (err) {
            showToast("Erro ao arquivar", "error");
        }
    });

    document.getElementById("form-edit").addEventListener("submit", async (e) => {
        e.preventDefault();

        const headers = getAuthHeaders();
        if (!headers) return;

        const nS = document.getElementById("e-status").value;
        const nP = document.getElementById("e-priority").value;
        const nC = parseFloat(document.getElementById("e-cost").value || 0);
        const id = document.getElementById("e-id").value;

        let logs = [];
        if (nS !== lastStatus) logs.push(`alterou status de "${lastStatus}" para "${nS}"`);
        if (nP !== lastPriority) logs.push(`mudou prioridade de "${lastPriority}" para "${nP}"`);
        if (nC !== lastCost) logs.push(`atualizou custo para ${formatCost(nC)}`);

        if (logs.length === 0) {
            showToast("Sem alterações", "info");
            return;
        }

        try {
            const res = await fetch(`${api_base}/tickets/${id}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ status: nS, priority: nP, cost: nC })
            });

            if (!res.ok) {
                showToast("Erro ao salvar alterações", "error");
                return;
            }

            // FIX: log em try/catch separado — erro no log não bloqueia o fechamento do modal
            try {
                await fetch(`${api_base}/tickets/${id}/log`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ action: logs.join(" e ") })
                });
            } catch (logErr) {
                console.warn("Erro ao salvar log:", logErr);
            }

            // Atualiza os valores de referência para refletir o estado salvo
            lastStatus = nS;
            lastPriority = nP;
            lastCost = nC;

            showToast("Atualizado!", "success");
            closeModal("modal-detail");
            await loadTickets();

        } catch (err) {
            showToast("Erro ao salvar", "error");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initEvents();
    loadTickets();
});