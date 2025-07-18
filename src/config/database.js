const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

class Database {
    constructor() {
        this.dbType = process.env.DB_TYPE || 'sqlite';
        this.connection = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            if (this.dbType === 'sqlite') {
                await this.connectSQLite();
            } else if (this.dbType === 'mysql') {
                await this.connectMySQL();
            } else {
                throw new Error(`Tipo de banco de dados não suportado: ${this.dbType}`);
            }
            
            this.isConnected = true;
            console.log(`✅ Conectado ao banco de dados ${this.dbType.toUpperCase()}`);
        } catch (error) {
            console.error('❌ Erro ao conectar ao banco de dados:', error);
            throw error;
        }
    }

    async connectSQLite() {
        const dbPath = path.resolve(process.env.DB_PATH || './database.sqlite');
        
        return new Promise((resolve, reject) => {
            this.connection = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`📁 Banco SQLite criado/conectado em: ${dbPath}`);
                    resolve();
                }
            });
        });
    }

    async connectMySQL() {
        this.connection = await mysql.createConnection(process.env.MYSQL_URL);
        console.log('🌐 Conectado ao MySQL (PlanetScale)');
    }

    async query(sql, params = []) {
        if (!this.isConnected) {
            await this.connect();
        }

        const start = Date.now();
        
        try {
            let result;
            
            if (this.dbType === 'sqlite') {
                result = await this.querySQLite(sql, params);
            } else if (this.dbType === 'mysql') {
                result = await this.queryMySQL(sql, params);
            }
            
            const duration = Date.now() - start;
            console.log('📊 Query executada:', { sql: sql.substring(0, 100), duration, rows: result.length || result.affectedRows });
            
            return result;
        } catch (error) {
            console.error('❌ Erro na query:', { sql, error: error.message });
            throw error;
        }
    }

    async querySQLite(sql, params) {
        return new Promise((resolve, reject) => {
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                this.connection.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            } else {
                this.connection.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve({ 
                        affectedRows: this.changes, 
                        insertId: this.lastID 
                    });
                });
            }
        });
    }

    async queryMySQL(sql, params) {
        const [rows] = await this.connection.execute(sql, params);
        return rows;
    }

    async testConnection() {
        try {
            if (this.dbType === 'sqlite') {
                await this.query('SELECT 1 as test');
            } else if (this.dbType === 'mysql') {
                await this.query('SELECT NOW() as test');
            }
            console.log('🔗 Teste de conexão bem-sucedido');
            return true;
        } catch (error) {
            console.error('❌ Erro no teste de conexão:', error);
            return false;
        }
    }

    async close() {
        if (this.connection) {
            if (this.dbType === 'sqlite') {
                this.connection.close();
            } else if (this.dbType === 'mysql') {
                await this.connection.end();
            }
            this.isConnected = false;
            console.log('🔌 Conexão com banco de dados fechada');
        }
    }
}

// Instância singleton
const database = new Database();

// Funções de conveniência
const query = async (sql, params) => {
    return await database.query(sql, params);
};

const testConnection = async () => {
    return await database.testConnection();
};

const connect = async () => {
    return await database.connect();
};

const close = async () => {
    return await database.close();
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Recebido SIGINT, fechando conexão com banco de dados...');
    await close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Recebido SIGTERM, fechando conexão com banco de dados...');
    await close();
    process.exit(0);
});

module.exports = {
    database,
    query,
    testConnection,
    connect,
    close
};

