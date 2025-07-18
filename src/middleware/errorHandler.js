// Middleware para tratar erros 404
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

// Middleware para tratar todos os erros
const errorHandler = (error, req, res, next) => {
    const status = error.status || 500;
    const message = error.message || 'Erro interno do servidor';
    
    // Log do erro
    console.error(`❌ Erro ${status}:`, {
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    // Resposta de erro
    const errorResponse = {
        error: getErrorType(status),
        message: message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };

    // Em desenvolvimento, incluir stack trace
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
    }

    res.status(status).json(errorResponse);
};

// Função auxiliar para determinar o tipo de erro
function getErrorType(status) {
    switch (status) {
        case 400:
            return 'Requisição inválida';
        case 401:
            return 'Não autorizado';
        case 403:
            return 'Proibido';
        case 404:
            return 'Não encontrado';
        case 409:
            return 'Conflito';
        case 422:
            return 'Entidade não processável';
        case 429:
            return 'Muitas requisições';
        case 500:
            return 'Erro interno do servidor';
        case 502:
            return 'Bad Gateway';
        case 503:
            return 'Serviço indisponível';
        default:
            return 'Erro desconhecido';
    }
}

// Middleware para capturar erros assíncronos
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    notFoundHandler,
    errorHandler,
    asyncHandler
};

