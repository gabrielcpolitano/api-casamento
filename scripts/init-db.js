const { query, testConnection, connect, database } = require('../src/config/database');

// SQL para criar a tabela de ganhos (SQLite)
const createEarningsTableSQLite = `
    CREATE TABLE IF NOT EXISTS earnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
        descricao TEXT NOT NULL,
        data DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`;

// SQL para criar a tabela de ganhos (MySQL)
const createEarningsTableMySQL = `
    CREATE TABLE IF NOT EXISTS earnings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
        descricao VARCHAR(255) NOT NULL,
        data DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
`;

// SQL para criar índices (SQLite)
const createIndexesSQLite = `
    CREATE INDEX IF NOT EXISTS idx_earnings_data ON earnings(data);
    CREATE INDEX IF NOT EXISTS idx_earnings_created_at ON earnings(created_at);
`;

// SQL para criar índices (MySQL)
const createIndexesMySQL = `
    CREATE INDEX idx_earnings_data ON earnings(data);
    CREATE INDEX idx_earnings_created_at ON earnings(created_at);
`;

// SQL para inserir dados de exemplo
const insertSampleData = `
    INSERT INTO earnings (valor, descricao, data) 
    VALUES 
        (500.00, 'Freelance desenvolvimento', '2024-01-15'),
        (300.00, 'Venda de itens usados', '2024-01-20'),
        (750.00, 'Trabalho extra', '2024-02-01')
`;

async function initializeDatabase() {
    console.log('🚀 Iniciando configuração do banco de dados...');
    console.log(`📋 Tipo de banco: ${database.dbType.toUpperCase()}`);
    
    try {
        // Conectar ao banco
        await connect();
        
        // Testar conexão
        console.log('🔍 Testando conexão com o banco de dados...');
        const connectionTest = await testConnection();
        
        if (!connectionTest) {
            throw new Error('Falha na conexão com o banco de dados');
        }

        // Criar tabela de ganhos
        console.log('📋 Criando tabela de ganhos...');
        
        if (database.dbType === 'sqlite') {
            await query(createEarningsTableSQLite);
        } else if (database.dbType === 'mysql') {
            await query(createEarningsTableMySQL);
        }
        
        console.log('✅ Tabela "earnings" criada com sucesso');

        // Criar índices
        console.log('🔍 Criando índices...');
        
        try {
            if (database.dbType === 'sqlite') {
                await query(createIndexesSQLite);
            } else if (database.dbType === 'mysql') {
                // Para MySQL, verificar se os índices já existem
                try {
                    await query(createIndexesMySQL);
                } catch (indexError) {
                    if (!indexError.message.includes('Duplicate key name')) {
                        throw indexError;
                    }
                    console.log('📝 Índices já existem');
                }
            }
            console.log('✅ Índices criados com sucesso');
        } catch (indexError) {
            console.log('⚠️ Aviso ao criar índices:', indexError.message);
        }

        // Verificar se a tabela está vazia
        const countResult = await query('SELECT COUNT(*) as count FROM earnings');
        const recordCount = parseInt(countResult[0].count);

        if (recordCount === 0) {
            console.log('📝 Inserindo dados de exemplo...');
            
            if (database.dbType === 'sqlite') {
                // Para SQLite, inserir um por vez para evitar conflitos
                const sampleData = [
                    [500.00, 'Freelance desenvolvimento', '2024-01-15'],
                    [300.00, 'Venda de itens usados', '2024-01-20'],
                    [750.00, 'Trabalho extra', '2024-02-01']
                ];
                
                for (const [valor, descricao, data] of sampleData) {
                    await query(
                        'INSERT INTO earnings (valor, descricao, data) VALUES (?, ?, ?)',
                        [valor, descricao, data]
                    );
                }
            } else {
                await query(insertSampleData);
            }
            
            console.log('✅ Dados de exemplo inseridos com sucesso');
        } else {
            console.log(`📊 Tabela já contém ${recordCount} registros`);
        }

        // Verificar estrutura da tabela
        let tableInfo;
        
        if (database.dbType === 'sqlite') {
            tableInfo = await query("PRAGMA table_info(earnings)");
            console.log('📋 Estrutura da tabela "earnings" (SQLite):');
            if (Array.isArray(tableInfo)) {
                tableInfo.forEach(column => {
                    console.log(`  - ${column.name}: ${column.type} ${column.notnull ? '(NOT NULL)' : ''}`);
                });
            } else {
                console.log('  - Estrutura da tabela criada com sucesso');
            }
        } else if (database.dbType === 'mysql') {
            tableInfo = await query("DESCRIBE earnings");
            console.log('📋 Estrutura da tabela "earnings" (MySQL):');
            if (Array.isArray(tableInfo)) {
                tableInfo.forEach(column => {
                    console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : ''}`);
                });
            }
        }

        // Mostrar estatísticas
        const stats = await query(`
            SELECT 
                COUNT(*) as total_records,
                COALESCE(SUM(valor), 0) as total_value
            FROM earnings
        `);
        
        console.log('📊 Estatísticas atuais:');
        console.log(`  - Total de registros: ${stats[0].total_records}`);
        console.log(`  - Valor total: R$ ${parseFloat(stats[0].total_value).toFixed(2)}`);

        console.log('🎉 Banco de dados configurado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao configurar banco de dados:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('✅ Configuração concluída');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erro na configuração:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };

