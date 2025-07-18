# 💕 Backend do Aplicativo de Planejamento de Casamento

Um backend completo em Node.js para gerenciar ganhos financeiros para o planejamento de casamento, com meta de R$10.000 até fevereiro de 2026.

## 🚀 Características

- **API RESTful** completa para gerenciamento de ganhos
- **WebSocket** para sincronização em tempo real
- **Banco de dados** SQLite (com suporte a MySQL/PlanetScale)
- **Validação** de dados com Joi
- **Rate limiting** para proteção contra abuso
- **CORS** configurado para acesso cross-origin
- **Logs** detalhados para monitoramento
- **Frontend** integrado com interface responsiva

## 📋 Pré-requisitos

- Node.js 18.0.0 ou superior
- npm ou yarn

## 🛠️ Instalação

1. **Clone ou baixe o projeto:**
   ```bash
   cd casamento-backend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o banco de dados:**
   ```bash
   npm run init-db
   ```

4. **Inicie o servidor:**
   ```bash
   npm start
   ```

   Para desenvolvimento com auto-reload:
   ```bash
   npm run dev
   ```

## 🌐 Acesso

- **API:** http://localhost:5001
- **Frontend:** http://localhost:5001/index.html
- **WebSocket:** ws://localhost:5001

## 📚 Documentação da API

### Endpoints Principais

#### 🏥 Health Check
```
GET /health
```
Retorna o status do servidor.

**Resposta:**
```json
{
  "status": "OK",
  "message": "Servidor funcionando corretamente",
  "timestamp": "2025-07-18T21:30:00.000Z",
  "uptime": 123.45,
  "version": "1.0.0",
  "environment": "development"
}
```

#### 📊 Listar Ganhos
```
GET /api/earnings
```
Retorna todos os ganhos ordenados por data (mais recente primeiro).

**Resposta:**
```json
[
  {
    "id": 1,
    "valor": 500.00,
    "descricao": "Freelance desenvolvimento",
    "data": "2024-01-15",
    "created_at": "2025-07-18 21:22:55",
    "updated_at": "2025-07-18 21:22:55"
  }
]
```

#### ➕ Criar Ganho
```
POST /api/earnings
Content-Type: application/json
```

**Body:**
```json
{
  "valor": 250.50,
  "descricao": "Venda de item",
  "data": "2024-07-18"
}
```

**Resposta:**
```json
{
  "id": 4,
  "valor": 250.50,
  "descricao": "Venda de item",
  "data": "2024-07-18",
  "created_at": "2025-07-18 21:30:00",
  "updated_at": "2025-07-18 21:30:00"
}
```

#### 🔍 Buscar Ganho por ID
```
GET /api/earnings/:id
```

#### ✏️ Atualizar Ganho
```
PUT /api/earnings/:id
Content-Type: application/json
```

**Body:**
```json
{
  "valor": 300.00,
  "descricao": "Descrição atualizada",
  "data": "2024-07-18"
}
```

#### 🗑️ Deletar Ganho
```
DELETE /api/earnings/:id
```

#### 🧹 Limpar Todos os Ganhos
```
DELETE /api/earnings/clear
```

#### 📈 Estatísticas
```
GET /api/earnings/statistics
```

**Resposta:**
```json
{
  "total_count": 3,
  "total_value": 1550.00,
  "average_value": 516.67,
  "min_value": 300.00,
  "max_value": 750.00,
  "first_date": "2024-01-15",
  "last_date": "2024-02-01",
  "meta_total": 10000,
  "falta": 8450.00,
  "porcentagem": 15.50
}
```

#### 📅 Ganhos por Período
```
GET /api/earnings/date-range?startDate=2024-01-01&endDate=2024-12-31
```

### 🔒 Rate Limiting

- **Geral:** 100 requisições por 15 minutos
- **Escrita:** 20 operações por 5 minutos
- **Limpeza:** 3 operações por hora

### ❌ Códigos de Erro

- `400` - Dados inválidos
- `404` - Recurso não encontrado
- `429` - Rate limit excedido
- `500` - Erro interno do servidor

## 🌐 WebSocket

### Eventos do Cliente para Servidor

- `request_sync` - Solicita sincronização de dados
- `ping` - Mantém conexão ativa
- `request_statistics` - Solicita estatísticas atualizadas

### Eventos do Servidor para Cliente

- `connected` - Confirmação de conexão
- `sync_data` - Dados sincronizados
- `earning_added` - Novo ganho adicionado
- `earning_updated` - Ganho atualizado
- `earning_deleted` - Ganho removido
- `earnings_cleared` - Todos os ganhos removidos
- `statistics_update` - Estatísticas atualizadas
- `sync_error` - Erro na sincronização

### Exemplo de Uso WebSocket

```javascript
const socket = io('http://localhost:5001');

socket.on('connect', () => {
    console.log('Conectado ao servidor');
});

socket.on('sync_data', (data) => {
    console.log('Dados recebidos:', data);
});

socket.emit('request_sync');
```

## 🗄️ Banco de Dados

### Configuração

O projeto suporta dois tipos de banco de dados:

#### SQLite (Padrão)
```env
DB_TYPE=sqlite
DB_PATH=./database.sqlite
```

#### MySQL (PlanetScale)
```env
DB_TYPE=mysql
MYSQL_URL=mysql://user:password@host/database
```

### Schema da Tabela `earnings`

```sql
CREATE TABLE earnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
    descricao TEXT NOT NULL,
    data DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# Servidor
PORT=5001
NODE_ENV=development

# Banco de Dados
DB_TYPE=sqlite
DB_PATH=./database.sqlite

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logs
LOG_LEVEL=info
```

## 📁 Estrutura do Projeto

```
casamento-backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuração do banco de dados
│   ├── controllers/
│   │   └── earningsController.js # Controlador dos ganhos
│   ├── middleware/
│   │   ├── cors.js              # Configuração CORS
│   │   ├── rateLimiter.js       # Rate limiting
│   │   └── errorHandler.js      # Tratamento de erros
│   ├── models/
│   │   └── Earning.js           # Modelo de dados dos ganhos
│   ├── routes/
│   │   └── earnings.js          # Rotas da API
│   └── utils/
│       └── websocketManager.js  # Gerenciador WebSocket
├── scripts/
│   └── init-db.js               # Script de inicialização do DB
├── public/
│   └── index.html               # Frontend integrado
├── server.js                    # Servidor principal
├── package.json                 # Dependências e scripts
├── .env                         # Configurações de ambiente
└── README.md                    # Esta documentação
```

## 🧪 Testes

### Testar API com curl

```bash
# Health check
curl http://localhost:5001/health

# Listar ganhos
curl http://localhost:5001/api/earnings

# Criar ganho
curl -X POST http://localhost:5001/api/earnings \
  -H "Content-Type: application/json" \
  -d '{"valor": 100.00, "descricao": "Teste", "data": "2024-07-18"}'

# Estatísticas
curl http://localhost:5001/api/earnings/statistics
```

## 🚀 Deploy

### Desenvolvimento Local
```bash
npm start
```

### Produção
1. Configure as variáveis de ambiente para produção
2. Use um processo manager como PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name casamento-backend
   ```

## 🔧 Troubleshooting

### Porta em uso
Se a porta 5001 estiver em uso, altere no arquivo `.env`:
```env
PORT=5002
```

### Erro de conexão com banco
Verifique se o arquivo de banco SQLite tem permissões corretas:
```bash
chmod 664 database.sqlite
```

### WebSocket não conecta
Verifique se o CORS está configurado corretamente e se não há firewall bloqueando a conexão.

## 📝 Logs

O servidor gera logs detalhados incluindo:
- Conexões WebSocket
- Queries do banco de dados
- Requisições HTTP
- Erros e exceções

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 💕 Sobre

Este projeto foi desenvolvido para ajudar no planejamento financeiro de um casamento, permitindo o acompanhamento em tempo real dos ganhos em direção à meta de R$10.000 até fevereiro de 2026.

**Características especiais:**
- Interface responsiva e intuitiva
- Sincronização em tempo real entre múltiplos dispositivos
- Validação robusta de dados
- Proteção contra abuso com rate limiting
- Suporte a múltiplos tipos de banco de dados
- Logs detalhados para monitoramento

---

💕 **Feito com amor para nosso futuro juntos!** 💕

