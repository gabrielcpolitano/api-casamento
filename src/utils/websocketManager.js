const Earning = require('../models/Earning');

class WebSocketManager {
    constructor(io) {
        this.io = io;
        this.connectedClients = new Map();
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }

    handleConnection(socket) {
        const clientId = socket.id;
        const clientInfo = {
            id: clientId,
            connectedAt: new Date(),
            lastActivity: new Date(),
            ip: socket.handshake.address
        };

        this.connectedClients.set(clientId, clientInfo);
        
        console.log(`🔌 Cliente conectado: ${clientId} (${clientInfo.ip})`);
        console.log(`👥 Total de clientes conectados: ${this.connectedClients.size}`);

        // Enviar dados iniciais para o cliente
        this.sendInitialData(socket);

        // Configurar event listeners para este socket
        this.setupSocketEventListeners(socket);

        // Lidar com desconexão
        socket.on('disconnect', () => {
            this.handleDisconnection(clientId);
        });
    }

    async sendInitialData(socket) {
        try {
            const earnings = await Earning.findAll();
            const statistics = await Earning.getStatistics();

            socket.emit('connected', {
                message: 'Conectado ao servidor de sincronização',
                timestamp: new Date().toISOString(),
                clientId: socket.id
            });

            socket.emit('sync_data', {
                earnings: earnings.map(e => e.toJSON()),
                statistics: {
                    ...statistics,
                    meta_total: 10000,
                    falta: Math.max(10000 - statistics.total_value, 0),
                    porcentagem: Math.min((statistics.total_value / 10000) * 100, 100)
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Erro ao enviar dados iniciais:', error);
            socket.emit('sync_error', {
                message: 'Erro ao carregar dados iniciais',
                timestamp: new Date().toISOString()
            });
        }
    }

    setupSocketEventListeners(socket) {
        // Solicitação de sincronização manual
        socket.on('request_sync', async () => {
            await this.handleSyncRequest(socket);
        });

        // Ping/Pong para manter conexão ativa
        socket.on('ping', () => {
            socket.emit('pong', {
                timestamp: new Date().toISOString()
            });
            this.updateClientActivity(socket.id);
        });

        // Solicitação de estatísticas
        socket.on('request_statistics', async () => {
            await this.handleStatisticsRequest(socket);
        });

        // Notificação de atividade do cliente
        socket.on('client_activity', (data) => {
            this.updateClientActivity(socket.id, data);
        });
    }

    async handleSyncRequest(socket) {
        try {
            console.log(`🔄 Sincronização solicitada pelo cliente: ${socket.id}`);
            
            const earnings = await Earning.findAll();
            const statistics = await Earning.getStatistics();

            socket.emit('sync_data', {
                earnings: earnings.map(e => e.toJSON()),
                statistics: {
                    ...statistics,
                    meta_total: 10000,
                    falta: Math.max(10000 - statistics.total_value, 0),
                    porcentagem: Math.min((statistics.total_value / 10000) * 100, 100)
                },
                timestamp: new Date().toISOString()
            });

            this.updateClientActivity(socket.id);

        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            socket.emit('sync_error', {
                message: 'Erro ao sincronizar dados',
                timestamp: new Date().toISOString()
            });
        }
    }

    async handleStatisticsRequest(socket) {
        try {
            const statistics = await Earning.getStatistics();
            
            socket.emit('statistics_update', {
                ...statistics,
                meta_total: 10000,
                falta: Math.max(10000 - statistics.total_value, 0),
                porcentagem: Math.min((statistics.total_value / 10000) * 100, 100),
                timestamp: new Date().toISOString()
            });

            this.updateClientActivity(socket.id);

        } catch (error) {
            console.error('❌ Erro ao buscar estatísticas:', error);
            socket.emit('sync_error', {
                message: 'Erro ao buscar estatísticas',
                timestamp: new Date().toISOString()
            });
        }
    }

    handleDisconnection(clientId) {
        const clientInfo = this.connectedClients.get(clientId);
        
        if (clientInfo) {
            const connectionDuration = new Date() - clientInfo.connectedAt;
            console.log(`🔌 Cliente desconectado: ${clientId} (duração: ${Math.round(connectionDuration / 1000)}s)`);
            this.connectedClients.delete(clientId);
        }

        console.log(`👥 Total de clientes conectados: ${this.connectedClients.size}`);
    }

    updateClientActivity(clientId, activityData = null) {
        const clientInfo = this.connectedClients.get(clientId);
        if (clientInfo) {
            clientInfo.lastActivity = new Date();
            if (activityData) {
                clientInfo.lastActivityData = activityData;
            }
        }
    }

    // Métodos para broadcast de eventos
    broadcastEarningAdded(earning) {
        console.log('📢 Broadcasting: earning_added');
        this.io.emit('earning_added', {
            earning: earning.toJSON(),
            timestamp: new Date().toISOString()
        });
    }

    broadcastEarningUpdated(earning) {
        console.log('📢 Broadcasting: earning_updated');
        this.io.emit('earning_updated', {
            earning: earning.toJSON(),
            timestamp: new Date().toISOString()
        });
    }

    broadcastEarningDeleted(earning) {
        console.log('📢 Broadcasting: earning_deleted');
        this.io.emit('earning_deleted', {
            earning: earning.toJSON(),
            timestamp: new Date().toISOString()
        });
    }

    broadcastEarningsCleared(deletedCount) {
        console.log('📢 Broadcasting: earnings_cleared');
        this.io.emit('earnings_cleared', {
            deletedCount,
            timestamp: new Date().toISOString()
        });
    }

    async broadcastStatisticsUpdate() {
        try {
            const statistics = await Earning.getStatistics();
            
            console.log('📢 Broadcasting: statistics_update');
            this.io.emit('statistics_update', {
                ...statistics,
                meta_total: 10000,
                falta: Math.max(10000 - statistics.total_value, 0),
                porcentagem: Math.min((statistics.total_value / 10000) * 100, 100),
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Erro ao broadcast de estatísticas:', error);
        }
    }

    // Métodos de utilidade
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }

    getConnectedClientsInfo() {
        return Array.from(this.connectedClients.values());
    }

    disconnectAllClients() {
        console.log('🔌 Desconectando todos os clientes...');
        this.io.disconnectSockets();
        this.connectedClients.clear();
    }

    // Limpeza de clientes inativos (executar periodicamente)
    cleanupInactiveClients(maxInactiveTime = 30 * 60 * 1000) { // 30 minutos
        const now = new Date();
        let cleanedCount = 0;

        for (const [clientId, clientInfo] of this.connectedClients.entries()) {
            const inactiveTime = now - clientInfo.lastActivity;
            
            if (inactiveTime > maxInactiveTime) {
                console.log(`🧹 Removendo cliente inativo: ${clientId} (inativo por ${Math.round(inactiveTime / 1000)}s)`);
                this.connectedClients.delete(clientId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 ${cleanedCount} clientes inativos removidos`);
        }

        return cleanedCount;
    }
}

module.exports = WebSocketManager;

