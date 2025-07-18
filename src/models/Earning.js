const { query, database } = require('../config/database');

class Earning {
    constructor(data) {
        this.id = data.id;
        this.valor = parseFloat(data.valor);
        this.descricao = data.descricao;
        this.data = data.data;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Criar um novo ganho
    static async create(earningData) {
        const { valor, descricao, data } = earningData;
        
        let queryText, params;
        
        if (database.dbType === 'sqlite') {
            queryText = `
                INSERT INTO earnings (valor, descricao, data, created_at, updated_at)
                VALUES (?, ?, ?, datetime('now'), datetime('now'))
            `;
            params = [valor, descricao, data];
        } else {
            queryText = `
                INSERT INTO earnings (valor, descricao, data, created_at, updated_at)
                VALUES (?, ?, ?, NOW(), NOW())
            `;
            params = [valor, descricao, data];
        }
        
        try {
            const result = await query(queryText, params);
            
            // Buscar o registro criado
            const insertId = result.insertId || result.lastID;
            return await this.findById(insertId);
        } catch (error) {
            console.error('Erro ao criar ganho:', error);
            throw error;
        }
    }

    // Buscar todos os ganhos
    static async findAll() {
        const queryText = `
            SELECT * FROM earnings 
            ORDER BY data DESC, created_at DESC
        `;
        
        try {
            const result = await query(queryText);
            return result.map(row => new Earning(row));
        } catch (error) {
            console.error('Erro ao buscar ganhos:', error);
            throw error;
        }
    }

    // Buscar ganho por ID
    static async findById(id) {
        const queryText = `
            SELECT * FROM earnings 
            WHERE id = ?
        `;
        
        try {
            const result = await query(queryText, [id]);
            if (!result || result.length === 0) {
                return null;
            }
            return new Earning(result[0]);
        } catch (error) {
            console.error('Erro ao buscar ganho por ID:', error);
            throw error;
        }
    }

    // Atualizar um ganho
    static async update(id, earningData) {
        const { valor, descricao, data } = earningData;
        
        let queryText;
        
        if (database.dbType === 'sqlite') {
            queryText = `
                UPDATE earnings 
                SET valor = ?, descricao = ?, data = ?, updated_at = datetime('now')
                WHERE id = ?
            `;
        } else {
            queryText = `
                UPDATE earnings 
                SET valor = ?, descricao = ?, data = ?, updated_at = NOW()
                WHERE id = ?
            `;
        }
        
        try {
            const result = await query(queryText, [valor, descricao, data, id]);
            
            if (result.affectedRows === 0) {
                return null;
            }
            
            return await this.findById(id);
        } catch (error) {
            console.error('Erro ao atualizar ganho:', error);
            throw error;
        }
    }

    // Deletar um ganho
    static async delete(id) {
        // Primeiro buscar o ganho para retornar
        const earning = await this.findById(id);
        if (!earning) {
            return null;
        }
        
        const queryText = `
            DELETE FROM earnings 
            WHERE id = ?
        `;
        
        try {
            const result = await query(queryText, [id]);
            
            if (result.affectedRows === 0) {
                return null;
            }
            
            return earning;
        } catch (error) {
            console.error('Erro ao deletar ganho:', error);
            throw error;
        }
    }

    // Deletar todos os ganhos
    static async deleteAll() {
        const queryText = `DELETE FROM earnings`;
        
        try {
            const result = await query(queryText);
            return result.affectedRows || 0;
        } catch (error) {
            console.error('Erro ao deletar todos os ganhos:', error);
            throw error;
        }
    }

    // Calcular total economizado
    static async getTotalEconomizado() {
        let queryText;
        
        if (database.dbType === 'sqlite') {
            queryText = `
                SELECT COALESCE(SUM(valor), 0) as total
                FROM earnings
            `;
        } else {
            queryText = `
                SELECT COALESCE(SUM(valor), 0) as total
                FROM earnings
            `;
        }
        
        try {
            const result = await query(queryText);
            return parseFloat(result[0].total);
        } catch (error) {
            console.error('Erro ao calcular total economizado:', error);
            throw error;
        }
    }

    // Buscar ganhos por período
    static async findByDateRange(startDate, endDate) {
        const queryText = `
            SELECT * FROM earnings 
            WHERE data BETWEEN ? AND ?
            ORDER BY data DESC, created_at DESC
        `;
        
        try {
            const result = await query(queryText, [startDate, endDate]);
            return result.map(row => new Earning(row));
        } catch (error) {
            console.error('Erro ao buscar ganhos por período:', error);
            throw error;
        }
    }

    // Estatísticas dos ganhos
    static async getStatistics() {
        let queryText;
        
        if (database.dbType === 'sqlite') {
            queryText = `
                SELECT 
                    COUNT(*) as total_count,
                    COALESCE(SUM(valor), 0) as total_value,
                    COALESCE(AVG(valor), 0) as average_value,
                    COALESCE(MIN(valor), 0) as min_value,
                    COALESCE(MAX(valor), 0) as max_value,
                    MIN(data) as first_date,
                    MAX(data) as last_date
                FROM earnings
            `;
        } else {
            queryText = `
                SELECT 
                    COUNT(*) as total_count,
                    COALESCE(SUM(valor), 0) as total_value,
                    COALESCE(AVG(valor), 0) as average_value,
                    COALESCE(MIN(valor), 0) as min_value,
                    COALESCE(MAX(valor), 0) as max_value,
                    MIN(data) as first_date,
                    MAX(data) as last_date
                FROM earnings
            `;
        }
        
        try {
            const result = await query(queryText);
            const stats = result[0];
            
            return {
                total_count: parseInt(stats.total_count),
                total_value: parseFloat(stats.total_value),
                average_value: parseFloat(stats.average_value),
                min_value: parseFloat(stats.min_value),
                max_value: parseFloat(stats.max_value),
                first_date: stats.first_date,
                last_date: stats.last_date
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            throw error;
        }
    }

    // Converter para JSON
    toJSON() {
        return {
            id: this.id,
            valor: this.valor,
            descricao: this.descricao,
            data: this.data,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Earning;

