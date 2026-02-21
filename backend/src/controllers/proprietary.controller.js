const db = require('../services/db/db.service');
const AppError = require('../utils/AppError');
const { metrics } = require('../services/monitoring/metrics.service');

// ============================================================
// CREATE
// ============================================================
exports.create = async (req, res, next) => {
    const { name, phone } = req.body;

    if (!name) {
        return next(new AppError('O campo name é obrigatório', 400));
    }

    try {
        const query = `
            INSERT INTO proprietary 
                (name, phone)
            VALUES 
                ($1, $2)
            RETURNING *
        `;
        const values = [name, phone || null];

        const result = await db.query(query, values);
        metrics.proprietaryCreated.inc({ status: 'success' });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        metrics.proprietaryCreated.inc({ status: 'error' });
        next(error);
    }
};

// ============================================================
// FIND ALL
// ============================================================
exports.findAll = async (req, res, next) => {
    try {
        const delay = parseInt(req.query.delay) || 0;
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await db.query('SELECT * FROM proprietary ORDER BY name ASC');

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
        const result = await db.query('SELECT * FROM proprietary WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return next(new AppError('Proprietário não encontrado', 404));
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// ============================================================
// UPDATE
// ============================================================
exports.update = async (req, res, next) => {
    const { id } = req.params;
    const { name, phone } = req.body;

    if (!name && !phone) {
        return next(new AppError('Nenhum campo para atualizar foi enviado', 400));
    }

    try {
        const setClause = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) {
            setClause.push(`name = $${paramIndex++}`);
            values.push(name);
        }
        if (phone !== undefined) {
            setClause.push(`phone = $${paramIndex++}`);
            values.push(phone);
        }

        const query = `
            UPDATE proprietary
            SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(query, [...values, id]);

        if (result.rows.length === 0) {
            return next(new AppError('Proprietário não encontrado para atualização', 404));
        }

        metrics.proprietaryUpdated.inc({ status: 'success' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        metrics.proprietaryUpdated.inc({ status: 'error' });
        next(error);
    }
};

// ============================================================
// DELETE
// ============================================================
exports.delete = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'DELETE FROM proprietary WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return next(new AppError('Proprietário não encontrado para exclusão', 404));
        }

        metrics.proprietaryDeleted.inc({ status: 'success' });
        res.status(200).json({ message: 'Proprietário apagado com sucesso' });
    } catch (error) {
        metrics.proprietaryDeleted.inc({ status: 'error' });
        next(error);
    }
};