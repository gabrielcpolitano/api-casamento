const Earning = require('../models/Earning');
const Joi = require('joi');

// Schema de validação para ganhos
const earningSchema = Joi.object({
    valor: Joi.number().positive().precision(2).required()
        .messages({
            'number.base': 'Valor deve ser um número',
            'number.positive': 'Valor deve ser positivo',
            'any.required': 'Valor é obrigatório'
        }),
    descricao: Joi.string().min(1).max(255).required()
        .messages({
            'string.empty': 'Descrição não pode estar vazia',
            'string.max': 'Descrição deve ter no máximo 255 caracteres',
            'any.required': 'Descrição é obrigatória'
        }),
    data: Joi.date().iso().required()
        .messages({
            'date.base': 'Data deve estar em formato válido',
            'any.required': 'Data é obrigatória'
        })
});

class EarningsController {
    // Listar todos os ganhos
    static async getAllEarnings(req, res) {
        try {
            console.log('📋 Buscando todos os ganhos...');
            const earnings = await Earning.findAll();
            
            res.json(earnings.map(earning => earning.toJSON()));
        } catch (error) {
            console.error('❌ Erro ao buscar ganhos:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível buscar os ganhos'
            });
        }
    }

    // Buscar ganho por ID
    static async getEarningById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    error: 'ID inválido',
                    message: 'ID deve ser um número válido'
                });
            }

            console.log(`🔍 Buscando ganho com ID: ${id}`);
            const earning = await Earning.findById(parseInt(id));
            
            if (!earning) {
                return res.status(404).json({
                    error: 'Ganho não encontrado',
                    message: `Ganho com ID ${id} não foi encontrado`
                });
            }

            res.json(earning.toJSON());
        } catch (error) {
            console.error('❌ Erro ao buscar ganho por ID:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível buscar o ganho'
            });
        }
    }

    // Criar novo ganho
    static async createEarning(req, res) {
        try {
            // Validar dados de entrada
            const { error, value } = earningSchema.validate(req.body);
            
            if (error) {
                return res.status(400).json({
                    error: 'Dados inválidos',
                    message: error.details[0].message,
                    details: error.details
                });
            }

            console.log('➕ Criando novo ganho:', value);
            const earning = await Earning.create(value);
            
            // Emitir evento WebSocket
            if (req.wsManager) {
                req.wsManager.broadcastEarningAdded(earning);
                await req.wsManager.broadcastStatisticsUpdate();
            }

            res.status(201).json(earning.toJSON());
        } catch (error) {
            console.error('❌ Erro ao criar ganho:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível criar o ganho'
            });
        }
    }

    // Atualizar ganho
    static async updateEarning(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    error: 'ID inválido',
                    message: 'ID deve ser um número válido'
                });
            }

            // Validar dados de entrada
            const { error, value } = earningSchema.validate(req.body);
            
            if (error) {
                return res.status(400).json({
                    error: 'Dados inválidos',
                    message: error.details[0].message,
                    details: error.details
                });
            }

            console.log(`✏️ Atualizando ganho ID ${id}:`, value);
            const earning = await Earning.update(parseInt(id), value);
            
            if (!earning) {
                return res.status(404).json({
                    error: 'Ganho não encontrado',
                    message: `Ganho com ID ${id} não foi encontrado`
                });
            }

            // Emitir evento WebSocket
            if (req.wsManager) {
                req.wsManager.broadcastEarningUpdated(earning);
                await req.wsManager.broadcastStatisticsUpdate();
            }

            res.json(earning.toJSON());
        } catch (error) {
            console.error('❌ Erro ao atualizar ganho:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível atualizar o ganho'
            });
        }
    }

    // Deletar ganho
    static async deleteEarning(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    error: 'ID inválido',
                    message: 'ID deve ser um número válido'
                });
            }

            console.log(`🗑️ Deletando ganho ID: ${id}`);
            const earning = await Earning.delete(parseInt(id));
            
            if (!earning) {
                return res.status(404).json({
                    error: 'Ganho não encontrado',
                    message: `Ganho com ID ${id} não foi encontrado`
                });
            }

            // Emitir evento WebSocket
            if (req.wsManager) {
                req.wsManager.broadcastEarningDeleted(earning);
                await req.wsManager.broadcastStatisticsUpdate();
            }

            res.json({
                message: 'Ganho deletado com sucesso',
                earning: earning.toJSON()
            });
        } catch (error) {
            console.error('❌ Erro ao deletar ganho:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível deletar o ganho'
            });
        }
    }

    // Deletar todos os ganhos
    static async clearAllEarnings(req, res) {
        try {
            console.log('🗑️ Deletando todos os ganhos...');
            const deletedCount = await Earning.deleteAll();
            
            // Emitir evento WebSocket
            if (req.wsManager) {
                req.wsManager.broadcastEarningsCleared(deletedCount);
                await req.wsManager.broadcastStatisticsUpdate();
            }

            res.json({
                message: 'Todos os ganhos foram deletados com sucesso',
                deletedCount: deletedCount
            });
        } catch (error) {
            console.error('❌ Erro ao deletar todos os ganhos:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível deletar os ganhos'
            });
        }
    }

    // Obter estatísticas dos ganhos
    static async getEarningsStatistics(req, res) {
        try {
            console.log('📊 Calculando estatísticas dos ganhos...');
            const stats = await Earning.getStatistics();
            
            res.json({
                ...stats,
                meta_total: 10000,
                falta: Math.max(10000 - stats.total_value, 0),
                porcentagem: Math.min((stats.total_value / 10000) * 100, 100)
            });
        } catch (error) {
            console.error('❌ Erro ao calcular estatísticas:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível calcular as estatísticas'
            });
        }
    }

    // Buscar ganhos por período
    static async getEarningsByDateRange(req, res) {
        try {
            const { startDate, endDate } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({
                    error: 'Parâmetros inválidos',
                    message: 'startDate e endDate são obrigatórios'
                });
            }

            console.log(`📅 Buscando ganhos entre ${startDate} e ${endDate}`);
            const earnings = await Earning.findByDateRange(startDate, endDate);
            
            res.json(earnings.map(earning => earning.toJSON()));
        } catch (error) {
            console.error('❌ Erro ao buscar ganhos por período:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível buscar os ganhos por período'
            });
        }
    }
}

module.exports = EarningsController;

