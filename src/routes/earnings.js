const express = require('express');
const EarningsController = require('../controllers/earningsController');

const router = express.Router();

// Middleware para adicionar timestamp nas requisições
router.use((req, res, next) => {
    req.timestamp = new Date().toISOString();
    console.log(`🌐 ${req.method} ${req.originalUrl} - ${req.timestamp}`);
    next();
});

// Rotas para ganhos
router.get('/', EarningsController.getAllEarnings);
router.get('/statistics', EarningsController.getEarningsStatistics);
router.get('/date-range', EarningsController.getEarningsByDateRange);
router.get('/:id', EarningsController.getEarningById);
router.post('/', EarningsController.createEarning);
router.put('/:id', EarningsController.updateEarning);
router.delete('/clear', EarningsController.clearAllEarnings);
router.delete('/:id', EarningsController.deleteEarning);

module.exports = router;

