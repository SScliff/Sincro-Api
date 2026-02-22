const { z } = require('zod');

// Schema de tickets para padronização de inputs do usuario

const ticketSchema = z.object({
    title: z.string().min(5, 'Titulo deve ter mais de 5 caracteres!').max(100),
    description: z.string().min(5).optional().or(z.literal('')),
    priority: z.enum(['Baixa', 'Média', 'Alta']),
    model: z.string().optional().or(z.literal('')),
    proprietary_id: z.coerce.number({ invalid_type_error: 'Proprietário inválido' }).int().positive(),
    cost: z.coerce.number().min(0).optional().default(0),
}).strict();

module.exports = { ticketSchema };