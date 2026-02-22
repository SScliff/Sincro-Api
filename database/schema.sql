-- ============================================================
-- Users Table (Authentication)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Proprietary Table
-- ============================================================
CREATE TABLE IF NOT EXISTS proprietary (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Tickets Table
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    model VARCHAR(50),
    proprietary_id INT REFERENCES proprietary(id) ON DELETE SET NULL,
    cost NUMERIC(10,2),
    description TEXT,
    status VARCHAR(50) DEFAULT 'Novo' CHECK (status IN ('Novo', 'em orçamento', 'em reparo', 'concluido', 'arquivado')),
    priority VARCHAR(50) DEFAULT 'Baixa' CHECK (priority IN ('Baixa', 'Média', 'Alta')),
    is_archived BOOLEAN DEFAULT FALSE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ticket_logs Table
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_logs (
    id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    usuario_nome VARCHAR(100) NOT NULL,
    acao TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);