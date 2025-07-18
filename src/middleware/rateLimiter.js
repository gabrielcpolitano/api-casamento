const rateLimit = require('express-rate-limit');

// Rate limiter geral
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // máximo 100 requisições por janela
    message: {
        error: 'Muitas requisições',
        message: 'Você excedeu o limite de requisições. Tente novamente mais tarde.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true, // Retorna rate limit info nos headers `RateLimit-*`
    legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
    handler: (req, res) => {
        console.log(`🚫 Rate limit excedido para IP: ${req.ip}`);
        res.status(429).json({
            error: 'Muitas requisições',
            message: 'Você excedeu o limite de requisições. Tente novamente mais tarde.',
            retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
        });
    }
});

// Rate limiter mais restritivo para operações de escrita
const writeLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 20, // máximo 20 operações de escrita por janela
    message: {
        error: 'Muitas operações de escrita',
        message: 'Você excedeu o limite de operações de escrita. Tente novamente mais tarde.',
        retryAfter: 300 // 5 minutos
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚫 Rate limit de escrita excedido para IP: ${req.ip}`);
        res.status(429).json({
            error: 'Muitas operações de escrita',
            message: 'Você excedeu o limite de operações de escrita. Tente novamente mais tarde.',
            retryAfter: 300
        });
    }
});

// Rate limiter para operações de limpeza (mais restritivo)
const clearLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 operações de limpeza por hora
    message: {
        error: 'Muitas operações de limpeza',
        message: 'Você excedeu o limite de operações de limpeza. Tente novamente mais tarde.',
        retryAfter: 3600 // 1 hora
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚫 Rate limit de limpeza excedido para IP: ${req.ip}`);
        res.status(429).json({
            error: 'Muitas operações de limpeza',
            message: 'Você excedeu o limite de operações de limpeza. Tente novamente mais tarde.',
            retryAfter: 3600
        });
    }
});

module.exports = {
    generalLimiter,
    writeLimiter,
    clearLimiter
};

