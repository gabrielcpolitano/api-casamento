const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// Importar configurações e middlewares
const { connect } = require('./src/config/database');
const corsMiddleware = require('./src/middleware/cors');
const { generalLimiter, writeLimiter, clearLimiter } = require('./src/middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');
const WebSocketManager = require('./src/utils/websocketManager');

// Importar rotas
const earningsRoutes = require('./src/routes/earnings');

class Server {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        this.wsManager = new WebSocketManager(this.io);
        this.port = process.env.PORT || 5000;
        
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.startCleanupInterval();
    }

    initializeMiddlewares() {
        // Middleware de segurança
        this.app.use(helmet({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: false
        }));

        // Middleware de compressão
        this.app.use(compression());

        // Middleware de logging
        if (process.env.NODE_ENV === 'development') {
            this.app.use(morgan('dev'));
        } else {
            this.app.use(morgan('combined'));
        }

        // Middleware de CORS
        this.app.use(corsMiddleware);

        // Middleware de parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Servir arquivos estáticos
        this.app.use(express.static('public'));

        // Rate limiting geral
        this.app.use(generalLimiter);

        // Middleware para adicionar wsManager ao request
        this.app.use((req, res, next) => {
            req.wsManager = this.wsManager;
            req.io = this.io;
            next();
        });

        // Middleware de informações do servidor
        this.app.use((req, res, next) => {
            res.setHeader('X-Powered-By', 'Casamento Backend API');
            res.setHeader('X-API-Version', '1.0.0');
            next();
        });
    }

    initializeRoutes() {
        // Rota de health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                message: 'Servidor funcionando corretamente',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            });
        });

        // Rota raiz
        this.app.get('/', (req, res) => {
            res.json({
                message: '💕 API do Casamento 2026 - Rumo aos R$10.000! 💕',
                version: '1.0.0',
                endpoints: {
                    earnings: '/api/earnings',
                    health: '/health',
                    websocket: 'ws://localhost:' + this.port
                },
                documentation: 'https://github.com/seu-usuario/casamento-backend',
                timestamp: new Date().toISOString()
            });
        });

        // Rotas da API com rate limiting específico
        this.app.use('/api/earnings', 
            // Rate limiting para operações de escrita
            (req, res, next) => {
                if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
                    if (req.path === '/clear') {
                        return clearLimiter(req, res, next);
                    }
                    return writeLimiter(req, res, next);
                }
                next();
            },
            earningsRoutes
        );
    }

    startCleanupInterval() {
        // Executar limpeza de clientes inativos a cada 10 minutos
        setInterval(() => {
            this.wsManager.cleanupInactiveClients();
        }, 10 * 60 * 1000);

        console.log('🧹 Intervalo de limpeza de clientes inativos configurado (10 minutos)');
    }

    initializeErrorHandling() {
        // Middleware para rotas não encontradas
        this.app.use(notFoundHandler);

        // Middleware de tratamento de erros
        this.app.use(errorHandler);

        // Tratamento de erros não capturados
        process.on('uncaughtException', (error) => {
            console.error('❌ Erro não capturado:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Promise rejeitada não tratada:', reason);
            process.exit(1);
        });
    }

    async start() {
        try {
            // Conectar ao banco de dados
            console.log('🔗 Conectando ao banco de dados...');
            await connect();

            // Iniciar servidor
            this.server.listen(this.port, '0.0.0.0', () => {
                console.log('🚀 Servidor iniciado com sucesso!');
                console.log(`📍 URL: http://localhost:${this.port}`);
                console.log(`🌐 WebSocket: ws://localhost:${this.port}`);
                console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
                console.log(`💾 Banco de dados: ${process.env.DB_TYPE || 'sqlite'}`);
                console.log('📋 Endpoints disponíveis:');
                console.log('  - GET  / (informações da API)');
                console.log('  - GET  /health (status do servidor)');
                console.log('  - GET  /api/earnings (listar ganhos)');
                console.log('  - POST /api/earnings (criar ganho)');
                console.log('  - PUT  /api/earnings/:id (atualizar ganho)');
                console.log('  - DELETE /api/earnings/:id (deletar ganho)');
                console.log('  - DELETE /api/earnings/clear (limpar todos)');
                console.log('  - GET  /api/earnings/statistics (estatísticas)');
                console.log('💕 Pronto para ajudar no planejamento do casamento! 💕');
            });

        } catch (error) {
            console.error('❌ Erro ao iniciar servidor:', error);
            process.exit(1);
        }
    }

    async stop() {
        console.log('🛑 Parando servidor...');
        
        // Desconectar todos os clientes WebSocket
        this.wsManager.disconnectAllClients();
        
        return new Promise((resolve) => {
            this.server.close(() => {
                console.log('✅ Servidor parado');
                resolve();
            });
        });
    }
}

// Criar e iniciar servidor
const server = new Server();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Recebido SIGTERM, parando servidor...');
    await server.stop();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 Recebido SIGINT, parando servidor...');
    await server.stop();
    process.exit(0);
});

// Iniciar servidor se executado diretamente
if (require.main === module) {
    server.start();
}

module.exports = server;

