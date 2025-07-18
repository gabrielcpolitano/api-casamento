const cors = require('cors');

// Configuração de CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requisições sem origin (ex: aplicações mobile, Postman)
        if (!origin) return callback(null, true);
        
        // Permitir todas as origens em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        // Em produção, verificar origens permitidas
        const allowedOrigins = process.env.CORS_ORIGIN ? 
            process.env.CORS_ORIGIN.split(',') : ['*'];
        
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Não permitido pelo CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-Forwarded-For'
    ],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400 // 24 horas
};

module.exports = cors(corsOptions);

