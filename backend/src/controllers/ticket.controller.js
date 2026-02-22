const db = require('../services/db/db.service');
const AppError = require('../utils/AppError');
const { metrics } = require('../services/monitoring/metrics.service');

// ============================================================
// CREATE
// ============================================================
exports.create = async (req, res, next) => {
    const { title, description, priority, model, proprietary_id, cost } = req.body;

    if (!title) {
        return next(new AppError('O campo title é obrigatório', 400));
    }

    try {
        const query = `
            INSERT INTO tickets 
                (title, description, priority, model, proprietary_id, cost, user_id, status, is_archived)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, 'Novo', FALSE)
            RETURNING *
        `;
        const values = [
            title,
            description || null,
            priority || 'Baixa',
            model || null,
            proprietary_id || null,
            cost || null,
            req.user.id,
        ];

        const result = await db.query(query, values);
        metrics.ticketsCreated.inc({ status: 'success' });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        metrics.ticketsCreated.inc({ status: 'error' });
        next(error);
    }
};

// ============================================================
// FIND ALL
// Suporta filtros por status, priority e is_archived via query string
// Ex: GET /tickets?status=Novo&priority=Alta&archived=false
// ============================================================
exports.findAll = async (req, res, next) => {
    try {
        const delay = parseInt(req.query.delay) || 0;
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Por padrão oculta tickets arquivados, a menos que ?archived=true
        const showArchived = req.query.archived === 'true';
        const { status, priority } = req.query;

        const conditions = ['t.user_id = $1', `t.is_archived = $2`];
        const values = [req.user.id, showArchived];
        let paramIndex = 3;

        if (status) {
            conditions.push(`t.status = $${paramIndex++}`);
            values.push(status);
        }
        if (priority) {
            conditions.push(`t.priority = $${paramIndex++}`);
            values.push(priority);
        }

        const query = `
            SELECT 
                t.*,
                p.name  AS proprietary_name,
                p.phone AS proprietary_phone
            FROM tickets t
            LEFT JOIN proprietary p ON t.proprietary_id = p.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY t.created_at DESC
        `;

        const result = await db.query(query, values);

        if (!result) {
            throw new AppError('Falha ao recuperar registros do banco', 500);
        }

        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
};

// ============================================================
// FIND ONE
// ============================================================
exports.findOne = async (req, res, next) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                t.*,
                p.name  AS proprietary_name,
                p.phone AS proprietary_phone
            FROM tickets t
            LEFT JOIN proprietary p ON t.proprietary_id = p.id
            WHERE t.id = $1 AND t.user_id = $2
        `;

        const result = await db.query(query, [id, req.user.id]);

        if (result.rows.length === 0) {
            return next(new AppError('Ticket não encontrado', 404));
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// ============================================================
// UPDATE
// Atualiza apenas os campos enviados no body (patch parcial)
// ============================================================
exports.update = async (req, res, next) => {
    const { id } = req.params;
    const allowedFields = ['title', 'description', 'status', 'priority', 'model', 'proprietary_id', 'cost'];

    // Monta o SET dinamicamente com só os campos recebidos
    const fieldsToUpdate = Object.keys(req.body).filter(key => allowedFields.includes(key));

    if (fieldsToUpdate.length === 0) {
        return next(new AppError('Nenhum campo válido para atualizar foi enviado', 400));
    }

    try {
        const setClause = fieldsToUpdate
            .map((field, index) => `${field} = $${index + 1}`)
            .join(', ');

        const values = fieldsToUpdate.map(field => req.body[field]);
        const userIdParam = fieldsToUpdate.length + 1;
        const idParam = fieldsToUpdate.length + 2;

        const query = `
            UPDATE tickets
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $${userIdParam} AND id = $${idParam}
            RETURNING *
        `;

        const result = await db.query(query, [...values, req.user.id, id]);

        if (result.rows.length === 0) {
            return next(new AppError('Ticket não encontrado para atualização', 404));
        }

        metrics.ticketsUpdated.inc({ status: 'success' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        metrics.ticketsUpdated.inc({ status: 'error' });
        next(error);
    }
};

// ============================================================
// ARCHIVE (soft delete)
// Em vez de deletar, marca o ticket como arquivado
// ============================================================
exports.archive = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            `UPDATE tickets 
             SET is_archived = TRUE, status = 'arquivado', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return next(new AppError('Ticket não encontrado', 404));
        }

        res.status(200).json({ message: 'Ticket arquivado com sucesso', ticket: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// DELETE (hard delete — use com cautela)
// ============================================================
exports.delete = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'DELETE FROM tickets WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return next(new AppError('Ticket não encontrado para exclusão', 404));
        }

        metrics.ticketsDeleted.inc({ status: 'success' });
        res.status(200).json({ message: 'Ticket apagado com sucesso' });
    } catch (error) {
        metrics.ticketsDeleted.inc({ status: 'error' });
        next(error);
    }
};

exports.logTicketAction = async (req, res, next) => {
    const { id } = req.params;
    const { action } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO ticket_logs (ticket_id, usuario_nome, acao) VALUES ($1, $2, $3)',
            [id, req.user.name, action]
        );
        return result.rows[0];
    } catch (error) {
        next(error);
    }
};

exports.getTicketLogs = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM ticket_logs WHERE ticket_id = $1 ORDER BY created_at DESC',
            [id]
        );
        return res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
};
